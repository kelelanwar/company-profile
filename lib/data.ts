import newsData from "@/data/news.json";
import projectsData from "@/data/projects.json";
import servicesData from "@/data/services.json";
import teamData from "@/data/team.json";

export type Project = {
  slug: string;
  title_id: string;
  title_en: string;
  category_id: string;
  category_en: string;
  tags: string[];
  location: string;
  year: string;
  area: string;
  description_id: string;
  description_en: string;
  images: string[];
  modelUrl?: string | null;
  poster?: string | null;
};

export type Service = {
  slug: string;
  title_id: string;
  title_en: string;
  summary_id: string;
  summary_en: string;
};

export type TeamMember = {
  name: string;
  role_id: string;
  role_en: string;
  image: string;
};

export type NewsItem = {
  slug: string;
  title_id: string;
  title_en: string;
  excerpt_id: string;
  excerpt_en: string;
  category_id: string;
  category_en: string;
  date: string;
  image: string;
};

export const projects = projectsData as Project[];
export const services = servicesData as Service[];
export const team = teamData as TeamMember[];
export const news = newsData as NewsItem[];

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectTags(): string[] {
  return Array.from(new Set(projects.flatMap((project) => project.tags)));
}

export function getProjectSlugs(): string[] {
  return projects.map((project) => project.slug);
}
