import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/lib/locales";

function preferredLocale(request: NextRequest): Locale | null {
  const header = request.headers.get("accept-language");
  if (!header) return null;

  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    if (tag.startsWith("en")) return "en";
    if (tag.startsWith("id")) return "id";
  }

  return null;
}

/**
 * Redirects locale-less paths (`/projects`) to the visitor's locale
 * (`/id/projects`). Default locale is Indonesian.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocalePrefix) return NextResponse.next();

  const locale = preferredLocale(request) ?? defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
