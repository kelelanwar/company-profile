const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-200";

export const btnPrimary = `${base} bg-copper text-ink hover:bg-copper-hi`;
export const btnGhost = `${base} border border-line text-bone hover:border-copper hover:text-copper-hi`;
export const btnGhostLight = `${base} border border-bone/30 text-bone hover:border-bone hover:bg-bone/10`;
export const btnQuiet = `${base} px-0 py-2 text-muted hover:text-copper-hi`;
export const chipActive = "border-copper bg-copper text-ink";
export const chipIdle = "border-line text-muted hover:border-copper/60 hover:text-bone";
