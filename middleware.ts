import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Routes that DON'T require authentication
const PUBLIC_ROUTES = ["/login", "/register"];

// Routes that should redirect to /dashboard if already logged in
const AUTH_REDIRECT_ROUTES = ["/login", "/register", "/"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const pathname = request.nextUrl.pathname;

  // Always call getUser() to refresh the session cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRedirectRoute = AUTH_REDIRECT_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  // 1. If already logged in and visiting auth pages → redirect to /dashboard
  if (user && isAuthRedirectRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 2. If NOT logged in and visiting a protected route → redirect to /login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the original destination so we can redirect back after login
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Otherwise, pass through (with refreshed cookies)
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (Next.js build artifacts)
     * - _next/image (Next.js image optimization)
     * - favicon.ico, manifest, icons, images, etc.
     * - Supabase auth callback route
     */
    "/((?!_next/static|_next/image|favicon\\.ico|manifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$|auth/callback).*)",
  ],
};
