import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { services } from "@/lib/data";
import { btnQuiet } from "@/lib/styles";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["services"];
};

export function ServicesGrid({ locale, dict }: Props) {
  return (
    <section className="border-y border-line bg-carbone py-20 md:py-28">
      <div className="shell">
        <SectionHeading
          eyebrow={dict.eyebrow}
          title={dict.title}
          description={dict.description}
        />

        <div className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={service.slug}
              className="group relative bg-carbone p-8 transition-colors duration-300 hover:bg-surface"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.3em] text-copper">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-line transition-all duration-300 group-hover:w-16 group-hover:bg-copper"
                />
              </div>
              <h3 className="mt-9 text-xl font-light tracking-tight text-bone">
                {pick(locale, service.title_id, service.title_en)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {pick(locale, service.summary_id, service.summary_en)}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link href={`/${locale}/services`} className={btnQuiet}>
            {dict.cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
