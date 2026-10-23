import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { btnGhost, btnPrimary } from "@/lib/styles";
import { whatsappUrl } from "@/lib/site";

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
  const copy = dict.pages.preview;

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <section className="shell grid gap-12 py-16 lg:grid-cols-[1fr_1fr] lg:gap-20 md:py-20">
        <ol className="grid gap-px bg-line">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="bg-ink p-6 md:p-8">
              <span className="font-mono text-[11px] tracking-[0.3em] text-copper">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-4 text-lg font-light tracking-tight text-bone">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col justify-between border border-line bg-surface p-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
              {copy.eyebrow}
            </p>
            <h2 className="mt-4 text-2xl font-light leading-snug tracking-tight text-bone">
              {copy.statusTitle}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {copy.statusBody}
            </p>

            <p className="mt-6 border-l-2 border-copper/60 pl-4 text-xs leading-relaxed text-muted">
              {copy.notice}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <a
              href={whatsappUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className={btnPrimary}
            >
              {copy.cta}
            </a>
            <a href={`/${locale}/projects`} className={btnGhost}>
              {dict.home.projects.cta}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
