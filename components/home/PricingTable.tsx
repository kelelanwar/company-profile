import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnGhost, btnPrimary } from "@/lib/styles";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["pricing"];
};

export function PricingTable({ locale, dict }: Props) {
  return (
    <section id="pricing" className="shell py-20 md:py-28">
      <SectionHeading
        eyebrow={dict.eyebrow}
        title={dict.title}
        description={dict.description}
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {dict.tiers.map((tier) => (
          <article
            key={tier.name}
            className={`relative flex flex-col border p-8 ${
              tier.featured
                ? "border-copper/70 bg-surface-hi"
                : "border-line bg-surface"
            }`}
          >
            {tier.badge ? (
              <span className="absolute -top-3 left-8 bg-copper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                {tier.badge}
              </span>
            ) : null}

            <h3 className="font-mono text-[11px] uppercase tracking-[0.26em] text-copper">
              {tier.name}
            </h3>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-light tracking-tight text-bone">
                {tier.price}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                {tier.unit}
              </span>
            </p>

            <p className="mt-3 text-sm leading-relaxed text-muted">
              {tier.summary}
            </p>

            <div className="mt-6 h-px w-full bg-line" />

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-bone/85">
                  <span aria-hidden="true" className="mt-px text-copper">
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/${locale}/contact`}
              className={`${tier.featured ? btnPrimary : btnGhost} mt-8 w-full`}
            >
              {tier.cta}
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted/80">
        {dict.note}
      </p>
    </section>
  );
}
