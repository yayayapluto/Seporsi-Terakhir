import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|icons/|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?|txt|xml)).*)",
  ],
};
