import Replicate from "replicate";

export type PreviewProvider = "ruvicode" | "replicate";

export type ProviderConfig = {
  provider: PreviewProvider;
  key: string;
};

export type ProviderFailure = "content_policy" | "rate_limited" | "provider_error";

export type StartInput = {
  bytes: Uint8Array;
  mime: "image/jpeg" | "image/png" | "image/webp";
  /** Prompt already composed with the preset style. */
  prompt: string;
  /** Only used by Replicate SDXL (0.3–0.6). */
  strength: number;
};

export type StartResult =
  | { kind: "pending"; id: string }
  | { kind: "image"; imageUrl: string };

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProviderFailure };

const REPLICATE_MODEL = "stability-ai/sdxl";
const RUVICODE_DEFAULT_MODEL = "ruvicode-image-edit";

function ruvicodeBaseUrl(): string {
  const raw = process.env.RUVICODE_BASE_URL?.trim() || "https://api.ruvicode.com/v1";
  return raw.replace(/\/+$/, "");
}

export function resolveProvider(): ProviderConfig | null {
  const requested = process.env.PREVIEW_PROVIDER?.trim().toLowerCase();
  const ruvicodeKey = process.env.RUVICODE_API_KEY?.trim();
  const replicateKey = process.env.REPLICATE_API_TOKEN?.trim();

  if (requested === "ruvicode") {
    return ruvicodeKey ? { provider: "ruvicode", key: ruvicodeKey } : null;
  }

  if (requested === "replicate") {
    return replicateKey ? { provider: "replicate", key: replicateKey } : null;
  }

  // No explicit provider: use whichever key is configured, Ruvicode first.
  if (ruvicodeKey) return { provider: "ruvicode", key: ruvicodeKey };
  if (replicateKey) return { provider: "replicate", key: replicateKey };
  return null;
}

export async function startPreview(
  config: ProviderConfig,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  return config.provider === "ruvicode"
    ? startRuvicode(config.key, input)
    : startReplicate(config.key, input);
}

async function startRuvicode(
  key: string,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  const form = new FormData();
  form.append("model", process.env.RUVICODE_IMAGE_MODEL?.trim() || RUVICODE_DEFAULT_MODEL);
  form.append("prompt", input.prompt);
  // Copy into an ArrayBuffer-backed view so it satisfies BlobPart.
  form.append("image", new Blob([new Uint8Array(input.bytes)], { type: input.mime }), "room.jpg");
  form.append("aspect_ratio", "auto");
  form.append("output_format", "jpeg");
  form.append("n", "1");
  form.append("store", "false");

  let response: Response;
  try {
    response = await fetch(`${ruvicodeBaseUrl()}/images/edits`, {
      method: "POST",
      headers: { authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(55_000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "provider_error" };
  }

  if (!response.ok) {
    const failure = mapRuvicodeStatus(response.status, await readErrorType(response));
    console.error("[preview] ruvicode error", response.status, failure);
    return { ok: false, error: failure };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: "provider_error" };
  }

  const base64 = readRuvicodeImage(payload);
  if (!base64) return { ok: false, error: "provider_error" };

  const format = readRuvicodeFormat(payload);
  return { ok: true, value: { kind: "image", imageUrl: `data:image/${format};base64,${base64}` } };
}

async function startReplicate(
  key: string,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  try {
    const replicate = new Replicate({ auth: key });
    const prediction = await replicate.predictions.create({
      model: REPLICATE_MODEL,
      input: {
        image: `data:${input.mime};base64,${Buffer.from(input.bytes).toString("base64")}`,
        prompt: input.prompt,
        prompt_strength: input.strength,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        negative_prompt: "blurry, distorted geometry, watermark, text, low quality",
      },
    });

    return { ok: true, value: { kind: "pending", id: prediction.id } };
  } catch (error) {
    console.error("[preview] replicate error", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "provider_error" };
  }
}

/** Replicate only: poll a prediction and return the temporary image URL. */
export async function pollPreview(
  config: ProviderConfig,
  id: string,
): Promise<Outcome<{ status: string; imageUrl: string | null }>> {
  if (config.provider !== "replicate") {
    return { ok: false, error: "provider_error" };
  }

  try {
    const replicate = new Replicate({ auth: config.key });
    const prediction = await replicate.predictions.get(id);

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return { ok: true, value: { status: prediction.status, imageUrl: null } };
    }

    return {
      ok: true,
      value: {
        status: prediction.status,
        imageUrl: prediction.status === "succeeded" ? readReplicateOutput(prediction.output) : null,
      },
    };
  } catch {
    return { ok: false, error: "provider_error" };
  }
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

function readReplicateOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const url = output.find((item): item is string => typeof item === "string");
    return url ?? null;
  }
  return null;
}
