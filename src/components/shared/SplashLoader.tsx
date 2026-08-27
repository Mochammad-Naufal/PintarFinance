"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashLoaderProps {
  /** Set to true once Supabase auth session or initial loading is ready */
  ready?: boolean;
}

export function SplashLoader({ ready = false }: SplashLoaderProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!ready) return;

    // Minimum display time (600ms) to ensure smooth perception without flashing
    const minTimer = setTimeout(() => {
      setFading(true);
      const removeTimer = setTimeout(() => {
        setVisible(false);
      }, 400);
      return () => clearTimeout(removeTimer);
    }, 600);

    return () => clearTimeout(minTimer);
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-9999 flex flex-col items-center justify-center bg-zinc-950 text-white transition-opacity duration-400 ease-out select-none ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
      style={{
        backgroundColor: "#09090b",
      }}
    >
      {/* Ambient background glow effect */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center gap-5 z-10">
        {/* Animated Brand Icon with Bounce & Pulse Glow */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-2 rounded-3xl bg-linear-to-tr from-emerald-500/30 to-teal-500/20 blur-lg animate-pulse" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900/90 flex items-center justify-center shadow-2xl shadow-emerald-500/30 border border-emerald-500/30 p-3 animate-bounce overflow-hidden">
            <Image
              src="/logo.png"
              alt="Pintar Finance"
              width={80}
              height={80}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Brand Name and Tagline */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-sans">
            Pintar Finance
          </h1>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">
            Cerdas Kelola Keuangan
          </p>
        </div>

        {/* Minimalist Progress Indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
          <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse delay-150" />
        </div>
      </div>

      {/* Footer subtle text */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[11px] text-zinc-400 tracking-wider">
          Memeriksa sesi &amp; memuat data...
        </p>
      </div>
    </div>
  );
}
