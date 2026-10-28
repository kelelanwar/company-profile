import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/home/CtaBand";
import { ProjectsGallery } from "@/components/home/ProjectsGallery";
import { PageHeader } from "@/components/ui/PageHeader";
import { getProjectTags, projects } from "@/lib/data";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projects">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.nav.projects,
    description: dict.pages.projects.description,
  };
}

export default async function ProjectsPage({
  params,
}: PageProps<"/[locale]/projects">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <PageHeader
        eyebrow={dict.pages.projects.eyebrow}
        title={dict.pages.projects.title}
        description={dict.pages.projects.description}
      />
      <ProjectsGallery
        locale={locale}
        dict={{
          ...dict.home.projects,
          eyebrow: dict.pages.projects.eyebrow,
          title: dict.pages.projects.title,
          description: dict.pages.projects.description,
        }}
        projects={projects}
        tags={getProjectTags()}
        tagLabels={dict.taxonomy.tags}
        allLabel={dict.common.all}
      />
      <CtaBand locale={locale} dict={dict.home.cta} />
    </>
  );
}
