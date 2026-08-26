import { SidebarProvider } from "@/components/shared/SidebarContext";
import { DashboardLayoutContent } from "@/components/shared/DashboardLayoutContent";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
