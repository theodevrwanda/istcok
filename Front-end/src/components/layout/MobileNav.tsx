import { LayoutDashboard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Stock In", icon: ArrowUpRight, path: "/stock-in" },
    { label: "Stock Out", icon: ArrowDownRight, path: "/stock-out" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-1 flex items-center justify-around z-50 md:hidden h-16 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-all ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "fill-primary/10" : ""}`} />
            <span className="text-[10px] font-semibold">{item.label}</span>
            {isActive && <div className="h-1 w-1 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
