"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { signInWithOtp, signInWithPassword } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<"password" | "magic_link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (authMethod === "password") {
        const res = await signInWithPassword({ email, password });
        if (res.success) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setError(res.error ?? "Gagal masuk");
        }
      } else {
        const res = await signInWithOtp(email);
        if (res.success) {
          setMagicLinkSent(true);
        } else {
          setError(res.error ?? "Gagal mengirim link login");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    router.push("/dashboard");
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-xl space-y-6">
      {/* Title */}
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Selamat Datang Kembali
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Masuk ke akun Pintar Finance Anda untuk mengelola keuangan
        </p>
      </div>

      {/* Auth Method Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("password");
            setError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            authMethod === "password"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Kata Sandi</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMethod("magic_link");
            setError(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            authMethod === "magic_link"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Magic Link</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {magicLinkSent ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Link Login Terkirim!
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Kami telah mengirimkan tautan masuk ke <span className="font-semibold">{email}</span>. Silakan periksa kotak masuk atau spam email Anda.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {authMethod === "password" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{authMethod === "password" ? "Masuk ke Akun" : "Kirim Link Masuk"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
        <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider absolute">
          atau
        </span>
      </div>

      {/* Quick Demo Login Option */}
      <button
        type="button"
        onClick={handleDemoLogin}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all active:scale-[0.98]"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Jelajahi Sebagai Akun Demo</span>
      </button>

      {/* Register Link */}
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Belum memiliki akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Daftar Sekarang
        </Link>
      </p>
    </div>
  );
}
