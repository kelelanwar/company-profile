import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewStudio } from "@/components/preview/PreviewStudio";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { previewConfigured } from "@/lib/preview/config";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/preview">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.pages.preview.title,
    description: dict.pages.preview.description,
  };
}

export default async function PreviewPage({
  params,
}: PageProps<"/[locale]/preview">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.pages.preview.eyebrow}
        title={dict.pages.preview.title}
        description={dict.pages.preview.description}
      />
      <section className="shell py-14 md:py-16">
        <PreviewStudio
          locale={locale}
          dict={dict.pages.preview}
          configured={previewConfigured()}
        />
      </section>
    </>
  );
}
