export const locales = ["id", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Picks the string for the active locale from a translated pair. */
export function pick(locale: Locale, id: string, en: string): string {
  return locale === "en" ? en : id;
}
