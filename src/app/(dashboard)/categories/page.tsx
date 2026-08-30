import { getCategories } from "@/actions/categories";
import { CategoryList } from "@/components/modules/categories/CategoryList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Kategori | Pintar Finance",
  description:
    "Kelola taksonomi kategori pengeluaran dan pemasukan untuk pencatatan keuangan yang presisi.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Pengaturan Kategori Transaksi
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Standardisasi kategori bawaan dan kelola kategori kustom sesuai gaya hidup &amp; bisnis Anda.
        </p>
      </div>

      <CategoryList initialCategories={categories} />
    </div>
  );
}
