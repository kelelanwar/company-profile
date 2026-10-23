import type { Dictionary } from "@/lib/i18n";

type Props = {
  dict: Dictionary["home"];
};

export function StatsBand({ dict }: Props) {
  return (
    <section aria-label={dict.statsLabel} className="border-b border-line bg-carbone">
      <dl className="shell grid grid-cols-2 gap-px py-2 md:grid-cols-4">
        {dict.stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 border-line px-2 py-8 md:border-l md:px-8 md:first:border-l-0 md:first:pl-0"
          >
            <dt className="order-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {stat.label}
            </dt>
            <dd className="order-1 text-3xl font-light tracking-tight text-copper-hi md:text-4xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
