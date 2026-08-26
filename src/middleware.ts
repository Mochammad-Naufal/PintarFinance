import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Refresh the session — IMPORTANT: do not remove this call.
  // It keeps the Supabase auth token fresh on every request.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Example: redirect unauthenticated users away from protected routes.
  // Uncomment and customise once you have auth pages set up.
  //
  // if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
  //   const loginUrl = request.nextUrl.clone();
  //   loginUrl.pathname = "/login";
  //   return NextResponse.redirect(loginUrl);
  // }

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
