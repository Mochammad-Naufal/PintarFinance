import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Refresh the session — IMPORTANT: do not remove this call.
  // It keeps the Supabase auth token fresh on every request.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  await supabase.auth.getUser();

  // IMPORTANT: return supabaseResponse (not NextResponse.next()) so that
  // the updated auth cookies are forwarded to the browser.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
