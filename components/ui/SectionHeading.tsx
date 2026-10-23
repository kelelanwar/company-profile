type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, className }: Props) {
  return (
    <div
      className={`flex flex-col gap-6 md:flex-row md:items-end md:justify-between ${className ?? ""}`}
    >
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-5 text-3xl font-light leading-[1.08] tracking-tight text-bone md:text-[2.75rem]">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-muted md:text-[15px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
