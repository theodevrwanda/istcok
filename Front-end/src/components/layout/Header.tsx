import { useState, useRef, useEffect, useMemo } from "react";
import { LogOut, Sun, Moon, Search, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useStockMovements } from "@/contexts/StockMovementContext";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  onLogout?: () => void;
}

const Header = ({ onLogout }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const { stockInList, stockOutList } = useStockMovements();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter lists based on searchQuery
  const results = useMemo(() => {
    if (!searchQuery.trim()) return { inResults: [], outResults: [] };
    const q = searchQuery.toLowerCase();
    
    const inResults = stockInList.filter(item => 
      (item.ItemName && item.ItemName.toLowerCase().includes(q)) || 
      (item.Description && item.Description.toLowerCase().includes(q)) || 
      (item.supplierName && item.supplierName.toLowerCase().includes(q)) || 
      item.stock_id.toString().includes(q)
    ).slice(0, 5);

    const outResults = stockOutList.filter(item => 
      (item.ItemName && item.ItemName.toLowerCase().includes(q)) || 
      (item.Description && item.Description.toLowerCase().includes(q)) || 
      item.stock_id.toString().includes(q)
    ).slice(0, 5);

    return { inResults, outResults };
  }, [searchQuery, stockInList, stockOutList]);

  return (
    <>
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 sticky top-0 z-50">
        {/* Left Section: Logo & Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:inline-flex" />
          <div className="flex items-center gap-2">
            <img 
              src="/sms-logo.png" 
              alt="SMS Logo" 
              className="h-8 w-8 rounded-lg border border-border shadow-sm object-cover" 
            />
            <span className="font-bold text-sm text-foreground uppercase tracking-tight hidden xs:inline">
              SMS <span className="text-primary opacity-80">Dashboard</span>
            </span>
          </div>
        </div>

        {/* Middle Section: Global Search Input */}
        <div ref={containerRef} className="relative flex-1 max-w-sm sm:max-w-md mx-4 sm:mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsFocused(true);
              }}
              onFocus={() => setIsFocused(true)}
              placeholder="Search items, suppliers, batch IDs..."
              className="w-full h-9 pl-9 pr-8 bg-muted/40 hover:bg-muted/65 focus:bg-background text-xs font-semibold text-foreground rounded-xl border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all duration-300"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isFocused && searchQuery && (
            <div className="absolute top-10 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-2xl max-h-[350px] overflow-y-auto p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {results.inResults.length === 0 && results.outResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground italic font-semibold">
                  No matching inventory records found.
                </div>
              ) : (
                <>
                  {/* Stock In Results */}
                  {results.inResults.length > 0 && (
                    <div>
                      <div className="px-2 py-0.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Stock In Entries
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {results.inResults.map((r) => (
                          <button
                            key={`in-${r.stock_id}`}
                            onClick={() => {
                              setSelectedRecord({ ...r, type: "in" });
                              setIsFocused(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-muted flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                                <ArrowUpRight className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground leading-tight">{r.ItemName}</p>
                                <p className="text-[9px] text-muted-foreground font-medium">Batch #{r.stock_id} · {r.supplierName}</p>
                              </div>
                            </div>
                            <span className="text-2xs font-extrabold text-foreground bg-muted px-2 py-0.5 rounded">
                              +{r.quantityin} qty
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Out Results */}
                  {results.outResults.length > 0 && (
                    <div>
                      <div className="px-2 py-0.5 text-[9px] font-black text-muted-foreground uppercase tracking-widest border-t border-border pt-1.5 mt-1.5">
                        Stock Out Entries
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {results.outResults.map((r) => (
                          <button
                            key={`out-${r.stock_id}`}
                            onClick={() => {
                              setSelectedRecord({ ...r, type: "out" });
                              setIsFocused(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-muted flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                                <ArrowDownRight className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground leading-tight">{r.ItemName || "N/A"}</p>
                                <p className="text-[9px] text-muted-foreground font-medium">Out ID #{r.stock_id} · Batch ref: #{r.stock_id_fk}</p>
                              </div>
                            </div>
                            <span className="text-2xs font-extrabold text-foreground bg-muted px-2 py-0.5 rounded">
                              -{r.quantityout} qty
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-black p-0 shadow-sm border border-primary/20 hover:scale-105 transition-transform duration-200">
                {(profile?.user_name?.charAt(0) || "U").toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <div className="px-2.5 py-1.5 border-b border-border mb-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active User</p>
                <p className="text-xs font-extrabold text-foreground truncate">{profile?.user_name}</p>
              </div>
              <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive cursor-pointer rounded-lg">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground rounded-xl hover:bg-muted/80">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Record Details Modal overlay */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  selectedRecord.type === "in" 
                    ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-600" 
                    : "bg-destructive/15 border-destructive/25 text-destructive"
                }`}>
                  {selectedRecord.type === "in" ? <ArrowUpRight className="h-4.5 w-4.5" /> : <ArrowDownRight className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-xs uppercase tracking-wider">
                    {selectedRecord.type === "in" ? "Stock In Record" : "Stock Out Record"}
                  </h3>
                  <p className="text-[10px] text-muted-foreground font-mono">ID: #{selectedRecord.stock_id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-4 text-xs text-muted-foreground">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <div className="col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Item Name</span>
                  <span className="font-extrabold text-foreground text-sm block mt-0.5">{selectedRecord.ItemName || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Description</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedRecord.Description || "No description provided."}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">
                    {selectedRecord.type === "in" ? "Quantity In" : "Quantity Out"}
                  </span>
                  <span className="font-black text-foreground text-sm block mt-0.5">
                    {selectedRecord.type === "in" ? selectedRecord.quantityin : selectedRecord.quantityout} units
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">
                    {selectedRecord.type === "in" ? "Available Batch Balance" : "Remaining Batch Balance"}
                  </span>
                  <span className="font-black text-foreground text-sm block mt-0.5">
                    {selectedRecord.type === "in" ? selectedRecord.totalquantityin : selectedRecord.totalquantityout} units
                  </span>
                </div>
                {selectedRecord.type === "in" && (
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Supplier</span>
                    <span className="font-bold text-foreground block mt-0.5">{selectedRecord.supplierName || "N/A"}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Recorder</span>
                  <span className="font-bold text-foreground block mt-0.5">{selectedRecord.user_name || "System Operator"}</span>
                </div>
                <div className="col-span-2 border-t border-border pt-3 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block">Timestamp</span>
                  <span className="font-bold text-foreground block mt-0.5">
                    {new Date(selectedRecord.type === "in" ? selectedRecord.stockDate : selectedRecord.stockoutDate).toLocaleString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-bold text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
