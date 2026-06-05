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
      bgClass: "bg-slate-950 text-white border-slate-900 shadow-xl shadow-slate-950/20",
      iconClass: "bg-white/10 border border-white/20 text-teal-400",
      labelClass: "text-slate-400",
      descClass: "text-slate-400",
      valueClass: "text-white"
    },
    { 
      label: "Total Items Received (Stock In)", 
      value: stats?.totalIn ?? 0, 
      icon: ArrowUpRight, 
      desc: "Cumulative incoming items", 
      bgClass: "bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-teal-500 shadow-xl shadow-teal-600/15",
      iconClass: "bg-white/15 border border-white/25 text-white",
      labelClass: "text-teal-100/90",
      descClass: "text-teal-100/70",
      valueClass: "text-white"
    },
    { 
      label: "Total Items Issued (Stock Out)", 
      value: stats?.totalOut ?? 0, 
      icon: ArrowDownRight, 
      desc: "Cumulative outgoing items", 
      bgClass: "bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-500 shadow-xl shadow-rose-600/15",
      iconClass: "bg-white/15 border border-white/25 text-white",
      labelClass: "text-rose-100/90",
      descClass: "text-rose-100/70",
      valueClass: "text-white"
    },
    { 
      label: "Registered Personnel", 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      desc: "System authorized staff", 
      bgClass: "bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-indigo-500 shadow-xl shadow-indigo-600/15",
      iconClass: "bg-white/15 border border-white/25 text-white",
      labelClass: "text-indigo-100/90",
      descClass: "text-indigo-100/70",
      valueClass: "text-white"
    },
  ];

  // Custom premium tooltip component for the weekly graph
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xl space-y-1.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.stroke || p.color }} />
              <span className="font-semibold text-slate-600">{p.name}:</span>
              <span className="font-black text-slate-800">{p.value} units</span>
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
      <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent border border-teal-500/20 rounded-2xl p-5 flex items-center justify-between shadow-sm animate-in fade-in duration-500">
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800">Welcome back, {user?.user_name}!</h2>
          <p className="text-xs text-slate-500 font-medium">You are currently monitoring the SMS Database.</p>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time status of items, entries, and system transactions.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`border rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.01] hover:shadow-2xl transition-all duration-300 ${s.bgClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest ${s.labelClass}`}>{s.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.iconClass}`}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-5 space-y-1">
              <div className={`text-3xl font-black ${s.valueClass}`}>{(s.value || 0).toLocaleString()}</div>
              <div className={`text-[10px] font-semibold ${s.descClass}`}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="p-5 pb-0">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Stock Movement Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.06} />
              <XAxis dataKey="date" className="text-[10px] fill-slate-400 font-bold" tickLine={false} axisLine={false} dy={8} />
              <YAxis className="text-[10px] fill-slate-400 font-bold" tickLine={false} axisLine={false} dx={-8} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
              <Area type="monotone" dataKey="incoming" name="Stock In (+)" stroke="#0d9488" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="outgoing" name="Stock Out (-)" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Ledger Log (Timeline Feed Layout) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Transactions Log</h2>
              <p className="text-[10px] text-slate-500 font-medium">Real-time ledger updates from the database.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live database synced</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {stats?.recentMovements && stats.recentMovements.length > 0 ? (
            stats.recentMovements.map((m: any, idx: number) => {
              const isIn = m.type === "in";
              return (
                <div 
                  key={idx} 
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 hover:translate-x-[2px] transition-all duration-300"
                >
                  {/* Left: Direction Icon & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIn 
                        ? "bg-emerald-50 border-emerald-100/80 text-emerald-600" 
                        : "bg-rose-50 border-rose-100/80 text-rose-600"
                    }`}>
                      {isIn ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm tracking-tight">{m.name}</span>
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{m.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[10px] font-medium">
                        <span>Recorded by <span className="font-semibold text-slate-700">{m.recorder || "System"}</span></span>
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
                  </div>

                  {/* Right: Type Badge & Quantity */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                    <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                      isIn 
                        ? "bg-emerald-100/60 text-emerald-700" 
                        : "bg-rose-100/60 text-rose-700"
                    }`}>
                      {isIn ? "Stock In" : "Stock Out"}
                    </span>
                    <div className="text-right min-w-[70px]">
                      <span className={`text-base font-black tracking-tight ${
                        isIn ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {isIn ? "+" : "-"}{m.quantity}
                      </span>
                      <span className="text-[9px] text-slate-400 block -mt-0.5 font-bold uppercase tracking-wider">units</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 italic text-xs font-semibold">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
