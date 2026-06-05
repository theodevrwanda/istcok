import { LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onLogout?: () => void;
}

const Header = ({ onLogout }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.jpg" 
            alt="SMS Logo" 
            className="h-8 w-8 rounded-full border border-primary/20 shadow-sm object-cover" 
            onError={(e) => {
              (e.target as any).src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=200&auto=format&fit=crop";
            }}
          />
          <span className="font-bold text-sm text-foreground uppercase tracking-tight">
            SMS <span className="text-primary opacity-80">Dashboard</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xs text-muted-foreground mr-2 hidden sm:inline">
          Operator: <span className="font-bold text-foreground">{profile?.user_name}</span>
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-black p-0 shadow-sm border border-primary/20">
              {(profile?.user_name?.charAt(0) || "U").toUpperCase()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
};

export default Header;
