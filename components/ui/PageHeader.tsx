type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

/** Page-level intro used by every route except the home page. */
export function PageHeader({ eyebrow, title, description, children }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-copper/10 blur-3xl"
      />
      <div className="shell relative pb-14 pt-36 md:pb-20 md:pt-44">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-light leading-[1.05] tracking-tight text-bone md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
