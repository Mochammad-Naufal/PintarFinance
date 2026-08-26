import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased font-sans`}
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
        {/* Anti-flash theme initialization via official Next.js Script */}
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pf-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})()`,
          }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
