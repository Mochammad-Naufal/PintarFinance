"use client";

import { useSidebar } from "./SidebarContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

export function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150 relative">
      {/* Desktop Fixed Sidebar (h-screen fixed to viewport) */}
      <Sidebar />

      {/* Main content column with dynamic padding-left to compensate for fixed sidebar */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 min-h-screen max-w-full transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        <Header />

        {/* Page content */}
        <main className="flex-1 px-4 py-5 pb-28 sm:px-6 sm:py-6 sm:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
