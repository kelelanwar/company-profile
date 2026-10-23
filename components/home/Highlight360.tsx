import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnPrimary } from "@/lib/styles";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["highlight360"];
};

export function Highlight360({ locale, dict }: Props) {
  return (
    <section className="border-b border-line bg-surface">
      <div className="shell grid gap-14 py-20 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="relative">
          <div className="relative aspect-[16/11] overflow-hidden border border-line">
            <Image
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80"
              alt={dict.title}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-3 border border-copper/40 bg-ink/85 px-4 py-2 backdrop-blur">
            <span className="grid size-8 place-items-center border border-copper font-mono text-[10px] tracking-[0.05em] text-copper">
              360°
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/80">
              {dict.hint}
            </span>
          </div>
        </div>

        <div>
          <p className="eyebrow">{dict.eyebrow}</p>
          <h2 className="mt-5 text-3xl font-light leading-[1.1] tracking-tight text-bone md:text-[2.75rem]">
            {dict.title}
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-muted md:text-[15px]">
            {dict.description}
          </p>

          <ul className="mt-8 space-y-3">
            {dict.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm text-bone/90">
                <span aria-hidden="true" className="mt-1 text-copper">
                  ▸
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <Link href={`/${locale}/projects`} className={`${btnPrimary} mt-10`}>
            {dict.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
