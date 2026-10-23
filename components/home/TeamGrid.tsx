import Image from "next/image";
import type { Dictionary, Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { team } from "@/lib/data";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["team"];
};

export function TeamGrid({ locale, dict }: Props) {
  return (
    <section className="border-y border-line bg-carbone py-20 md:py-28">
      <div className="shell">
        <SectionHeading
          eyebrow={dict.eyebrow}
          title={dict.title}
          description={dict.description}
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <figure key={member.name} className="group">
              <div className="relative aspect-[3/4] overflow-hidden border border-line bg-surface">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
                <span className="text-base text-bone">{member.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {pick(locale, member.role_id, member.role_en)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
