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
      borderClass: "border-l-4 border-l-slate-900 dark:border-l-slate-100",
      color: "text-foreground bg-muted/60 border-border" 
    },
    { 
      label: "Total Items Received (Stock In)", 
      value: stats?.totalIn ?? 0, 
      icon: ArrowUpRight, 
      desc: "Cumulative incoming items", 
      borderClass: "border-l-4 border-l-slate-600 dark:border-l-slate-400",
      color: "text-foreground bg-muted/60 border-border" 
    },
    { 
      label: "Total Items Issued (Stock Out)", 
      value: stats?.totalOut ?? 0, 
      icon: ArrowDownRight, 
      desc: "Cumulative outgoing items", 
      borderClass: "border-l-4 border-l-slate-400 dark:border-l-slate-600",
      color: "text-foreground bg-muted/60 border-border" 
    },
    { 
      label: "Registered Personnel", 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      desc: "System authorized staff", 
      borderClass: "border-l-4 border-l-slate-300 dark:border-l-slate-700",
      color: "text-foreground bg-muted/60 border-border" 
    },
  ];

  // Custom premium tooltip component for the weekly graph
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl space-y-1.5 backdrop-blur-md">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.stroke || p.color }} />
              <span className="font-semibold text-foreground">{p.name}:</span>
              <span className="font-black text-foreground">{p.value} units</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-muted/30 border border-border/80 rounded-2xl p-6 shadow-sm animate-in fade-in duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Welcome back, <span className="text-primary font-black underline underline-offset-4 decoration-border/60">{user?.user_name}</span>!
            </h2>
            <p className="text-xs text-muted-foreground font-semibold">
              You are currently monitoring the active inventory database. Everything is synced.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/5 border border-border/80">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
            <span className="text-[9px] font-black text-foreground uppercase tracking-widest">
              Live Synced
            </span>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Real-time status of items, entries, and system transactions.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`bg-card border-t border-r border-b border-border ${s.borderClass} rounded-r-2xl rounded-l-md p-5 flex flex-col justify-between hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden group`}>
            {/* Soft background glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-foreground/5 group-hover:bg-foreground/10 rounded-full blur-xl transition-all duration-300" />
            
            <div className="flex items-start justify-between relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85">{s.label}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${s.color} shrink-0`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-5 space-y-1.5 relative z-10">
              <div className="text-2xl font-black tracking-tight text-foreground">{(s.value || 0).toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="border border-border/80 shadow-sm bg-card rounded-2xl overflow-hidden">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weekly Stock Movement Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4b5563" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4b5563" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.06} />
              <XAxis dataKey="date" className="text-[10px] fill-muted-foreground font-bold" tickLine={false} axisLine={false} dy={8} />
              <YAxis className="text-[10px] fill-muted-foreground font-bold" tickLine={false} axisLine={false} dx={-8} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0, 0, 0, 0.08)", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="incoming" name="Stock In (+)" stroke="#4b5563" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="outgoing" name="Stock Out (-)" stroke="#9ca3af" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Ledger Log (Timeline Feed Layout) */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-foreground shadow-sm">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Recent Transactions Log</h2>
              <p className="text-[10px] text-muted-foreground font-semibold">Real-time ledger updates from database.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse" />
            <span className="text-[9px] font-black text-foreground uppercase tracking-widest">Live Sync</span>
          </div>
        </div>

        <div className="p-6 relative">
          {/* Vertical connecting line */}
          {stats?.recentMovements && stats.recentMovements.length > 1 && (
            <div className="absolute left-[28px] top-[40px] bottom-[40px] w-0.5 bg-gradient-to-b from-foreground/20 via-foreground/10 to-transparent" />
          )}

          <div className="space-y-6">
            {stats?.recentMovements && stats.recentMovements.length > 0 ? (
              stats.recentMovements.map((m: any, idx: number) => {
                const isIn = m.type === "in";
                return (
                  <div 
                    key={idx} 
                    className="flex items-start gap-4 relative group"
                  >
                    {/* Circle wrapper with icon */}
                    <div className={`w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0 border z-10 transition-all duration-300 group-hover:scale-110 shadow-sm ${
                      isIn 
                        ? "bg-muted border-border text-foreground" 
                        : "bg-muted border-border text-muted-foreground"
                    }`}>
                      {isIn ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    </div>

                    {/* Transaction Details Content */}
                    <div className="flex-1 min-w-0 bg-muted/10 dark:bg-muted/5 border border-border/40 hover:border-foreground/20 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300 hover:shadow-md hover:bg-muted/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground text-xs uppercase tracking-tight">{m.name}</span>
                          <span className="text-[9px] font-mono font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded-full border border-border/50">
                            #{m.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground text-[10px] font-semibold">
                          <span>By <span className="font-extrabold text-foreground">{m.recorder || "System"}</span></span>
                          <span>•</span>
                          <span>
                            {new Date(m.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Type */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0 border-border/40 shrink-0">
                        <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest bg-muted border border-border/60 text-foreground">
                          {isIn ? "Stock In" : "Stock Out"}
                        </span>
                        <div className="text-right min-w-[70px]">
                          <span className="text-base font-black tracking-tight text-foreground">
                            {isIn ? "+" : "-"}{m.quantity}
                          </span>
                          <span className="text-[9px] text-muted-foreground block -mt-1 font-bold uppercase tracking-widest">units</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground italic text-xs font-semibold">
                No transactions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
