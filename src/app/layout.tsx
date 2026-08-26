import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
          "bg-zinc-950 text-zinc-50",
          "font-sans",
          "[font-variant-numeric:tabular-nums]", // tabular numbers for all financial figures
        ].join(" ")}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
