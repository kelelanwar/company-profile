import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { news } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["news"];
};

function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function NewsGrid({ locale, dict }: Props) {
  return (
    <section className="shell py-20 md:py-28">
      <SectionHeading
        eyebrow={dict.eyebrow}
        title={dict.title}
        description={dict.description}
      />

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {news.map((item) => (
          <article key={item.slug} className="group flex flex-col">
            <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface">
              <Image
                src={item.image}
                alt={pick(locale, item.title_id, item.title_en)}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
            </div>
            <div className="mt-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              <span className="text-copper">
                {pick(locale, item.category_id, item.category_en)}
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.date}>{formatDate(item.date, locale)}</time>
            </div>
            <h3 className="mt-3 text-lg font-light leading-snug tracking-tight text-bone">
              {pick(locale, item.title_id, item.title_en)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {pick(locale, item.excerpt_id, item.excerpt_en)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
