"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/data";
import type { Dictionary, Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { chipActive, chipIdle } from "@/lib/styles";

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["projects"];
  projects: Project[];
  tags: string[];
  tagLabels: Record<string, string>;
  allLabel: string;
};

export function ProjectsGallery({
  locale,
  dict,
  projects,
  tags,
  tagLabels,
  allLabel,
}: Props) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all"
      ? projects
      : projects.filter((project) => project.tags.includes(active));

  return (
    <section className="shell py-20 md:py-28">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">{dict.eyebrow}</p>
          <h2 className="mt-5 text-3xl font-light leading-[1.08] tracking-tight text-bone md:text-[2.75rem]">
            {dict.title}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted md:text-[15px]">
          {dict.description}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2">
        <FilterChip
          label={allLabel}
          active={active === "all"}
          onClick={() => setActive("all")}
        />
        {tags.map((tag) => (
          <FilterChip
            key={tag}
            label={tagLabels[tag] ?? tag}
            active={active === tag}
            onClick={() => setActive(tag)}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => {
          const title = pick(locale, project.title_id, project.title_en);

          return (
            <Link
              key={project.slug}
              href={`/${locale}/projects/${project.slug}`}
              className="group relative block overflow-hidden border border-line bg-surface"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={project.images[0]}
                  alt={title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-90" />
                <span className="absolute left-4 top-4 border border-white/25 bg-ink/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/80 backdrop-blur">
                  {pick(locale, project.category_id, project.category_en)}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-light tracking-tight text-bone">
                  {title}
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {project.location} · {project.year}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="absolute bottom-5 right-5 font-mono text-xs text-bone/40 transition-colors group-hover:text-copper-hi"
              >
                ↗
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
        active ? chipActive : chipIdle
      }`}
    >
      {label}
    </button>
  );
}
