import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const DashboardLayout = ({ children, onLogout }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header onLogout={onLogout} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden pb-20 md:pb-6">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
