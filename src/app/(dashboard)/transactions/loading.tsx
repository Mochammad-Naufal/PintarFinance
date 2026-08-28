export default function TransactionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-72 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-4 w-96 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      {/* AI Card */}
      <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
      {/* Tabs */}
      <div className="h-10 w-64 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
      {/* Table rows */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800/60" />
        ))}
      </div>
    </div>
  );
}
