import type { Locale } from "./locales";

export { defaultLocale, hasLocale, locales, pick } from "./locales";
export type { Locale } from "./locales";

const dictionaries = {
  id: () => import("@/messages/id.json").then((module) => module.default),
  en: () => import("@/messages/en.json").then((module) => module.default),
};

export type Dictionary = Awaited<ReturnType<typeof dictionaries.id>>;

/**
 * Load the copy for a locale. Only call this from Server Components, route
 * handlers, or server-side utilities — never from a Client Component.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const load = dictionaries[locale];
  return (await load()) as Dictionary;
}
