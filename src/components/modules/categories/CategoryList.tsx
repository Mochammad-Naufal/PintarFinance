"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit2,
  Lock,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import {
  type ActionResult,
  type Category,
  type CategoryInput,
  type CategoryType,
} from "@/types/finance";
import { DynamicIcon } from "@/lib/icons";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/actions/categories";
import { CategoryModal } from "./CategoryModal";
import {
  addOfflineMutation,
  getOfflineData,
  saveOfflineData,
} from "@/lib/offline/db";

interface CategoryListProps {
  initialCategories: Category[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load from offline cache & sync on mount
  useEffect(() => {
    async function loadCache() {
      const cached = await getOfflineData<Category[]>("pf_categories");
      if (cached && cached.length > 0) {
        setCategories(cached);
      } else if (initialCategories.length > 0) {
        void saveOfflineData("pf_categories", initialCategories);
      }
    }
    void loadCache();
  }, [initialCategories]);

  // Filtered by tab and search
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchType = c.type === activeTab;
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchType && matchSearch;
    });
  }, [categories, activeTab, searchQuery]);

  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === "expense").length,
    [categories]
  );
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === "income").length,
    [categories]
  );

  const handleCreateOrUpdate = async (
    data: CategoryInput
  ): Promise<ActionResult<Category>> => {
    if (editingCategory) {
      // Optimistic update
      const updatedList = categories.map((c) =>
        c.id === editingCategory.id ? { ...c, ...data, is_synced: false } : c
      );
      setCategories(updatedList);
      void saveOfflineData("pf_categories", updatedList);

      try {
        const res = await updateCategory(editingCategory.id, data);
        if (res.success && res.data) {
          const syncedList = categories.map((c) =>
            c.id === editingCategory.id ? res.data! : c
          );
          setCategories(syncedList);
          void saveOfflineData("pf_categories", syncedList);
          return res;
        }
        return res;
      } catch {
        await addOfflineMutation({
          entity: "category" as any,
          action: "update",
          payload: { id: editingCategory.id, data },
        });
        return {
          success: true,
          data: {
            ...editingCategory,
            ...data,
            is_synced: false,
          },
        };
      }
    } else {
      // Creating
      try {
        const res = await createCategory(data);
        if (res.success && res.data) {
          const updated = [res.data, ...categories];
          setCategories(updated);
          void saveOfflineData("pf_categories", updated);
          return res;
        }
        return res;
      } catch {
        const tempCategory: Category = {
          id: `offline_cat_${Date.now()}`,
          user_id: "local_user",
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
          is_default: false,
          is_synced: false,
          transaction_count: 0,
          created_at: new Date().toISOString(),
        };
        const updated = [tempCategory, ...categories];
        setCategories(updated);
        void saveOfflineData("pf_categories", updated);
        await addOfflineMutation({
          entity: "category" as any,
          action: "create",
          payload: data,
        });
        return { success: true, data: tempCategory };
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteCategory(deletingCategory.id);
      if (res.success) {
        const updated = categories.filter((c) => c.id !== deletingCategory.id);
        setCategories(updated);
        void saveOfflineData("pf_categories", updated);
        setDeletingCategory(null);
      } else {
        setDeleteError(res.error ?? "Gagal menghapus kategori");
      }
    } catch {
      // Offline delete if custom
      const updated = categories.filter((c) => c.id !== deletingCategory.id);
      setCategories(updated);
      void saveOfflineData("pf_categories", updated);
      await addOfflineMutation({
        entity: "category" as any,
        action: "delete",
        payload: { id: deletingCategory.id },
      });
      setDeletingCategory(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Control Bar: Tab Switcher + Search + Add Button ─────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("expense")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "expense"
                ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <span>💸 Pengeluaran</span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-[10px]">
              {expenseCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("income")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "income"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            }`}
          >
            <span>💰 Pemasukan</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px]">
              {incomeCount}
            </span>
          </button>
        </div>

        {/* Search & Add CTA */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kategori</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* ─── Category Grid Cards ───────────────────────────────────────────── */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Tidak ada kategori ditemukan
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada kategori yang cocok dengan "${searchQuery}".`
              : "Buat kategori kustom pertama Anda untuk pos transaksi ini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCategories.map((cat) => {
            const isSystemDefault = cat.is_default || cat.user_id === null;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 shadow-xs flex items-center justify-between gap-3 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                {/* Icon + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {cat.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {isSystemDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Bawaan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span>Kustom</span>
                        </span>
                      )}

                      {cat.transaction_count !== undefined && cat.transaction_count > 0 && (
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {cat.transaction_count} transaksi
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Edit / Delete (for custom categories only) */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isSystemDefault ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingCategory(cat);
                        }}
                        className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div
                      className="p-1.5 text-zinc-300 dark:text-zinc-700"
                      title="Kategori bawaan dilindungi"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal: Create / Edit Category ─────────────────────────────────── */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleCreateOrUpdate}
        initialData={editingCategory}
        defaultType={activeTab}
      />

      {/* ─── Modal: Delete Safety Confirmation ─────────────────────────────── */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setDeletingCategory(null);
            }
          }}
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Hapus Kategori?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Konfirmasi penghapusan kategori kustom
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus kategori{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                &ldquo;{deletingCategory.name}&rdquo;
              </strong>
              ? Kategori yang sudah dihapus tidak dapat dipulihkan.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50 active:scale-95 transition-all shadow-xs"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Kategori"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
