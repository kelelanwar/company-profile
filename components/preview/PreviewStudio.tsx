"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnGhost, btnPrimary, chipActive, chipIdle } from "@/lib/styles";
import { whatsappUrl } from "@/lib/site";

type FormCopy = Dictionary["pages"]["preview"]["form"];
type ErrorCopy = Dictionary["pages"]["preview"]["errors"];
type Preset = "industrial" | "warm-minimal" | "japandi" | "luxury" | "retail";
type ErrorCode = keyof ErrorCopy;

type Props = {
  locale: Locale;
  dict: Dictionary["pages"]["preview"];
  /** False when no provider key is present; shows a setup banner. */
  configured: boolean;
};

type Status = "idle" | "preparing" | "starting" | "done" | "error";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PROMPT = 500;
const MIN_PROMPT = 3;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

const PRESETS: { value: Preset; label: keyof FormCopy["presets"] }[] = [
  { value: "industrial", label: "industrial" },
  { value: "warm-minimal", label: "warmMinimal" },
  { value: "japandi", label: "japandi" },
  { value: "luxury", label: "luxury" },
  { value: "retail", label: "retail" },
];

const KNOWN_CODES: ErrorCode[] = [
  "rate_limited",
  "invalid_image",
  "image_too_large",
  "invalid_prompt",
  "blocked_prompt",
  "model_unavailable",
  "missing_token",
  "provider_error",
  "network",
  "timeout",
  "unknown",
];

/** Re-encodes the upload so EXIF/GPS is stripped and the payload stays small. */
async function prepareImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 1536 / longest);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.9);
  });

  if (!blob) throw new Error("encode failed");

  return new File([blob], "room.jpg", { type: "image/jpeg" });
}

export function PreviewStudio({ locale, dict, configured }: Props) {
  const copy = dict.form;
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "generate">("edit");
  const [prompt, setPrompt] = useState("");
  const [preset, setPreset] = useState<Preset>("industrial");
  const [status, setStatus] = useState<Status>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [quotaResetAt, setQuotaResetAt] = useState<string | null>(null);
  const [compare, setCompare] = useState(50);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const setPreview = useCallback((nextUrl: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResultUrl(null);
    setErrorCode(null);
    setCompare(50);
  }, []);

  const handleFile = useCallback(
    async (incoming: File | undefined) => {
      if (!incoming) return;

      if (!ACCEPTED.includes(incoming.type)) {
        setErrorCode("invalid_image");
        setStatus("error");
        return;
      }

      if (incoming.size > MAX_BYTES) {
        setErrorCode("image_too_large");
        setStatus("error");
        return;
      }

      reset();
      setStatus("preparing");

      try {
        const prepared = await prepareImage(incoming);
        setFile(prepared);
        setPreview(URL.createObjectURL(prepared));
        setStatus("idle");
      } catch {
        setErrorCode("invalid_image");
        setStatus("error");
      }
    },
    [reset, setPreview],
  );

  const submit = useCallback(async () => {
    if (mode === "edit" && !file) {
      setErrorCode("invalid_image");
      setStatus("error");
      return;
    }

    const trimmed = prompt.trim();
    if (trimmed.length < MIN_PROMPT || trimmed.length > MAX_PROMPT) {
      setErrorCode("invalid_prompt");
      setStatus("error");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setErrorCode(null);
    setQuotaResetAt(null);
    setResultUrl(null);
    setStatus("starting");

    try {
      const body = new FormData();
      body.append("mode", mode);
      if (mode === "edit" && file) body.append("image", file);
      body.append("prompt", trimmed);
      body.append("locale", locale);
      body.append("preset", preset);

      const response = await fetch("/api/preview", {
        method: "POST",
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        setErrorCode(readErrorCode(payload) ?? "provider_error");
        setQuotaResetAt(readQuotaReset(payload));
        setStatus("error");
        return;
      }

      const created = (await response.json()) as { imageUrl?: string };

      if (!created.imageUrl) {
        setErrorCode("provider_error");
        setStatus("error");
        return;
      }

      setResultUrl(created.imageUrl);
      setStatus("done");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setErrorCode("network");
      setStatus("error");
    }
  }, [file, locale, mode, preset, prompt]);

  const busy = status === "preparing" || status === "starting";
  const promptTooShort = prompt.trim().length < MIN_PROMPT;
  const canSubmit = (mode === "generate" || Boolean(file)) && !promptTooShort && !busy;

  const statusText =
    status === "preparing" || status === "starting" ? copy.working : copy.rendering;

  return (
    <>
      {!configured ? (
        <div className="mb-6 flex items-start gap-3 border border-copper/40 bg-copper/5 px-4 py-3">
          <span aria-hidden="true" className="mt-0.5 font-mono text-[11px] text-copper">
            !
          </span>
          <p className="text-sm leading-relaxed text-bone/85">{copy.notConfigured}</p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
      <div className="border border-line bg-surface p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
            {copy.modeLabel}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => {
              setMode("edit");
              reset();
            }}
            className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
              mode === "edit" ? chipActive : chipIdle
            }`}
          >
            {copy.modeEdit}
          </button>
          <button
            type="button"
            aria-pressed={mode === "generate"}
            onClick={() => {
              setMode("generate");
              reset();
            }}
            className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
              mode === "generate" ? chipActive : chipIdle
            }`}
          >
            {copy.modeGenerate}
          </button>
        </div>

        {mode === "edit" ? (
          <>
            <div className="mt-6 flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
                {copy.uploadTitle}
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {copy.uploadHint}
              </span>
            </div>

            <div
              className="mt-4"
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                ref={inputRef}
                id="preview-image-input"
                type="file"
                accept={ACCEPTED.join(",")}
                className="sr-only"
                onChange={(event) => {
                  void handleFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              {previewUrl ? (
                <div className="relative aspect-[4/3] overflow-hidden border border-line">
                  <Image
                    src={previewUrl}
                    alt={copy.uploadTitle}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                  />
                  <label
                    htmlFor="preview-image-input"
                    className="absolute bottom-3 right-3 cursor-pointer border border-white/25 bg-ink/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-bone backdrop-blur transition-colors hover:border-copper hover:text-copper-hi"
                  >
                    {copy.replaceCta}
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="preview-image-input"
                  className={`flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-3 border border-dashed px-6 text-center transition-colors ${
                    dragging ? "border-copper bg-copper/5" : "border-line hover:border-copper/60"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-11 place-items-center border border-line font-mono text-lg text-copper"
                  >
                    +
                  </span>
                  <span className="max-w-[16rem] text-sm text-muted">{copy.dropHint}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone">
                    {copy.uploadCta}
                  </span>
                </label>
              )}
            </div>
          </>
        ) : (
          <div className="mt-6 border border-line bg-ink px-5 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">
              {copy.modeGenerate}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{copy.generateHint}</p>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="preview-prompt"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper"
            >
              {copy.promptLabel}
            </label>
            <span className="font-mono text-[10px] tracking-[0.12em] text-muted">
              {prompt.length}/{MAX_PROMPT} {copy.chars}
            </span>
          </div>
          <textarea
            id="preview-prompt"
            value={prompt}
            maxLength={MAX_PROMPT}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            placeholder={copy.promptPlaceholder}
            className="mt-3 w-full resize-y border border-line bg-ink px-4 py-3 text-sm leading-relaxed text-bone placeholder:text-muted/60 focus:border-copper focus:outline-none"
          />
          <p className="mt-2 text-xs leading-relaxed text-muted/80">{copy.promptHint}</p>
        </div>

        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
            {copy.presetLabel}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={preset === item.value}
                onClick={() => setPreset(item.value)}
                className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  preset === item.value ? chipActive : chipIdle
                }`}
              >
                {copy.presets[item.label]}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          className={`${btnPrimary} mt-7 w-full disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {busy ? copy.submitting : copy.submit}
        </button>

        <p className="mt-4 border-l-2 border-copper/60 pl-3 text-xs leading-relaxed text-muted">
          {copy.disclaimer}
        </p>
      </div>

      <div className="flex flex-col border border-line bg-carbone p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
            {mode === "edit" ? copy.resultTitleEdit : copy.resultTitleGenerate}
          </p>
          {status === "done" ? (
            <button
              type="button"
              onClick={() => {
                reset();
                void submit();
              }}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-copper-hi"
            >
              {copy.again}
            </button>
          ) : null}
        </div>

        <div aria-live="polite" className="mt-4 flex-1">
          {status === "done" && resultUrl ? (
            <div>
              <div className="relative aspect-[4/3] overflow-hidden border border-line bg-ink">
                <Image
                  src={resultUrl}
                  alt={mode === "edit" ? copy.previewAlt : copy.generateAlt}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />

                {mode === "edit" && previewUrl ? (
                  <>
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: `inset(0 ${100 - compare}% 0 0)` }}
                    >
                      <Image
                        src={previewUrl}
                        alt={copy.before}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <span className="absolute left-3 top-3 border border-white/25 bg-ink/75 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-bone backdrop-blur">
                      {copy.before}
                    </span>
                    <span className="absolute right-3 top-3 border border-white/25 bg-ink/75 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-bone backdrop-blur">
                      {copy.after}
                    </span>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 w-px bg-copper"
                      style={{ left: `${compare}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={compare}
                      aria-label={copy.sliderLabel}
                      onChange={(event) => setCompare(Number(event.target.value))}
                      className="absolute inset-x-4 bottom-4 h-1 cursor-ew-resize appearance-none rounded-full bg-line accent-copper"
                    />
                  </>
                ) : null}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a
                  href={resultUrl}
                  download="geost-preview.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnPrimary}
                >
                  {copy.download}
                </a>
                <a
                  href={whatsappUrl(
                    locale,
                    resultUrl.startsWith("http") ? `${prompt.trim()}\n${resultUrl}` : prompt.trim(),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnGhost}
                >
                  {copy.whatsappCta}
                </a>
              </div>

              {resultUrl.startsWith("http") ? (
                <p className="mt-4 text-xs leading-relaxed text-muted/80">{copy.expiry}</p>
              ) : null}
            </div>
          ) : null}

          {busy ? (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-4 border border-line bg-surface">
              <div
                aria-hidden="true"
                className="size-9 animate-spin rounded-full border border-line border-t-copper"
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                {statusText}
              </p>
              <p className="max-w-[16rem] text-center text-xs leading-relaxed text-muted/70">
                {copy.disclaimer}
              </p>
            </div>
          ) : null}

          {status === "error" && errorCode ? (
            <div className="flex h-full min-h-[18rem] flex-col items-start justify-center gap-4 border border-line bg-surface p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
                {mode === "edit" ? copy.resultTitleEdit : copy.resultTitleGenerate}
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-bone/85">
                {dict.errors[errorCode]}
              </p>
              {quotaResetAt ? (
                <p className="max-w-sm border-l-2 border-copper/60 pl-3 text-xs leading-relaxed text-muted">
                  {dict.errors.quotaReset.replace("{time}", formatResetTime(quotaResetAt, locale))}
                </p>
              ) : null}
              <button type="button" onClick={() => void submit()} className={btnGhost}>
                {copy.submit}
              </button>
            </div>
          ) : null}

          {status === "idle" && !resultUrl ? (
            <div className="flex h-full min-h-[18rem] flex-col justify-center gap-4 border border-line bg-surface p-6">
              <p className="text-lg font-light tracking-tight text-bone">{copy.idleTitle}</p>
              <p className="max-w-sm text-sm leading-relaxed text-muted">{copy.idleBody}</p>
              <ol className="mt-2 grid gap-3">
                {dict.steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3 text-sm text-muted">
                    <span className="font-mono text-[11px] tracking-[0.2em] text-copper">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="text-bone/85">{step.title}</span> — {step.body}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>

        <p className="mt-5 text-xs leading-relaxed text-muted/70">{dict.notice}</p>
      </div>
      </div>
    </>
  );
}

function formatResetTime(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readQuotaReset(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const resetAt = (error as { resetAt?: unknown }).resetAt;
  return typeof resetAt === "string" ? resetAt : null;
}

function readErrorCode(payload: unknown): ErrorCode | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code !== "string") return null;

  return KNOWN_CODES.includes(code as ErrorCode) ? (code as ErrorCode) : null;
}
