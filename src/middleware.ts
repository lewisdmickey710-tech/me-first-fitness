import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // /api routes handle their own auth (a CRON_SECRET check for the cron
    // job, session/role checks for the export endpoints) and return JSON
    // errors, not a redirect -- this session-cookie/page-redirect gate
    // doesn't apply to them. Vercel's cron invocation in particular has no
    // session cookie at all, so without this exclusion it always got
    // redirected to /login before the route's own auth check ever ran.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
