"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnGhostLight, btnPrimary } from "@/lib/styles";

const images = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=80",
] as const;

const AUTOPLAY_MS = 8000;

type Props = {
  locale: Locale;
  dict: Dictionary["home"]["hero"];
};

export function HeroSlider({ locale, dict }: Props) {
  const [index, setIndex] = useState(0);
  const count = dict.slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [index, count]);

  const slide = dict.slides[index];
  const slideLinks = [
    { primary: `/${locale}/contact`, secondary: `/${locale}/projects` },
    { primary: `/${locale}/projects`, secondary: `/${locale}/contact` },
  ];
  const links = slideLinks[index] ?? slideLinks[0];

  return (
    <section className="relative flex min-h-svh items-end overflow-hidden bg-ink">
      {images.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt={dict.slides[i].imageAlt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-transparent" />

      <div className="shell relative z-10 flex min-h-svh flex-col justify-end pb-12 pt-32">
        <div key={index} className="max-w-3xl animate-rise">
          <p className="eyebrow">{slide.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-light leading-[1.03] tracking-tight text-bone sm:text-5xl lg:text-[4.2rem]">
            {slide.title}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-bone/70 md:text-base">
            {slide.description}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={links.primary} className={btnPrimary}>
              {slide.primaryCta}
            </Link>
            <Link href={links.secondary} className={btnGhostLight}>
              {slide.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={dict.prev}
              className="grid size-10 place-items-center border border-white/20 text-bone transition-colors hover:border-copper hover:text-copper-hi"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={dict.next}
              className="grid size-10 place-items-center border border-white/20 text-bone transition-colors hover:border-copper hover:text-copper-hi"
            >
              <span aria-hidden="true">→</span>
            </button>
            <span className="ml-2 font-mono text-[11px] tracking-[0.3em] text-muted">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-2" role="tablist" aria-label={dict.slideLabel}>
            {dict.slides.map((item, i) => (
              <button
                key={item.eyebrow}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${dict.slideLabel} ${i + 1}`}
                onClick={() => go(i)}
                className={`h-px transition-all duration-300 ${
                  i === index ? "w-12 bg-copper" : "w-6 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
