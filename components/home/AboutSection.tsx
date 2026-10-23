import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnGhost } from "@/lib/styles";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["about"];
};

export function AboutSection({ locale, dict }: Props) {
  return (
    <section className="shell grid gap-16 py-20 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-20">
      <div className="relative">
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-line">
          <Image
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80"
            alt={dict.imageAlt}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="absolute -bottom-8 right-0 hidden aspect-square w-2/5 overflow-hidden border border-line sm:block lg:-right-8">
          <Image
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
            alt={dict.imageAltSecondary}
            fill
            sizes="(min-width: 1024px) 18vw, 40vw"
            className="object-cover"
          />
        </div>

        <div className="absolute left-4 top-4 border border-white/20 bg-ink/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/80 backdrop-blur">
          Est. 2014 · Bandung
        </div>
      </div>

      <div className="lg:pl-4">
        <p className="eyebrow">{dict.eyebrow}</p>
        <h2 className="mt-5 text-3xl font-light leading-[1.1] tracking-tight text-bone md:text-[2.75rem]">
          {dict.title}
        </h2>
        <p className="mt-7 text-sm leading-relaxed text-muted md:text-[15px]">
          {dict.body}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted md:text-[15px]">
          {dict.bodySecondary}
        </p>

        <ul className="mt-9">
          {dict.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-4 border-t border-line py-4 text-sm text-bone/90"
            >
              <span aria-hidden="true" className="font-mono text-copper">
                —
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <Link href={`/${locale}/about`} className={`${btnGhost} mt-10`}>
          {dict.cta}
        </Link>
      </div>
    </section>
  );
}
