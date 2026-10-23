import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnGhost, btnPrimary } from "@/lib/styles";
import { whatsappUrl } from "@/lib/site";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["cta"];
};

export function CtaBand({ locale, dict }: Props) {
  return (
    <section className="relative overflow-hidden border-t border-line bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/2 size-[28rem] -translate-y-1/2 rounded-full bg-copper/10 blur-3xl"
      />
      <div className="shell relative grid gap-8 py-16 md:grid-cols-[1.3fr_1fr] md:items-center md:py-20">
        <div>
          <h2 className="max-w-xl text-3xl font-light leading-[1.1] tracking-tight text-bone md:text-4xl">
            {dict.title}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted md:text-[15px]">
            {dict.description}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <a
            href={whatsappUrl(locale)}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            {dict.primary}
          </a>
          <Link href={`/${locale}/pricing`} className={btnGhost}>
            {dict.secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
