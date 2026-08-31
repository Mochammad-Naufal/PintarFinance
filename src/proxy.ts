import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Routes that DON'T require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/offline"];

// Routes that should redirect to /dashboard if already logged in
const AUTH_REDIRECT_ROUTES = ["/login", "/register", "/"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Immediately bypass all static files, service workers, manifests, images, icons, and fonts
  // WITHOUT initializing Supabase SSR cookies to avoid HTTP 431 (Request Header Fields Too Large)
  if (
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Initialize Supabase SSR only on application pages
  const { supabase, supabaseResponse } = createClient(request);

  // Always call getUser() to refresh the session cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRedirectRoute = AUTH_REDIRECT_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // 3. If already logged in and visiting auth pages → redirect to /dashboard
  if (user && isAuthRedirectRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 4. If NOT logged in and visiting a protected route → redirect to /login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 5. Otherwise, pass through (with refreshed cookies)
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - sw.js (service worker)
     * - manifest.json / manifest.webmanifest
     * - favicon.ico, robots.txt, and image/font assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.webmanifest|manifest\\.json|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|js|css)$).*)",
  ],
};
