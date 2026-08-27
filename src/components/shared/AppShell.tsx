"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SplashLoader } from "./SplashLoader";

/**
 * AppShell wraps the entire app and:
 * 1. Shows <SplashLoader> immediately on first paint.
 * 2. Checks the Supabase session asynchronously.
 * 3. Signals the loader to fade out once the session check resolves.
 *
 * This lives in the client layer so the Server Component root layout
 * stays a pure RSC (no "use client" needed there).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Attempt to get the session — this also refreshes the cookie if needed.
    supabase.auth.getSession().finally(() => {
      setReady(true);
    });
  }, []);

  return (
    <>
      <SplashLoader ready={ready} />
      {children}
    </>
  );
}
