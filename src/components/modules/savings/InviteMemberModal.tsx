"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Share2,
  Users,
  X,
} from "lucide-react";
import { type SavingsGoal } from "@/types/finance";
import { createSavingsInviteLink } from "@/actions/savings";
import { formatCurrency } from "@/lib/utils";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

function InviteMemberModalContent({
  onClose,
  goal,
}: {
  onClose: () => void;
  goal: SavingsGoal;
}) {
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      createSavingsInviteLink(goal.id)
        .then((res) => {
          if (isMounted) {
            if (res.success && res.data) {
              setInviteUrl(res.data.inviteUrl);
              setInviteCode(res.data.inviteCode);
            } else {
              setError(res.error ?? "Gagal membuat tautan undangan");
            }
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setError("Terjadi kesalahan teknis");
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [goal.id]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hai! Mari menabung bersama untuk target impian "${goal.name}" (Target: ${formatCurrency(
        goal.target_amount
      )}) di Pintar Finance. Klik tautan berikut untuk bergabung:\n${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[92dvh] overflow-hidden">
      {/* Mobile grab handle */}
      <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
              Undang Anggota Tabungan
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Tabungan Bersama: {goal.name}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Info Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Target Impian: {goal.name}
            </span>
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(goal.target_amount)}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Bagikan tautan atau kode ini ke pasangan, keluarga, atau rekan Anda. Setiap setoran yang dilakukan anggota akan otomatis tercatat dan mengakumulasi saldo tabungan bersama.
          </p>
        </div>

        {/* Invite Code & Link Box */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Tautan Undangan
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isCopied
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Options */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-[0.98] transition-all shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagi via WhatsApp</span>
              </button>
            </div>

            {/* Invite Code display */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Kode Undangan Manual:{" "}
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  {inviteCode}
                </span>
              </p>
              <p className="text-[10px] text-zinc-400 mt-1">
                Berlaku selama 7 hari sejak dibuat.
              </p>
            </div>
          </div>
        )}

        {/* Existing Members List */}
        {goal.members && goal.members.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
            <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>Anggota Saat Ini ({goal.members.length})</span>
            </h4>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 overflow-hidden">
              {goal.members.map((m) => (
                <div
                  key={m.id}
                  className="p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {m.user_name?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {m.user_name || m.user_email || "Anggota"}
                      </p>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {m.role === "owner" ? "Pemilik / Owner" : "Anggota"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-medium text-zinc-400 block">
                      Setoran
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(m.total_contributed || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end px-5 sm:px-6 py-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xs shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export function InviteMemberModal({
  isOpen,
  onClose,
  goal,
}: InviteMemberModalProps) {
  if (!isOpen || !goal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <InviteMemberModalContent
        key={goal.id}
        onClose={onClose}
        goal={goal}
      />
    </div>
  );
}
