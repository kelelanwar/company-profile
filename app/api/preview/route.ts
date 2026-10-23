import { NextResponse, type NextRequest } from "next/server";
import Replicate from "replicate";
import { z } from "zod";

export const maxDuration = 60;

const MODEL = "stability-ai/sdxl";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const MIN_PROMPT = 3;
const MAX_PROMPT = 500;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const POLL_RATE_LIMIT = 240;

const PRESETS = {
  industrial: {
    id: "industrial interior, exposed brick, blackened steel, warm practical lighting",
    en: "industrial interior, exposed brick, blackened steel, warm practical lighting",
  },
  "warm-minimal": {
    id: "warm minimal interior, oak timber, plaster walls, soft diffused daylight",
    en: "warm minimal interior, oak timber, plaster walls, soft diffused daylight",
  },
  japandi: {
    id: "japandi interior, natural linen, low furniture, muted earth tones",
    en: "japandi interior, natural linen, low furniture, muted earth tones",
  },
  luxury: {
    id: "refined luxury interior, stone surfaces, brass details, dramatic lighting",
    en: "refined luxury interior, stone surfaces, brass details, dramatic lighting",
  },
  retail: {
    id: "commercial retail interior, display lighting, durable finishes, clean circulation",
    en: "commercial retail interior, display lighting, durable finishes, clean circulation",
  },
} as const;

const BLOCKED_TERMS = [
  "nude",
  "naked",
  "nsfw",
  "porn",
  "sexual",
  "erotic",
  "gore",
  "telanjang",
  "bugil",
  "porno",
  "seksual",
];

type ErrorCode =
  | "missing_token"
  | "rate_limited"
  | "invalid_image"
  | "image_too_large"
  | "invalid_prompt"
  | "blocked_prompt"
  | "provider_error"
  | "not_found"
  | "bad_request";

const ERROR_MESSAGES: Record<ErrorCode, { id: string; en: string }> = {
  missing_token: {
    id: "Layanan pratinjau AI belum dikonfigurasi. Hubungi kami lewat WhatsApp.",
    en: "The AI preview service is not configured yet. Reach us on WhatsApp.",
  },
  rate_limited: {
    id: "Terlalu banyak permintaan. Coba lagi dalam satu menit.",
    en: "Too many requests. Please try again in a minute.",
  },
  invalid_image: {
    id: "Format gambar harus JPG, PNG, atau WebP.",
    en: "The image must be JPG, PNG, or WebP.",
  },
  image_too_large: {
    id: "Ukuran gambar maksimal 5 MB.",
    en: "The image must be 5 MB or smaller.",
  },
  invalid_prompt: {
    id: "Tuliskan arahan desain 3–500 karakter.",
    en: "Describe the design in 3–500 characters.",
  },
  blocked_prompt: {
    id: "Arahan berisi kata yang tidak diizinkan. Ubah deskripsi Anda.",
    en: "The prompt contains a blocked term. Please rephrase it.",
  },
  provider_error: {
    id: "Gagal membuat pratinjau. Coba lagi sebentar.",
    en: "The preview could not be generated. Please try again.",
  },
  not_found: {
    id: "Pratinjau tidak ditemukan atau sudah kedaluwarsa.",
    en: "This preview was not found or has expired.",
  },
  bad_request: {
    id: "Permintaan tidak valid.",
    en: "The request is invalid.",
  },
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { limited: false, retryAfter: 0 };
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function fail(
  code: ErrorCode,
  status: number,
  extra?: Record<string, string>,
) {
  return NextResponse.json(
    { error: { code, message: ERROR_MESSAGES[code] } },
    { status, headers: { "cache-control": "no-store", ...extra } },
  );
}

const promptSchema = z.object({
  prompt: z.string().trim().min(MIN_PROMPT).max(MAX_PROMPT),
  locale: z.enum(["id", "en"]).default("id"),
  preset: z.enum(["industrial", "warm-minimal", "japandi", "luxury", "retail"]).optional(),
  strength: z.coerce.number().min(0.3).max(0.6).default(0.45),
});

const idSchema = z.string().regex(/^[a-z0-9]{6,64}$/i);

function sniffImageMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((value, index) => bytes[index] === value)) return "image/png";

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";

  return null;
}

function composePrompt(prompt: string, preset?: keyof typeof PRESETS): string {
  const style = preset ? `${PRESETS[preset].en}. ` : "";
  return `${style}${prompt}, interior design concept, photorealistic architectural visualization, natural perspective, high detail`;
}

function readOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const url = output.find((item): item is string => typeof item === "string");
    return url ?? null;
  }
  return null;
}

function token(): string | null {
  const value = process.env.REPLICATE_API_TOKEN;
  return value && value.trim().length > 0 ? value.trim() : null;
}

/** Starts an SDXL img2img prediction. The client polls GET /api/preview?id=… */
export async function POST(request: NextRequest) {
  const apiToken = token();
  if (!apiToken) return fail("missing_token", 503);

  const limit = rateLimit(`create:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (limit.limited) {
    return fail("rate_limited", 429, { "retry-after": String(limit.retryAfter) });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) return fail("image_too_large", 413);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("bad_request", 400);
  }

  const image = formData.get("image");
  if (!(image instanceof File)) return fail("invalid_image", 422);

  if (image.size > MAX_IMAGE_BYTES) return fail("image_too_large", 413);

  const bytes = new Uint8Array(await image.arrayBuffer());
  const mime = sniffImageMime(bytes);

  if (!mime) return fail("invalid_image", 422);

  const parsed = promptSchema.safeParse({
    prompt: formData.get("prompt") ?? "",
    locale: formData.get("locale") ?? "id",
    preset: formData.get("preset") || undefined,
    strength: formData.get("strength") ?? undefined,
  });

  if (!parsed.success) {
    const hasPromptField = parsed.error.issues.some((issue) => issue.path[0] === "prompt");
    return fail(hasPromptField ? "invalid_prompt" : "bad_request", 422);
  }

  const { prompt, preset, strength } = parsed.data;
  const normalized = prompt.toLowerCase();

  if (BLOCKED_TERMS.some((term) => normalized.includes(term))) {
    return fail("blocked_prompt", 422);
  }

  try {
    const replicate = new Replicate({ auth: apiToken });
    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        image: `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`,
        prompt: composePrompt(prompt, preset),
        prompt_strength: strength,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        negative_prompt: "blurry, distorted geometry, watermark, text, low quality",
      },
    });

    return NextResponse.json(
      { predictionId: prediction.id, status: prediction.status },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "[preview] provider error",
      error instanceof Error ? error.name : "unknown",
    );
    return fail("provider_error", 502);
  }
}

/** Polls a prediction. Returns the temporary image URL once it succeeds. */
export async function GET(request: NextRequest) {
  const apiToken = token();
  if (!apiToken) return fail("missing_token", 503);

  const limit = rateLimit(`poll:${clientIp(request)}`, POLL_RATE_LIMIT, RATE_WINDOW_MS);
  if (limit.limited) {
    return fail("rate_limited", 429, { "retry-after": String(limit.retryAfter) });
  }

  const id = request.nextUrl.searchParams.get("id");
  const parsedId = idSchema.safeParse(id ?? "");
  if (!parsedId.success) return fail("not_found", 404);

  try {
    const replicate = new Replicate({ auth: apiToken });
    const prediction = await replicate.predictions.get(parsedId.data);

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json(
        {
          status: prediction.status,
          error: { code: "provider_error", message: ERROR_MESSAGES.provider_error },
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        status: prediction.status,
        imageUrl: prediction.status === "succeeded" ? readOutput(prediction.output) : null,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return fail("provider_error", 502);
  }
}
