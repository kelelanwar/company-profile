import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, getProjectSlugs } from "@/lib/data";
import { hasLocale, locales, pick } from "@/lib/i18n";
import { ProjectDetail } from "./project-detail";

// Unknown slugs must answer 404, so this segment opts out of instant
// navigation and validates `params` in the page shell.
export const instant = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getProjectSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(locale)) return {};

  const project = getProject(slug);
  if (!project) return {};

  return {
    title: pick(locale, project.title_id, project.title_en),
    description: pick(locale, project.description_id, project.description_en),
    openGraph: {
      images: [{ url: project.images[0] }],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: PageProps<"/[locale]/projects/[slug]">) {
  const { locale, slug } = await params;

  if (!hasLocale(locale)) notFound();

  const project = getProject(slug);
  if (!project) notFound();

  return <ProjectDetail locale={locale} project={project} />;
}
