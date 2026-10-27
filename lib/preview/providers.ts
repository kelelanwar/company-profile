export type PreviewMode = "edit" | "generate";

export type ProviderConfig = {
  provider: "ruvicode";
  key: string;
};

export type ProviderFailure =
  | "content_policy"
  | "rate_limited"
  | "model_unavailable"
  | "provider_error";

/** Failure detail, e.g. when the provider quota resets. */
export type ProviderError = {
  code: ProviderFailure;
  resetAt?: string;
};

export type StartInput = {
  mode: PreviewMode;
  /** Prompt already composed with the preset style. */
  prompt: string;
  /** Required when mode is "edit". */
  bytes?: Uint8Array;
  mime?: "image/jpeg" | "image/png" | "image/webp";
};

export type StartResult = { imageUrl: string };

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProviderError };

const DEFAULT_BASE_URL = "https://api.ruvicode.com/v1";
const DEFAULT_GENERATE_MODEL = "ruvicode-image";
const DEFAULT_EDIT_MODEL = "ruvicode-image-edit";

function ruvicodeBaseUrl(): string {
  const raw = process.env.RUVICODE_BASE_URL?.trim() || DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, "");
}

function ruvicodeModel(mode: PreviewMode): string {
  if (mode === "edit") {
    return process.env.RUVICODE_EDIT_MODEL?.trim() || DEFAULT_EDIT_MODEL;
  }

  return process.env.RUVICODE_MODEL?.trim() || DEFAULT_GENERATE_MODEL;
}

/** Ruvicode is the only image provider. Returns null when its key is missing. */
export function resolveProvider(): ProviderConfig | null {
  const key = process.env.RUVICODE_API_KEY?.trim();
  return key ? { provider: "ruvicode", key } : null;
}

export async function startPreview(
  config: ProviderConfig,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  const isEdit = input.mode === "edit";
  const endpoint = isEdit ? "edits" : "generations";
  const url = `${ruvicodeBaseUrl()}/images/${endpoint}`;

  let requestInit: RequestInit;

  if (isEdit) {
    if (!input.bytes || !input.mime) {
      return { ok: false, error: { code: "provider_error" } };
    }

    const form = new FormData();
    form.append("model", ruvicodeModel("edit"));
    form.append("prompt", input.prompt);
    form.append("output_format", "jpeg");
    form.append("n", "1");
    form.append("store", "false");
    form.append("aspect_ratio", "auto");
    // Copy into an ArrayBuffer-backed view so it satisfies BlobPart.
    form.append("image", new Blob([new Uint8Array(input.bytes)], { type: input.mime }), "room.jpg");

    requestInit = {
      method: "POST",
      headers: { authorization: `Bearer ${config.key}` },
      body: form,
    };
  } else {
    // /images/generations only accepts a JSON body.
    requestInit = {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ruvicodeModel("generate"),
        prompt: input.prompt,
        aspect_ratio: "16:9",
        output_format: "jpeg",
        n: 1,
        store: false,
      }),
    };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...requestInit,
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: { code: "provider_error" } };
  }

  if (!response.ok) {
    const failure = mapRuvicodeStatus(response.status, await readErrorType(response));
    console.error("[preview] ruvicode error", response.status, endpoint, failure);
    return { ok: false, error: { code: failure } };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: { code: "provider_error" } };
  }

  const base64 = readRuvicodeImage(payload);
  if (!base64) return { ok: false, error: { code: "provider_error" } };

  const format = readRuvicodeFormat(payload);
  return { ok: true, value: { imageUrl: `data:image/${format};base64,${base64}` } };
}

async function readErrorType(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === "object" && payload !== null) {
      const error = (payload as { error?: unknown }).error;
      if (typeof error === "object" && error !== null) {
        const type = (error as { type?: unknown }).type;
        if (typeof type === "string") return type;
      }
    }
  } catch {
    // Ignore bodies that are not JSON.
  }

  return "";
}

function mapRuvicodeStatus(status: number, type: string): ProviderFailure {
  if (status === 400 && type === "content_policy_violation") return "content_policy";
  if (status === 429) return "rate_limited";
  // 404: model temporarily unavailable. 403: the key may not call this model.
  if (status === 403 || status === 404) return "model_unavailable";
  return "provider_error";
}

function readRuvicodeImage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;

  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;

  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const b64 = (item as { b64_json?: unknown }).b64_json;
    if (typeof b64 === "string" && b64.length > 0 && b64.length < 16_000_000) return b64;
  }

  return null;
}

function readRuvicodeFormat(payload: unknown): "jpeg" | "png" | "webp" {
  if (typeof payload !== "object" || payload === null) return "jpeg";

  const format = (payload as { output_format?: unknown }).output_format;
  if (format === "png" || format === "webp" || format === "jpeg") return format;
  return "jpeg";
}
