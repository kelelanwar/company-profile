import Replicate from "replicate";
import { ApiError, fal } from "@fal-ai/client";

export type PreviewProvider = "compat" | "fal" | "ruvicode" | "replicate";
export type PreviewMode = "edit" | "generate";

export type ProviderConfig = {
  provider: PreviewProvider;
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
  /** Only used by Replicate SDXL (0.3–0.6). */
  strength: number;
  /** Required when mode is "edit". */
  bytes?: Uint8Array;
  mime?: "image/jpeg" | "image/png" | "image/webp";
};

export type StartResult =
  | { kind: "pending"; id: string }
  | { kind: "image"; imageUrl: string };

export type Outcome<T> =
  | { ok: true; value: T }
  | { ok: false; error: ProviderError };

const REPLICATE_MODEL = "stability-ai/sdxl";

function ruvicodeBaseUrl(): string {
  const raw = process.env.RUVICODE_BASE_URL?.trim() || "https://api.ruvicode.com/v1";
  return raw.replace(/\/+$/, "");
}

function ruvicodeModel(mode: PreviewMode): string {
  if (mode === "edit") {
    return process.env.RUVICODE_EDIT_MODEL?.trim() || "ruvicode-image-edit";
  }

  return process.env.RUVICODE_MODEL?.trim() || "ruvicode-image";
}

export function resolveProvider(): ProviderConfig | null {
  const requested = process.env.PREVIEW_PROVIDER?.trim().toLowerCase();
  const falKey = process.env.FAL_KEY?.trim();
  const ruvicodeKey = process.env.RUVICODE_API_KEY?.trim();
  const replicateKey = process.env.REPLICATE_API_TOKEN?.trim();

  if (requested === "compat") {
    return compatReady() ? { provider: "compat", key: compatKey() } : null;
  }

  if (requested === "fal") {
    return falKey ? { provider: "fal", key: falKey } : null;
  }

  if (requested === "ruvicode") {
    return ruvicodeKey ? { provider: "ruvicode", key: ruvicodeKey } : null;
  }

  if (requested === "replicate") {
    return replicateKey ? { provider: "replicate", key: replicateKey } : null;
  }

  // No explicit provider: pick whichever is configured, fal first.
  if (falKey) return { provider: "fal", key: falKey };
  if (compatReady()) return { provider: "compat", key: compatKey() };
  if (ruvicodeKey) return { provider: "ruvicode", key: ruvicodeKey };
  if (replicateKey) return { provider: "replicate", key: replicateKey };
  return null;
}

/** Every configured provider, in fallback order. */
export function resolveProviders(): ProviderConfig[] {
  const requested = process.env.PREVIEW_PROVIDER?.trim().toLowerCase();
  const single = resolveProvider();

  if (requested || !single) return single ? [single] : [];

  const chain: ProviderConfig[] = [];

  if (process.env.FAL_KEY?.trim()) {
    chain.push({ provider: "fal", key: process.env.FAL_KEY.trim() });
  }
  if (compatReady()) {
    chain.push({ provider: "compat", key: compatKey() });
  }
  if (process.env.RUVICODE_API_KEY?.trim()) {
    chain.push({ provider: "ruvicode", key: process.env.RUVICODE_API_KEY.trim() });
  }
  if (process.env.REPLICATE_API_TOKEN?.trim()) {
    chain.push({ provider: "replicate", key: process.env.REPLICATE_API_TOKEN.trim() });
  }

  return chain.length > 0 ? chain : [single];
}

export async function startPreview(
  config: ProviderConfig,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  if (config.provider === "compat") return startCompat(config.key, input);
  if (config.provider === "fal") return startFal(config.key, input);
  return config.provider === "ruvicode"
    ? startRuvicode(config.key, input)
    : startReplicate(config.key, input);
}

/** OpenAI-compatible gateways (9router, LM Studio, etc.). */
function compatBaseUrl(): string | null {
  const raw = process.env.COMPAT_BASE_URL?.trim();
  return raw ? raw.replace(/\/+$/, "") : null;
}

function compatKey(): string {
  return process.env.COMPAT_API_KEY?.trim() ?? "";
}

function compatReady(): boolean {
  return Boolean(compatBaseUrl() && process.env.COMPAT_MODEL?.trim());
}

function compatModel(mode: PreviewMode): string | null {
  if (mode === "edit") {
    return (
      process.env.COMPAT_EDIT_MODEL?.trim() ||
      process.env.COMPAT_MODEL?.trim() ||
      null
    );
  }

  return process.env.COMPAT_MODEL?.trim() || null;
}

function mapCompatStatus(status: number, body: string): ProviderFailure {
  if (status === 429) return "rate_limited";

  if (status === 400 || status === 404) {
    const text = body.toLowerCase();
    if (
      text.includes("credentials") ||
      text.includes("not found") ||
      text.includes("not available") ||
      text.includes("no provider")
    ) {
      return "model_unavailable";
    }
    if (text.includes("safety") || text.includes("content policy") || text.includes("blocked")) {
      return "content_policy";
    }
  }

  return "provider_error";
}

/** Pulls a quota reset timestamp out of an upstream error body. */
function readQuotaReset(body: string): string | undefined {
  // The upstream body embeds a JSON string, so keys and values can be escaped.
  if (body.includes("quotaResetTimeStamp")) {
    const stamp = body.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/,
    )?.[1];
    if (stamp) return stamp;
  }

  if (body.includes("quotaResetDelay")) {
    const duration = body.match(/(\d+)h(\d+)m(\d+(?:\.\d+)?)s/);
    if (duration) {
      const seconds =
        Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
      if (Number.isFinite(seconds)) {
        return new Date(Date.now() + seconds * 1000).toISOString();
      }
    }
  }

  return undefined;
}

function readCompatImage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;

  const record = payload as { data?: unknown; images?: unknown };

  const data = Array.isArray(record.data) ? record.data : [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const entry = item as { b64_json?: unknown; url?: unknown };

    if (typeof entry.b64_json === "string" && entry.b64_json.length > 0) {
      const head = Buffer.from(entry.b64_json.slice(0, 16), "base64");
      const mime =
        head[0] === 0xff && head[1] === 0xd8
          ? "image/jpeg"
          : head[0] === 0x89 && head[1] === 0x50
            ? "image/png"
            : "image/jpeg";
      return `data:${mime};base64,${entry.b64_json}`;
    }

    if (typeof entry.url === "string" && entry.url.length > 0) return entry.url;
  }

  const images = Array.isArray(record.images) ? record.images : [];
  for (const item of images) {
    if (typeof item !== "object" || item === null) continue;
    const url = (item as { url?: unknown }).url;
    if (typeof url === "string" && url.length > 0) return url;
  }

  return null;
}

async function startCompat(
  key: string,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  const base = compatBaseUrl();
  const model = compatModel(input.mode);

  if (!base || !model) return { ok: false, error: { code: "provider_error" } };

  const body: Record<string, unknown> = {
    model,
    prompt: input.prompt,
    n: 1,
    aspect_ratio: "16:9",
  };

  if (input.mode === "edit") {
    if (!input.bytes || !input.mime) return { ok: false, error: { code: "provider_error" } };
    body.image = `data:${input.mime};base64,${Buffer.from(input.bytes).toString("base64")}`;
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key) headers.authorization = `Bearer ${key}`;

  try {
    const response = await fetch(`${base}/images/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(50_000),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      const failure = mapCompatStatus(response.status, body);
      const resetAt = failure === "rate_limited" ? readQuotaReset(body) : undefined;
      console.error("[preview] compat error", response.status, failure);
      return {
        ok: false,
        error: resetAt ? { code: failure, resetAt } : { code: failure },
      };
    }

    const payload: unknown = await response.json();
    const imageUrl = readCompatImage(payload);
    if (!imageUrl) return { ok: false, error: { code: "provider_error" } };

    return { ok: true, value: { kind: "image", imageUrl } };
  } catch (error) {
    console.error("[preview] compat error", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: { code: "provider_error" } };
  }
}

const FAL_DEFAULT_EDIT_MODEL = "fal-ai/flux-pro/kontext";
const FAL_DEFAULT_GENERATE_MODEL = "fal-ai/flux/schnell";

function falModel(mode: PreviewMode): string {
  if (mode === "edit") {
    return process.env.FAL_MODEL_EDIT?.trim() || FAL_DEFAULT_EDIT_MODEL;
  }

  return process.env.FAL_MODEL_GENERATE?.trim() || FAL_DEFAULT_GENERATE_MODEL;
}

/**
 * Test hook only: rewrites fal hosts to a local mock server. Never set
 * FAL_MOCK_URL in production.
 */
function falFetchOverride(): typeof fetch | undefined {
  const mock = process.env.FAL_MOCK_URL?.trim();
  if (!mock) return undefined;

  return (input, init) => {
    const raw =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = raw
      .replace(/^https:\/\/(?:[a-z0-9-]+\.)?fal\.run/i, mock)
      .replace(/^https:\/\/rest(?:\.alpha)?\.fal\.ai/i, mock);
    return fetch(url, init);
  };
}

function falClient(key: string) {
  const fetchOverride = falFetchOverride();

  fal.config(
    fetchOverride ? { credentials: key, fetch: fetchOverride } : { credentials: key },
  );

  return fal;
}

function mapFalError(error: unknown): ProviderFailure {
  if (error instanceof ApiError) {
    if (error.status === 429) return "rate_limited";
    if (error.status === 404) return "model_unavailable";
    if (error.status === 422) {
      const body = JSON.stringify(error.body ?? "").toLowerCase();
      if (body.includes("nsfw") || body.includes("safety") || body.includes("moderation")) {
        return "content_policy";
      }
    }
  }

  return "provider_error";
}

async function startFal(
  key: string,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  const client = falClient(key);
  const model = falModel(input.mode);

  try {
    const payload: Record<string, unknown> = {
      prompt: input.prompt,
      num_images: 1,
      output_format: "jpeg",
    };

    if (input.mode === "edit") {
      if (!input.bytes || !input.mime) {
        return { ok: false, error: { code: "provider_error" } };
      }

      // fal needs a URL, so the upload is staged on fal storage first.
      payload.image_url = await client.storage.upload(
        new Blob([new Uint8Array(input.bytes)], { type: input.mime }),
      );
      payload.safety_tolerance = "2";
    } else {
      payload.image_size = "landscape_16_9";
    }

    const { request_id } = await client.queue.submit(model, { input: payload });

    return { ok: true, value: { kind: "pending", id: `fal:${input.mode}:${request_id}` } };
  } catch (error) {
    const failure = mapFalError(error);
    console.error("[preview] fal error", failure);
    return { ok: false, error: { code: failure } };
  }
}

function parseFalJob(id: string): { mode: PreviewMode; requestId: string } | null {
  if (!id.startsWith("fal:")) return null;

  const [, mode, ...rest] = id.split(":");
  const requestId = rest.join(":");

  if ((mode !== "edit" && mode !== "generate") || requestId.length < 6) return null;

  return { mode, requestId };
}

function readFalImage(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;

  const record = data as { images?: unknown; image?: unknown };
  const images = Array.isArray(record.images) ? record.images : [];

  for (const item of images) {
    if (typeof item !== "object" || item === null) continue;
    const url = (item as { url?: unknown }).url;
    if (typeof url === "string" && url.length > 0) return url;
  }

  if (typeof record.image === "object" && record.image !== null) {
    const url = (record.image as { url?: unknown }).url;
    if (typeof url === "string") return url;
  }

  return null;
}

async function startRuvicode(
  key: string,
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
      headers: { authorization: `Bearer ${key}` },
      body: form,
    };
  } else {
    // /images/generations only accepts a JSON body.
    requestInit = {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
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
  return { ok: true, value: { kind: "image", imageUrl: `data:image/${format};base64,${base64}` } };
}

async function startReplicate(
  key: string,
  input: StartInput,
): Promise<Outcome<StartResult>> {
  const baseInput = {
    prompt: input.prompt,
    num_inference_steps: 30,
    guidance_scale: 7.5,
    negative_prompt: "blurry, distorted geometry, watermark, text, low quality",
  };

  const modelInput =
    input.mode === "edit" && input.bytes && input.mime
      ? {
          ...baseInput,
          image: `data:${input.mime};base64,${Buffer.from(input.bytes).toString("base64")}`,
          prompt_strength: input.strength,
        }
      : { ...baseInput, width: 1024, height: 1024 };

  try {
    const replicate = new Replicate({ auth: key });
    const prediction = await replicate.predictions.create({
      model: REPLICATE_MODEL,
      input: modelInput,
    });

    return { ok: true, value: { kind: "pending", id: prediction.id } };
  } catch (error) {
    console.error("[preview] replicate error", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: { code: "provider_error" } };
  }
}

/** Replicate only: poll a prediction and return the temporary image URL. */
export async function pollPreview(
  config: ProviderConfig,
  id: string,
): Promise<Outcome<{ status: string; imageUrl: string | null }>> {
  if (config.provider === "fal") {
    const job = parseFalJob(id);
    if (!job) return { ok: false, error: { code: "provider_error" } };

    const client = falClient(config.key);
    const model = falModel(job.mode);

    try {
      const status = await client.queue.status(model, { requestId: job.requestId });

      if (status.status === "COMPLETED") {
        const result = await client.queue.result(model, { requestId: job.requestId });
        const imageUrl = readFalImage(result.data);

        return {
          ok: true,
          value: imageUrl
            ? { status: "succeeded", imageUrl }
            : { status: "failed", imageUrl: null },
        };
      }

      return {
        ok: true,
        value: {
          status: status.status === "IN_QUEUE" ? "starting" : "processing",
          imageUrl: null,
        },
      };
    } catch (error) {
      return { ok: false, error: { code: mapFalError(error) } };
    }
  }

  if (config.provider !== "replicate") {
    return { ok: false, error: { code: "provider_error" } };
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
    return { ok: false, error: { code: "provider_error" } };
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

function readReplicateOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const url = output.find((item): item is string => typeof item === "string");
    return url ?? null;
  }
  return null;
}
