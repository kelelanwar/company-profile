import type { Dictionary } from "@/lib/i18n";

type Props = {
  dict: Dictionary["home"]["testimonials"];
};

export function TestimonialsSection({ dict }: Props) {
  return (
    <section className="shell py-20 md:py-28">
      <div className="max-w-2xl">
        <p className="eyebrow">{dict.eyebrow}</p>
        <h2 className="mt-5 text-3xl font-light leading-[1.08] tracking-tight text-bone md:text-[2.75rem]">
          {dict.title}
        </h2>
      </div>

      <div className="mt-14 grid gap-px bg-line md:grid-cols-3">
        {dict.items.map((item) => (
          <blockquote key={item.name} className="flex flex-col bg-ink p-8">
            <span aria-hidden="true" className="font-mono text-3xl leading-none text-copper">
              &ldquo;
            </span>
            <p className="mt-5 flex-1 text-sm leading-relaxed text-bone/85">
              {item.quote}
            </p>
            <footer className="mt-8 border-t border-line pt-4">
              <p className="text-sm text-bone">{item.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {item.role}
              </p>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
