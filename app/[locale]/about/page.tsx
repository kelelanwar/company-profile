import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutSection } from "@/components/home/AboutSection";
import { CtaBand } from "@/components/home/CtaBand";
import { TeamGrid } from "@/components/home/TeamGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.pages.about.title,
    description: dict.pages.about.description,
  };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const copy = dict.pages.about;

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <AboutSection locale={locale} dict={dict.home.about} />

      <section className="border-y border-line bg-carbone py-20 md:py-24">
        <div className="shell">
          <h2 className="eyebrow">{copy.valuesTitle}</h2>
          <div className="mt-10 grid gap-px bg-line md:grid-cols-3">
            {copy.values.map((value) => (
              <article key={value.title} className="bg-carbone p-8">
                <h3 className="text-lg font-light tracking-tight text-bone">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {value.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <TeamGrid locale={locale} dict={dict.home.team} />
      <CtaBand locale={locale} dict={dict.home.cta} />
    </>
  );
}
