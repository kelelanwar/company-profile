import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { btnPrimary } from "@/lib/styles";
import { mailtoUrl, site, whatsappUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.nav.contact,
    description: dict.pages.contact.description,
  };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const copy = dict.pages.contact;

  const channels = [
    {
      label: copy.whatsappLabel,
      value: "+62 812-3456-7890",
      note: copy.whatsappNote,
      href: whatsappUrl(locale),
      external: true,
    },
    {
      label: copy.emailLabel,
      value: site.email,
      note: copy.emailNote,
      href: mailtoUrl(),
      external: false,
    },
    {
      label: copy.studioLabel,
      value: dict.footer.address,
      note: copy.studioNote,
      href: `https://maps.google.com/?q=${encodeURIComponent(dict.footer.address)}`,
      external: true,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <section className="shell grid gap-14 py-16 lg:grid-cols-2 lg:gap-20 md:py-20">
        <div>
          <div className="grid gap-px bg-line">
            {channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.external ? "_blank" : undefined}
                rel={channel.external ? "noopener noreferrer" : undefined}
                className="group flex items-start justify-between gap-6 bg-ink p-6 transition-colors hover:bg-surface"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
                    {channel.label}
                  </p>
                  <p className="mt-3 text-base text-bone">{channel.value}</p>
                  <p className="mt-1 text-xs text-muted">{channel.note}</p>
                </div>
                <span
                  aria-hidden="true"
                  className="font-mono text-sm text-muted transition-colors group-hover:text-copper-hi"
                >
                  ↗
                </span>
              </a>
            ))}
          </div>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            {dict.footer.hours}
          </p>
        </div>

        <div className="border border-line bg-surface p-6 md:p-8">
          <h2 className="text-xl font-light tracking-tight text-bone">
            {copy.formTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{copy.formNote}</p>

          <form
            action={mailtoUrl(copy.formTitle)}
            method="post"
            encType="text/plain"
            className="mt-6 grid gap-4"
          >
            <div className="grid gap-2">
              <label
                htmlFor="name"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
              >
                {copy.formName}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="w-full border border-line bg-ink px-4 py-3 text-sm text-bone focus:border-copper focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="email"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
              >
                {copy.formEmail}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border border-line bg-ink px-4 py-3 text-sm text-bone focus:border-copper focus:outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="message"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
              >
                {copy.formMessage}
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full resize-y border border-line bg-ink px-4 py-3 text-sm text-bone focus:border-copper focus:outline-none"
              />
            </div>

            <button type="submit" className={`${btnPrimary} mt-2`}>
              {copy.formSubmit}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
