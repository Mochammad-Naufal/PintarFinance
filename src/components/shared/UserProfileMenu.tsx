"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LogOut,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/actions/auth";

interface UserProfile {
  name: string;
  email: string;
}

export function UserProfileMenu() {
  const [user, setUser] = useState<UserProfile>({
    name: "Pengguna",
    email: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setUser({
          name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "Pengguna",
          email: authUser.email || "",
        });
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "Pengguna",
          email: session.user.email || "",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const initial = user.name.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-2 sm:pl-2.5 ml-1 border-l border-zinc-200 dark:border-zinc-800 text-left transition-all active:scale-[0.98] cursor-pointer"
        aria-label="Menu Pengguna"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {initial}
          </span>
        </div>
        <div className="hidden md:block pr-1">
          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-none truncate max-w-[120px]">
            {user.name}
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Free Plan
          </p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
          {/* User Details */}
          <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {user.email}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md w-fit">
              <ShieldCheck className="w-3 h-3" />
              <span>Akun Terverifikasi</span>
            </div>
          </div>

          {/* Profile & Settings Link */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Profil &amp; Pengaturan Akun</span>
          </Link>

          {/* Sign Out */}
          <button
            type="button"
            onClick={async () => {
              setIsOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Sign Out)</span>
          </button>
        </div>
      )}
    </div>
  );
}
