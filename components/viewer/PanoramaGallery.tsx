"use client";

import { useState } from "react";
import type { Panorama } from "@/lib/data";
import type { Dictionary, Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { chipActive, chipIdle } from "@/lib/styles";
import { PanoramaViewer } from "./PanoramaViewer";

type Props = {
  panoramas: Panorama[];
  locale: Locale;
  dict: Dictionary["viewer"];
};

export function PanoramaGallery({ panoramas, locale, dict }: Props) {
  const [active, setActive] = useState(0);
  const current = panoramas[active] ?? panoramas[0];

  if (!current) return null;

  const label = pick(locale, current.label_id, current.label_en);

  return (
    <div>
      {panoramas.length > 1 ? (
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label={dict.panoramaTitle}
        >
          {panoramas.map((panorama, index) => {
            const isActive = index === active;

            return (
              <button
                key={panorama.image}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(index)}
                className={`border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                  isActive ? chipActive : chipIdle
                }`}
              >
                {pick(locale, panorama.label_id, panorama.label_en)}
              </button>
            );
          })}
        </div>
      ) : null}

      <PanoramaViewer
        key={current.image}
        image={current.image}
        label={label}
        credit={current.credit}
        dict={dict}
      />
    </div>
  );
}
