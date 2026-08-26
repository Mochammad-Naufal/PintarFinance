"use client";

import { createContext, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

// ─── Lazy initializer (runs once on client mount) ─────────────────────────────

function getInitialTheme(): Theme {
  // Guard for SSR — window is not available on server
  if (typeof window === "undefined") return "dark";

  const stored = localStorage.getItem("pf-theme") as Theme | null;
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer — reads localStorage/system pref synchronously at first
  // render without triggering a setState-in-effect lint violation.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Sync the .dark class on <html> whenever theme changes (DOM = external system).
  // This is the correct use of useEffect: updating an external system, not state.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("pf-theme", next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useTheme = () => useContext(ThemeContext);
