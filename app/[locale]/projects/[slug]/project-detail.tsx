import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/data";
import { projects } from "@/lib/data";
import { getDictionary, pick, type Locale } from "@/lib/i18n";
import { btnGhost, btnPrimary } from "@/lib/styles";
import { mailtoUrl, whatsappUrl } from "@/lib/site";
import { PortfolioViewer } from "@/components/viewer/PortfolioViewer";

type DetailProps = {
  locale: Locale;
  project: Project;
};

export async function ProjectDetail({ locale, project }: DetailProps) {
  const dict = await getDictionary(locale);

  const copy = dict.pages.projectDetail;
  const title = pick(locale, project.title_id, project.title_en);
  const category = pick(locale, project.category_id, project.category_en);

  const specs = [
    { label: copy.location, value: project.location },
    { label: copy.year, value: project.year },
    { label: copy.area, value: project.area },
    { label: copy.category, value: category },
  ];

  const related = projects
    .filter((item) => item.slug !== project.slug && item.tags.some((tag) => project.tags.includes(tag)))
    .slice(0, 3);

  return (
    <article>
      <header className="border-b border-line pt-32 md:pt-40">
        <div className="shell pb-10">
          <Link
            href={`/${locale}/projects`}
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted transition-colors hover:text-copper-hi"
          >
            ← {copy.back}
          </Link>

          <div className="mt-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">{category}</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-light leading-[1.05] tracking-tight text-bone md:text-6xl">
                {title}
              </h1>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
              {project.location} · {project.year}
            </p>
          </div>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden border-y border-line">
          <Image
            src={project.images[0]}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
        </div>
      </header>

      {project.modelUrl || project.demoScene ? (
        <section className="shell pt-14 md:pt-16">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">{copy.viewerTitle}</p>
            {project.demoScene ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {dict.viewer.demoBadge}
              </p>
            ) : null}
          </div>
          <PortfolioViewer
            dict={dict.viewer}
            modelUrl={project.modelUrl}
            demoScene={project.demoScene}
          />
          {project.demoScene ? (
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted/80">
              {dict.viewer.demoNote}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="shell grid gap-14 py-16 lg:grid-cols-[1.6fr_1fr] lg:gap-20 md:py-20">
        <div>
          <p className="eyebrow">{copy.overview}</p>
          <p className="mt-5 text-base leading-relaxed text-bone/85 md:text-lg">
            {pick(locale, project.description_id, project.description_en)}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {project.images.slice(1).map((image) => (
              <div
                key={image}
                className="relative aspect-[4/3] overflow-hidden border border-line"
              >
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {project.modelUrl || project.demoScene ? null : (
            <p className="mt-8 border border-line bg-surface px-5 py-4 text-sm leading-relaxed text-muted">
              {copy.viewerNotice}
            </p>
          )}
        </div>

        <aside>
          <dl className="border-t border-line">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-baseline justify-between gap-6 border-b border-line py-4"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {spec.label}
                </dt>
                <dd className="text-right text-sm text-bone">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-col gap-3">
            <Link href={`/${locale}/contact`} className={btnPrimary}>
              {copy.ctaPrimary}
            </Link>
            <a
              href={whatsappUrl(locale, title)}
              target="_blank"
              rel="noopener noreferrer"
              className={btnGhost}
            >
              {dict.common.consult}
            </a>
            <a href={mailtoUrl(title)} className={btnGhost}>
              {dict.common.emailUs}
            </a>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="border-t border-line bg-carbone py-16 md:py-20">
          <div className="shell">
            <p className="eyebrow">{dict.home.projects.eyebrow}</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${locale}/projects/${item.slug}`}
                  className="group relative block overflow-hidden border border-line"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.images[0]}
                      alt={pick(locale, item.title_id, item.title_en)}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-base font-light text-bone">
                      {pick(locale, item.title_id, item.title_en)}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                      {item.location} · {item.year}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="shell py-16 md:py-20">
        <div className="flex flex-col gap-6 border border-line bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="text-2xl font-light tracking-tight text-bone md:text-3xl">
              {copy.ctaTitle}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              {copy.ctaBody}
            </p>
          </div>
          <Link href={`/${locale}/preview`} className={btnPrimary}>
            {dict.nav.preview}
          </Link>
        </div>
      </section>
    </article>
  );
}
