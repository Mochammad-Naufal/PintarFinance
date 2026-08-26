import { Sidebar } from "@/components/shared/Sidebar";
import { BottomNav } from "@/components/shared/BottomNav";
import { Header } from "@/components/shared/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Desktop sidebar — sticky, full height */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <Header />

        {/* Page content — extra bottom padding on mobile for BottomNav */}
        <main className="flex-1 px-4 py-5 pb-24 lg:px-6 lg:py-6 lg:pb-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — fixed, thumb-zone */}
      <BottomNav />
    </div>
  );
}
