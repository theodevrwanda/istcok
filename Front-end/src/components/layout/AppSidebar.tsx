import { LayoutDashboard, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { InstallPWA } from "../InstallPWA";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Stock In", url: "/stock-in", icon: ArrowUpRight },
  { title: "Stock Out", url: "/stock-out", icon: ArrowDownRight },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {navItems.map((item) => {
            const active = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <NavLink
                    to={item.url}
                    end
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 transition-colors text-sm relative ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    activeClassName=""
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span>{item.title}</span>
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
         <div className="flex flex-col gap-2">
            <InstallPWA iconOnly={collapsed} />
            {!collapsed && (
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center opacity-60">
                 SMS v1.0
              </p>
            )}
         </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
