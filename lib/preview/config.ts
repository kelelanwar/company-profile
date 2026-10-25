/**
 * Server-only helper: is any preview provider key configured?
 * Kept dependency-free so pages can import it without pulling in SDKs.
 */
export function previewConfigured(): boolean {
  const requested = process.env.PREVIEW_PROVIDER?.trim().toLowerCase();

  const fal = Boolean(process.env.FAL_KEY?.trim());
  const ruvicode = Boolean(process.env.RUVICODE_API_KEY?.trim());
  const replicate = Boolean(process.env.REPLICATE_API_TOKEN?.trim());

  if (requested === "fal") return fal;
  if (requested === "ruvicode") return ruvicode;
  if (requested === "replicate") return replicate;

  return fal || ruvicode || replicate;
}
