"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { btnPrimary } from "@/lib/styles";

type NavKey = keyof Dictionary["nav"];

const links: { key: Extract<NavKey, "projects" | "services" | "pricing" | "about" | "preview" | "contact">; path: string }[] = [
  { key: "projects", path: "/projects" },
  { key: "services", path: "/services" },
  { key: "pricing", path: "/pricing" },
  { key: "about", path: "/about" },
  { key: "preview", path: "/preview" },
  { key: "contact", path: "/contact" },
];

type Props = {
  locale: Locale;
  nav: Dictionary["nav"];
};

export function Header({ locale, nav }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const rest = pathname.split("/").slice(2).join("/");
  const otherLocale: Locale = locale === "id" ? "en" : "id";
  const otherHref = `/${otherLocale}${rest ? `/${rest}` : ""}`;

  const isActive = (path: string) => pathname === `/${locale}${path}`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open
          ? "border-line bg-ink/95 backdrop-blur"
          : "border-white/5 bg-gradient-to-b from-ink/85 to-transparent"
      }`}
    >
      <div className="shell flex h-20 items-center justify-between gap-6">
        <Link
          href={`/${locale}`}
          aria-label={nav.home}
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="grid size-9 place-items-center border border-copper/60 font-mono text-[11px] tracking-[0.08em] text-copper">
            GS
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-medium tracking-[0.32em] text-bone">
              GEOST
            </span>
            <span className="mt-1 font-mono text-[9px] tracking-[0.42em] text-muted">
              STUDIO
            </span>
          </span>
        </Link>

        <nav
          aria-label={nav.primary}
          className="hidden items-center gap-7 lg:flex"
        >
          {links.map((link) => (
            <Link
              key={link.key}
              href={`/${locale}${link.path}`}
              aria-current={isActive(link.path) ? "page" : undefined}
              className={`font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
                isActive(link.path)
                  ? "text-copper-hi"
                  : "text-muted hover:text-bone"
              }`}
            >
              {nav[link.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="flex items-center gap-1 font-mono text-[11px] tracking-[0.14em]"
            aria-label={nav.language}
          >
            <Languages current={locale} otherHref={otherHref} other={otherLocale} />
          </div>

          <Link
            href={`/${locale}/contact`}
            className={`${btnPrimary} hidden sm:inline-flex`}
          >
            {nav.cta}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? nav.close : nav.menu}
            className="grid size-10 place-items-center border border-line text-bone transition-colors hover:border-copper hover:text-copper-hi lg:hidden"
          >
            <span className="flex flex-col gap-1.5" aria-hidden="true">
              <span
                className={`h-px w-4 bg-current transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-4 bg-current transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-line bg-ink lg:hidden"
        >
          <nav
            aria-label={nav.primary}
            className="shell flex max-h-[calc(100svh-5rem)] flex-col overflow-y-auto py-4"
          >
            {links.map((link) => (
              <Link
                key={link.key}
                href={`/${locale}${link.path}`}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.path) ? "page" : undefined}
                className={`border-b border-line py-4 font-mono text-xs uppercase tracking-[0.22em] ${
                  isActive(link.path) ? "text-copper-hi" : "text-bone"
                }`}
              >
                {nav[link.key]}
              </Link>
            ))}
            <Link
              href={`/${locale}/contact`}
              onClick={() => setOpen(false)}
              className={`${btnPrimary} mt-6`}
            >
              {nav.cta}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Languages({
  current,
  other,
  otherHref,
}: {
  current: Locale;
  other: Locale;
  otherHref: string;
}) {
  return (
    <>
      <span className="text-copper-hi">{current.toUpperCase()}</span>
      <span className="text-line">/</span>
      <Link href={otherHref} className="text-muted transition-colors hover:text-bone">
        {other.toUpperCase()}
      </Link>
    </>
  );
}
