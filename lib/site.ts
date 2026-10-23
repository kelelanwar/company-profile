export const site = {
  name: "Geost Studio",
  url: "https://geost.studio",
  whatsappNumber: "6281234567890",
  email: "hello@geost.studio",
  instagram: "https://instagram.com/geost.studio",
  linkedin: "https://linkedin.com/company/geoststudio",
  behance: "https://behance.net/geoststudio",
} as const;

type Locale = "id" | "en";

const defaultMessages: Record<Locale, string> = {
  id: "Halo Geost Studio, saya ingin berdiskusi tentang proyek interior.",
  en: "Hi Geost Studio, I would like to discuss an interior project.",
};

/** Builds a wa.me link with a prefilled message (optionally carrying a prompt). */
export function whatsappUrl(locale: Locale, prompt?: string): string {
  const message = prompt?.trim()
    ? `${defaultMessages[locale]}\n\n${prompt.trim()}`
    : defaultMessages[locale];

  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(subject?: string): string {
  const base = `mailto:${site.email}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
