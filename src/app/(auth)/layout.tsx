import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150 relative overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl pointer-events-none" />

      {/* Main Brand & Form Wrapper */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all">
              <BarChart3 className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
              Pintar Finance
            </span>
          </Link>
        </div>

        {/* Card Body */}
        {children}

        {/* Footer Note */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          Dilindungi oleh enkripsi modern dan Supabase Auth & RLS.
        </p>
      </div>
    </div>
  );
}
