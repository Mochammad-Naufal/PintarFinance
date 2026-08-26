import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Pintar Finance",
    template: "%s — Pintar Finance",
  },
  description:
    "Aplikasi manajemen keuangan pribadi yang cerdas untuk Gen Z Indonesia.",
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
    >
      <head>
        {/*
         * Anti-flash script: runs synchronously before React hydration.
         * Reads localStorage "pf-theme" (or system preference) and
         * toggles `.dark` on <html> immediately to prevent theme flicker.
         */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pf-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={[
          "min-h-full",
          "bg-zinc-50 dark:bg-zinc-950",
          "text-zinc-900 dark:text-zinc-100",
          "font-sans",
          "[font-variant-numeric:tabular-nums]",
          "selection:bg-emerald-500 selection:text-white",
        ].join(" ")}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
