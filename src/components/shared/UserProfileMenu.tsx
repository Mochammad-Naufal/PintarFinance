"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LogOut,
  MessageSquare,
  ShieldCheck,
  Tag,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/actions/auth";
import { getUserProfile } from "@/actions/profile";
import { FeedbackModal } from "../modules/feedback/FeedbackModal";

interface UserProfileState {
  name: string;
  email: string;
  avatar_url?: string | null;
}

export function UserProfileMenu() {
  const [user, setUser] = useState<UserProfileState>({
    name: "Pengguna",
    email: "",
    avatar_url: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      // 1. Check Supabase Auth
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // 2. Fetch full DB profile (including avatar_url)
        try {
          const profile = await getUserProfile();
          setUser({
            name: profile.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || "Pengguna",
            email: profile.email || authUser.email || "",
            avatar_url: profile.avatar_url || null,
          });
        } catch {
          setUser({
            name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email?.split("@")[0] ||
              "Pengguna",
            email: authUser.email || "",
            avatar_url: null,
          });
        }
      }
    };

    void fetchUser();

    // Listen to Supabase Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser((prev) => ({
          ...prev,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            prev.name,
          email: session.user.email || prev.email,
        }));
      }
    });

    // 3. Reactive window custom event listener for instant 0-delay avatar sync
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{
        name?: string;
        email?: string;
        avatar_url?: string | null;
      }>;
      if (customEvent.detail) {
        setUser((prev) => ({
          ...prev,
          name: customEvent.detail.name || prev.name,
          avatar_url:
            customEvent.detail.avatar_url !== undefined
              ? customEvent.detail.avatar_url
              : prev.avatar_url,
        }));
      }
    };

    window.addEventListener("user-profile-updated", handleProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("user-profile-updated", handleProfileUpdated);
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
    <>
      <div className="relative" ref={menuRef}>
        {/* Profile Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 pl-2 sm:pl-2.5 ml-1 border-l border-zinc-200 dark:border-zinc-800 text-left transition-all active:scale-[0.98] cursor-pointer"
          aria-label="Menu Pengguna"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.name}
                width={32}
                height={32}
                unoptimized
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {initial}
              </span>
            )}
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
            <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded w-fit">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Profile & Settings Link */}
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Profil &amp; Data Diri</span>
            </Link>

            {/* Categories Link */}
            <Link
              href="/categories"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Manajemen Kategori</span>
            </Link>

            {/* Feedback Link */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsFeedbackOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Kirim Masukan (Feedback)</span>
            </button>

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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
