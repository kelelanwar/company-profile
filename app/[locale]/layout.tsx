import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getDictionary, hasLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(site.url),
    title: dict.nav.home,
    description: dict.meta.home.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { id: "/id", en: "/en" },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: locale === "id" ? "id_ID" : "en_US",
      title: dict.meta.home.title,
      description: dict.meta.home.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-svh flex-col bg-ink text-bone">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:border focus:border-copper focus:bg-ink focus:px-4 focus:py-2 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-[0.2em] focus:text-bone"
        >
          {dict.common.skipToContent}
        </a>
        <Header locale={locale} nav={dict.nav} />
        <main id="content" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} footer={dict.footer} />
      </body>
    </html>
  );
}
