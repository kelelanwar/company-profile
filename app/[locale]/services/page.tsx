import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/home/CtaBand";
import { PageHeader } from "@/components/ui/PageHeader";
import { services } from "@/lib/data";
import { getDictionary, hasLocale, pick } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.nav.services,
    description: dict.pages.services.description,
  };
}

export default async function ServicesPage({
  params,
}: PageProps<"/[locale]/services">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const copy = dict.pages.services;

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <section className="shell py-16 md:py-20">
        <ol className="border-t border-line">
          {services.map((service, index) => (
            <li
              key={service.slug}
              id={service.slug}
              className="grid gap-4 border-b border-line py-9 md:grid-cols-[80px_1fr_1.3fr] md:items-start md:gap-8"
            >
              <span className="font-mono text-[11px] tracking-[0.3em] text-copper">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl font-light tracking-tight text-bone">
                {pick(locale, service.title_id, service.title_en)}
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                {pick(locale, service.summary_id, service.summary_en)}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col gap-5 border border-line bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-bone">
              {copy.ctaTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              {copy.ctaBody}
            </p>
          </div>
        </div>
      </section>

      <CtaBand locale={locale} dict={dict.home.cta} />
    </>
  );
}
