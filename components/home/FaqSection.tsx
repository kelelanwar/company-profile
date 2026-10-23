import type { Dictionary } from "@/lib/i18n";

type Props = {
  dict: Dictionary["home"]["faq"];
};

export function FaqSection({ dict }: Props) {
  return (
    <section className="border-y border-line bg-carbone py-20 md:py-28">
      <div className="shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="eyebrow">{dict.eyebrow}</p>
          <h2 className="mt-5 text-3xl font-light leading-[1.1] tracking-tight text-bone md:text-[2.6rem]">
            {dict.title}
          </h2>
        </div>

        <div>
          {dict.items.map((item) => (
            <details key={item.q} className="group border-t border-line py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-base text-bone">
                <span>{item.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 font-mono text-lg leading-none text-copper transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
