"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Lock, Mail, User } from "lucide-react";
import { signUp } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requiresEmailConfirm, setRequiresEmailConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signUp({ name, email, password });
      if (res.success && res.data) {
        setIsSuccess(true);
        setRequiresEmailConfirm(res.data.requiresEmailConfirm);

        if (!res.data.requiresEmailConfirm) {
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 1000);
        }
      } else {
        setError(res.error ?? "Gagal mendaftar");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan teknis saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-xl space-y-6">
      {/* Title */}
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Buat Akun Baru
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mulai atur pos keuangan pribadi dan wujudkan impian finansial Anda
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {isSuccess ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2.5">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {requiresEmailConfirm ? "Pendaftaran Berhasil!" : "Akun Siap Digunakan!"}
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            {requiresEmailConfirm ? (
              <>
                Kami telah mengirimkan email konfirmasi ke <span className="font-semibold">{email}</span>. Silakan klik tautan verifikasi di email untuk mengaktifkan akun Anda.
              </>
            ) : (
              "Mengalihkan ke dashboard keuangan Anda..."
            )}
          </p>
          {requiresEmailConfirm && (
            <Link
              href="/login"
              className="inline-block mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
            >
              Kembali ke Halaman Login
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                placeholder="Contoh: Naufal Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Daftar Akun Pintar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Login Link */}
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        Sudah memiliki akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Masuk di Sini
        </Link>
      </p>
    </div>
  );
}
