import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { Header } from "@/components/shared/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150 overflow-x-hidden">
      {/* Desktop sidebar — sticky, full height */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen max-w-full overflow-x-hidden">
        <Header />

        {/* Page content — extra bottom padding on mobile for BottomNav */}
        <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-6 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — fixed, thumb-zone */}
      <BottomNav />
    </div>
  );
}
