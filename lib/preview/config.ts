/**
 * Server-only helper: is the preview provider configured?
 * Kept dependency-free so pages can import it without pulling in anything else.
 */
export function previewConfigured(): boolean {
  return Boolean(process.env.RUVICODE_API_KEY?.trim());
}
