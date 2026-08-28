export default function WalletsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-4 w-80 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
      {/* AI Card */}
      <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
      {/* Wallet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60" />
        ))}
      </div>
    </div>
  );
}
