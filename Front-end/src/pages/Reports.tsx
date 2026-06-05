import { useMemo } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useStockMovements } from "@/contexts/StockMovementContext";
import { useOrders } from "@/contexts/OrderContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Package, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const Reports = () => {
  const { products, isLoading: productsLoading } = useProducts();
  const { movements, isLoading: movementsLoading } = useStockMovements();
  const { orders, isLoading: ordersLoading } = useOrders();

  const isLoading = productsLoading || movementsLoading || ordersLoading;

  // 1. General Metrics
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.newPrice || p.new_price || 0) * (p.stockLevel || 0), 0);
  }, [products]);

  const totalStockItems = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stockLevel || 0), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => (p.stockLevel || 0) <= 5);
  }, [products]);

  // 2. Category Distribution Chart Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + (p.stockLevel || 0);
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  // 3. Stock Movement Logs Chart Data (aggregated by date)
  const movementHistoryData = useMemo(() => {
    const dailyLogs: Record<string, { date: string; incoming: number; outgoing: number }> = {};
    
    // Sort movements by date
    const sorted = [...movements].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    sorted.slice(-7).forEach(m => {
      const date = new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (!dailyLogs[date]) {
        dailyLogs[date] = { date, incoming: 0, outgoing: 0 };
      }
      if (m.type === "in") {
        dailyLogs[date].incoming += m.quantity;
      } else {
        dailyLogs[date].outgoing += m.quantity;
      }
    });

    return Object.values(dailyLogs);
  }, [movements]);

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border/60 shadow-sm bg-card">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="space-y-2 w-2/3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 border border-border/60 shadow-sm bg-card">
            <CardHeader className="p-3 pb-0">
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="h-48 p-3 flex items-center justify-center">
              <Skeleton className="h-32 w-32 rounded-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border border-border/60 shadow-sm bg-card">
            <CardHeader className="p-3 pb-0">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="h-48 p-3">
              <Skeleton className="h-full w-full" />
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 shadow-sm bg-card">
          <CardHeader className="p-3">
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h1 className="text-lg font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-2xs text-muted-foreground mt-0.5">Real-time stock valuation and inventory reports.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Inventory Value</span>
              <h3 className="text-sm font-bold text-foreground">RF {totalStockValue.toLocaleString()}</h3>
            </div>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <TrendingUp size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Stock Items</span>
              <h3 className="text-sm font-bold text-foreground">{totalStockItems.toLocaleString()}</h3>
            </div>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Package size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Low Stock Warning</span>
              <h3 className="text-sm font-bold text-foreground">{lowStockProducts.length} Products</h3>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${lowStockProducts.length > 0 ? "bg-warning/20 text-warning" : "bg-success/10 text-success"}`}>
              <AlertTriangle size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm bg-card">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Orders</span>
              <h3 className="text-sm font-bold text-foreground">{orders.length} Completed</h3>
            </div>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <TrendingUp size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Distribution Chart */}
        <Card className="lg:col-span-1 border border-border/60 shadow-sm bg-card">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">Category Stock Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-48 p-3 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No category data</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} units`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          {categoryData.length > 0 && (
            <div className="px-3 pb-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] justify-center">
              {categoryData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground font-semibold">{entry.name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stock Movement History Chart */}
        <Card className="lg:col-span-2 border border-border/60 shadow-sm bg-card">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent Movements Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-48 p-3">
            {movementHistoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">No movement logs recently</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementHistoryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground opacity-60 text-[9px]" />
                  <YAxis stroke="currentColor" className="text-muted-foreground opacity-60 text-[9px]" />
                  <Tooltip />
                  <Area type="monotone" dataKey="incoming" name="Stock In" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="outgoing" name="Stock Out" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card className="border border-border/60 shadow-sm bg-card">
        <CardHeader className="p-3">
          <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <AlertTriangle size={12} className="text-warning" />
            <span>Low Stock Alert Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/20">
                  {["PRODUCT", "BRAND", "CATEGORY", "STOCK LEVEL", "STATUS"].map((h) => (
                    <th key={h} className="text-left p-2 font-medium text-[10px] tracking-wider uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground italic bg-muted/5 text-xs">All stock items are adequately loaded.</td>
                  </tr>
                ) : (
                  lowStockProducts.map((p) => (
                    <tr key={p.id || (p as any)._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-2 font-bold text-foreground text-[10px] uppercase tracking-tighter">{p.name}</td>
                      <td className="p-2 text-muted-foreground text-[9px]">{p.brand}</td>
                      <td className="p-2 text-muted-foreground text-[9px]">{p.category}</td>
                      <td className="p-2 font-semibold text-foreground text-[10px]">{p.stockLevel} units</td>
                      <td className="p-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${p.stockLevel === 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                          {p.stockLevel === 0 ? "Out of Stock" : "Low"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
