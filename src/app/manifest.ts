import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pintar Finance — Manajemen Keuangan Cerdas",
    short_name: "Pintar Finance",
    description: "Aplikasi manajemen keuangan pribadi yang cerdas untuk Gen Z Indonesia.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
