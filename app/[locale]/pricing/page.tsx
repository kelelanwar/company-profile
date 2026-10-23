import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/home/CtaBand";
import { FaqSection } from "@/components/home/FaqSection";
import { PricingTable } from "@/components/home/PricingTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.pages.pricing.title,
    description: dict.pages.pricing.description,
  };
}

export default async function PricingPage({
  params,
}: PageProps<"/[locale]/pricing">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.pages.pricing.eyebrow}
        title={dict.pages.pricing.title}
        description={dict.pages.pricing.description}
      />
      <PricingTable locale={locale} dict={dict.home.pricing} />
      <FaqSection dict={dict.home.faq} />
      <CtaBand locale={locale} dict={dict.home.cta} />
    </>
  );
}
