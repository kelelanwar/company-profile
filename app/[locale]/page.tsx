import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AboutSection } from "@/components/home/AboutSection";
import { CtaBand } from "@/components/home/CtaBand";
import { FaqSection } from "@/components/home/FaqSection";
import { HeroSlider } from "@/components/home/HeroSlider";
import { Highlight360 } from "@/components/home/Highlight360";
import { NewsGrid } from "@/components/home/NewsGrid";
import { PricingTable } from "@/components/home/PricingTable";
import { ProjectsGallery } from "@/components/home/ProjectsGallery";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { StatsBand } from "@/components/home/StatsBand";
import { TeamGrid } from "@/components/home/TeamGrid";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { getProjectTags, projects } from "@/lib/data";
import { getDictionary, hasLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.nav.home,
    description: dict.meta.home.description,
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <HeroSlider locale={locale} dict={dict.home.hero} />
      <StatsBand dict={dict.home} />
      <AboutSection locale={locale} dict={dict.home.about} />
      <ServicesGrid locale={locale} dict={dict.home.services} />
      <Highlight360 locale={locale} dict={dict.home.highlight360} />
      <ProjectsGallery
        locale={locale}
        dict={dict.home.projects}
        projects={projects.slice(0, 6)}
        tags={getProjectTags()}
        tagLabels={dict.taxonomy.tags}
        allLabel={dict.common.all}
      />
      <PricingTable locale={locale} dict={dict.home.pricing} />
      <TeamGrid locale={locale} dict={dict.home.team} />
      <TestimonialsSection dict={dict.home.testimonials} />
      <FaqSection dict={dict.home.faq} />
      <NewsGrid locale={locale} dict={dict.home.news} />
      <CtaBand locale={locale} dict={dict.home.cta} />
    </>
  );
}
