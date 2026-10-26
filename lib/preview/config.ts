/**
 * Server-only helper: is any preview provider configured?
 * Kept dependency-free so pages can import it without pulling in SDKs.
 */
export function previewConfigured(): boolean {
  const requested = process.env.PREVIEW_PROVIDER?.trim().toLowerCase();

  const fal = Boolean(process.env.FAL_KEY?.trim());
  const compat = Boolean(
    process.env.COMPAT_BASE_URL?.trim() && process.env.COMPAT_MODEL?.trim(),
  );
  const ruvicode = Boolean(process.env.RUVICODE_API_KEY?.trim());
  const replicate = Boolean(process.env.REPLICATE_API_TOKEN?.trim());

  if (requested === "fal") return fal;
  if (requested === "compat") return compat;
  if (requested === "ruvicode") return ruvicode;
  if (requested === "replicate") return replicate;

  return fal || compat || ruvicode || replicate;
}
