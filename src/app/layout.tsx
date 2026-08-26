import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import "./globals.css";

// ─── Fonts: Plus Jakarta Sans (Fintech UI) & JetBrains Mono (Clear Numbers) ──

const sansFont = Plus_Jakarta_Sans({
  variable: "--font-sans-main",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-numbers",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// ─── Viewport & Theme Color (PWA & Mobile Ready) ──────────────────────────────

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Pintar Finance",
    template: "%s — Pintar Finance",
  },
  description:
    "Aplikasi manajemen keuangan pribadi yang cerdas untuk Gen Z Indonesia.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pintar Finance",
  },
  applicationName: "Pintar Finance",
};

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${sansFont.variable} ${monoFont.variable} h-full antialiased font-sans`}
    >
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
