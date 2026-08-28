import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Routes that DON'T require authentication
const PUBLIC_ROUTES = ["/login", "/register"];

// Routes that should redirect to /dashboard if already logged in
const AUTH_REDIRECT_ROUTES = ["/login", "/register", "/"];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const pathname = request.nextUrl.pathname;

  // 1. Immediately bypass all static files, images, icons, and fonts
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".") // Any static file with extension like logo.png, favicon.ico, etc.
  ) {
    return supabaseResponse;
  }

  // Always call getUser() to refresh the session cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRedirectRoute = AUTH_REDIRECT_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // 2. If already logged in and visiting auth pages → redirect to /dashboard
  if (user && isAuthRedirectRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. If NOT logged in and visiting a protected route → redirect to /login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 4. Otherwise, pass through (with refreshed cookies)
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, and image assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
