// ─── Dashboard Loading Skeleton ────────────────────────────────────────────────
// Next.js automatically shows this while the async page.tsx data-fetches.
// Uses pure CSS skeleton shimmer — no extra dependencies.

export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Net Worth Banner Skeleton */}
      <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />

      {/* AI Card Skeleton */}
      <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />

      {/* 3 Cashflow Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 h-52 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="lg:col-span-5 h-52 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
      </div>

      {/* 3 Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 space-y-3">
        <div className="h-4 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        ))}
      </div>
    </div>
  );
}
