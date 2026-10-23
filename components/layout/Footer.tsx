import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { services } from "@/lib/data";
import { btnPrimary } from "@/lib/styles";
import { mailtoUrl, site, whatsappUrl } from "@/lib/site";

type Props = {
  locale: Locale;
  footer: Dictionary["footer"];
};

export function Footer({ locale, footer }: Props) {
  const companyLinks = [
    { label: footer.links.about, href: `/${locale}/about` },
    { label: footer.links.projects, href: `/${locale}/projects` },
    { label: footer.links.pricing, href: `/${locale}/pricing` },
    { label: footer.links.contact, href: `/${locale}/contact` },
  ];

  return (
    <footer className="border-t border-line bg-carbone">
      <div className="shell grid gap-12 py-16 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr] lg:gap-10">
        <div>
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center border border-copper/60 font-mono text-[11px] text-copper">
              GS
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-medium tracking-[0.32em]">
                GEOST
              </span>
              <span className="mt-1 font-mono text-[9px] tracking-[0.42em] text-muted">
                STUDIO
              </span>
            </span>
          </Link>

          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">
            {footer.tagline}
          </p>

          <div className="mt-6 space-y-2 text-sm text-muted">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
              {footer.studioLabel}
            </p>
            <p>{footer.address}</p>
            <p className="font-mono text-[11px] tracking-[0.08em]">
              {footer.hours}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-1 text-sm">
            <a
              href={whatsappUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bone transition-colors hover:text-copper-hi"
            >
              {footer.phoneLabel} · +62 812-3456-7890
            </a>
            <a
              href={mailtoUrl()}
              className="text-bone transition-colors hover:text-copper-hi"
            >
              {footer.emailLabel} · {site.email}
            </a>
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
            {footer.companyTitle}
          </p>
          <ul className="mt-5 space-y-3 text-sm text-muted">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-bone">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
            {footer.servicesTitle}
          </p>
          <ul className="mt-5 space-y-3 text-sm text-muted">
            {services.slice(0, 5).map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/${locale}/services`}
                  className="transition-colors hover:text-bone"
                >
                  {pick(locale, service.title_id, service.title_en)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-copper">
            {footer.newsletterTitle}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {footer.newsletterBody}
          </p>

          <form
            action={mailtoUrl(footer.newsletterTitle)}
            method="post"
            encType="text/plain"
            className="mt-5 flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {footer.newsletterPlaceholder}
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              placeholder={footer.newsletterPlaceholder}
              className="w-full border border-line bg-ink px-4 py-3 text-sm text-bone placeholder:text-muted/60 focus:border-copper focus:outline-none"
            />
            <button type="submit" className={`${btnPrimary} shrink-0`}>
              {footer.newsletterSubmit}
            </button>
          </form>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted/70">
            {footer.newsletterNote}
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-4 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.rights}</p>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-bone"
            >
              Instagram
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-bone"
            >
              LinkedIn
            </a>
            <a
              href={site.behance}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-bone"
            >
              Behance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
