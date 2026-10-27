import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  resolveProvider,
  startPreview,
  type PreviewMode,
  type ProviderError,
} from "@/lib/preview/providers";

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
const MIN_PROMPT = 3;
const MAX_PROMPT = 500;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const PRESETS = {
  industrial: "industrial interior, exposed brick, blackened steel, warm practical lighting",
  "warm-minimal": "warm minimal interior, oak timber, plaster walls, soft diffused daylight",
  japandi: "japandi interior, natural linen, low furniture, muted earth tones",
  luxury: "refined luxury interior, stone surfaces, brass details, dramatic lighting",
  retail: "commercial retail interior, display lighting, durable finishes, clean circulation",
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
  | "model_unavailable"
  | "provider_error"
  | "not_found"
  | "bad_request";

const ERROR_MESSAGES: Record<ErrorCode, { id: string; en: string }> = {
  missing_token: {
    id: "Layanan pratinjau AI belum dikonfigurasi. Hubungi kami lewat WhatsApp.",
    en: "The AI preview service is not configured yet. Reach us on WhatsApp.",
  },
  rate_limited: {
    id: "Batas pemakaian penyedia AI tercapai, atau terlalu banyak permintaan. Coba lagi beberapa saat.",
    en: "The AI provider limit was reached, or there were too many requests. Please try again later.",
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
  model_unavailable: {
    id: "Mode ini sedang tidak tersedia di penyedia AI. Coba mode lain atau hubungi kami.",
    en: "This mode is not available from the AI provider right now. Try the other mode or contact us.",
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
  details?: { resetAt?: string },
) {
  return NextResponse.json(
    {
      error: {
        code,
        message: ERROR_MESSAGES[code],
        ...(details?.resetAt ? { resetAt: details.resetAt } : {}),
      },
    },
    { status, headers: { "cache-control": "no-store", ...extra } },
  );
}

function providerFailure(error: ProviderError) {
  const details = error.resetAt ? { resetAt: error.resetAt } : undefined;

  if (error.code === "content_policy") return fail("blocked_prompt", 422);
  if (error.code === "rate_limited") return fail("rate_limited", 429, undefined, details);
  if (error.code === "model_unavailable") {
    return fail("model_unavailable", 503, undefined, details);
  }
  return fail("provider_error", 502);
}

const promptSchema = z.object({
  prompt: z.string().trim().min(MIN_PROMPT).max(MAX_PROMPT),
  locale: z.enum(["id", "en"]).default("id"),
  mode: z.enum(["edit", "generate"]).default("edit"),
  preset: z.enum(["industrial", "warm-minimal", "japandi", "luxury", "retail"]).optional(),
});

function sniffImageMime(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((value, index) => bytes[index] === value)) return "image/png";

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return "image/webp";

  return null;
}

function composePrompt(
  prompt: string,
  preset?: keyof typeof PRESETS,
  mode: PreviewMode = "generate",
): string {
  const style = preset ? `${PRESETS[preset]}. ` : "";

  if (mode === "edit") {
    return `Redesign this interior photo: ${style}${prompt}. Keep the room layout, walls, and window positions, photorealistic interior render.`;
  }

  return `${style}${prompt}, interior design concept, photorealistic architectural visualization, natural perspective, high detail`;
}

/**
 * Starts a preview. Ruvicode answers with the finished image in the same
 * request, so there is nothing to poll.
 */
export async function POST(request: NextRequest) {
  const config = resolveProvider();
  if (!config) return fail("missing_token", 503);

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

  const parsed = promptSchema.safeParse({
    prompt: formData.get("prompt") ?? "",
    locale: formData.get("locale") ?? "id",
    mode: formData.get("mode") || undefined,
    preset: formData.get("preset") || undefined,
  });

  if (!parsed.success) {
    const hasPromptField = parsed.error.issues.some((issue) => issue.path[0] === "prompt");
    return fail(hasPromptField ? "invalid_prompt" : "bad_request", 422);
  }

  const { prompt, preset, mode } = parsed.data;
  const normalized = prompt.toLowerCase();

  if (BLOCKED_TERMS.some((term) => normalized.includes(term))) {
    return fail("blocked_prompt", 422);
  }

  let bytes: Uint8Array | undefined;
  let mime: "image/jpeg" | "image/png" | "image/webp" | undefined;

  if (mode === "edit") {
    const image = formData.get("image");
    if (!(image instanceof File)) return fail("invalid_image", 422);
    if (image.size > MAX_IMAGE_BYTES) return fail("image_too_large", 413);

    bytes = new Uint8Array(await image.arrayBuffer());
    const detected = sniffImageMime(bytes);
    if (!detected) return fail("invalid_image", 422);
    mime = detected;
  }

  const result = await startPreview(config, {
    mode,
    bytes,
    mime,
    prompt: composePrompt(prompt, preset, mode),
  });

  if (!result.ok) return providerFailure(result.error);

  return NextResponse.json(
    { status: "succeeded", imageUrl: result.value.imageUrl },
    { headers: { "cache-control": "no-store" } },
  );
}
