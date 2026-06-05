import { useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck } from "lucide-react";
import { useStockMovements } from "@/contexts/StockMovementContext";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { stockInList, stockOutList, stats, isLoading, refreshData } = useStockMovements();
  const { user } = useAuth();

  useEffect(() => {
    refreshData();
  }, []);

  // Generate 7-day trend data from local lists
  const chartData = useMemo(() => {
    const dailyData: Record<string, { date: string; incoming: number; outgoing: number }> = {};
    
    // Fill last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const sqlDate = d.toISOString().split("T")[0];
      
      dailyData[sqlDate] = {
        date: dateString,
        incoming: 0,
        outgoing: 0
      };
    }

    // Sum Stock In
    stockInList.forEach(item => {
      const dateKey = item.stockDate.split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].incoming += item.quantityin;
      }
    });

    // Sum Stock Out
    stockOutList.forEach(item => {
      const dateKey = item.stockoutDate.split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].outgoing += item.quantityout;
      }
    });

    return Object.values(dailyData);
  }, [stockInList, stockOutList]);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-6 w-48 animate-pulse bg-muted" />
          <Skeleton className="h-4 w-72 mt-2 animate-pulse bg-muted" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-5 space-y-3">
              <Skeleton className="h-5 w-5 rounded-full bg-muted" />
              <Skeleton className="h-8 w-16 bg-muted" />
              <Skeleton className="h-4 w-24 bg-muted" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg bg-muted animate-pulse" />
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <Skeleton className="h-5 w-32 bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      label: "Current Stock Balance", 
      value: stats?.currentBalance ?? 0, 
      icon: Package, 
      desc: "Net units currently in stock", 
      color: "text-primary bg-primary/10 border-primary/20" 
    },
    { 
      label: "Total Items Received (Stock In)", 
      value: stats?.totalIn ?? 0, 
      icon: ArrowUpRight, 
      desc: "Cumulative incoming items", 
      color: "text-success bg-success/10 border-success/20" 
    },
    { 
      label: "Total Items Issued (Stock Out)", 
      value: stats?.totalOut ?? 0, 
      icon: ArrowDownRight, 
      desc: "Cumulative outgoing items", 
      color: "text-destructive bg-destructive/10 border-destructive/20" 
    },
    { 
      label: "Registered Personnel", 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      desc: "System authorized staff", 
      color: "text-info bg-info/10 border-info/20" 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 flex items-center justify-between shadow-sm animate-in fade-in duration-500">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-foreground">Welcome back, {user?.user_name}!</h2>
          <p className="text-xs text-muted-foreground">You are currently monitoring the SMS Database.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-emerald-500 shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          Connection Secured
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-xs text-muted-foreground mt-1">Real-time status of items, entries, and system transactions.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-3xl font-black text-foreground">{(s.value || 0).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Weekly Stock Movement Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <XAxis dataKey="date" className="text-[10px] fill-muted-foreground font-semibold" />
              <YAxis className="text-[10px] fill-muted-foreground font-semibold" />
              <Tooltip />
              <Area type="monotone" dataKey="incoming" name="Stock In (+)" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="outgoing" name="Stock Out (-)" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Ledger Log */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent Transactions Log</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-bold text-success uppercase tracking-wider">Live database synced</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20 whitespace-nowrap">
                <th className="text-left p-3 font-semibold uppercase">ID</th>
                <th className="text-left p-3 font-semibold uppercase">ITEM / PRODUCT</th>
                <th className="text-left p-3 font-semibold uppercase">TYPE</th>
                <th className="text-left p-3 font-semibold uppercase">QTY</th>
                <th className="text-left p-3 font-semibold uppercase">RECORDER</th>
                <th className="text-left p-3 font-semibold uppercase">DATE</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentMovements && stats.recentMovements.length > 0 ? (
                stats.recentMovements.map((m: any, idx: number) => {
                  const isIn = m.type === "in";
                  return (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-muted-foreground font-mono">#{m.id}</td>
                      <td className="p-3 font-semibold text-foreground">{m.name}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                          isIn ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                        }`}>
                          {isIn ? "Stock In (+)" : "Stock Out (-)"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-foreground">{m.quantity}</td>
                      <td className="p-3 text-muted-foreground">{m.recorder || "System"}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(m.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic text-xs">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
