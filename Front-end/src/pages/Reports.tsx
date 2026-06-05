import { useState, useMemo } from "react";
import { useStockMovements } from "@/contexts/StockMovementContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, ArrowUpRight, ArrowDownRight, Printer, Download, ListFilter, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const { stockInList, stockOutList, isLoading, stats } = useStockMovements();
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Helper: parse a date string to start-of-day or end-of-day timestamp
  const parseDate = (d: string, endOfDay = false) => {
    if (!d) return null;
    const date = new Date(d);
    if (endOfDay) { date.setHours(23, 59, 59, 999); }
    return date.getTime();
  };

  // 1. Build combined transaction ledger with date filtering
  const combinedLedger = useMemo(() => {
    const fromTs = parseDate(dateFrom);
    const toTs = parseDate(dateTo, true);
    const ledger: any[] = [];

    stockInList.forEach(item => {
      const itemTs = new Date(item.stockDate).getTime();
      if (fromTs && itemTs < fromTs) return;
      if (toTs && itemTs > toTs) return;

      ledger.push({
        id: `IN-${item.stock_id}`,
        itemName: item.ItemName,
        type: "in",
        quantity: item.quantityin,
        balance: item.totalquantityin,
        date: item.stockDate,
        operator: item.user_name || "System",
        detail: `Supplier: ${item.supplierName}`
      });
    });

    stockOutList.forEach(item => {
      const itemTs = new Date(item.stockoutDate).getTime();
      if (fromTs && itemTs < fromTs) return;
      if (toTs && itemTs > toTs) return;

      ledger.push({
        id: `OUT-${item.stock_id}`,
        itemName: item.ItemName || "Unknown Item",
        type: "out",
        quantity: item.quantityout,
        balance: item.totalquantityout,
        date: item.stockoutDate,
        operator: item.user_name || "System",
        detail: `Ref Batch: #${item.stock_id_fk}`
      });
    });

    // Sort by date descending
    return ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [stockInList, stockOutList, dateFrom, dateTo]);

  // Filter ledger by type
  const filteredLedger = useMemo(() => {
    if (filterType === "all") return combinedLedger;
    return combinedLedger.filter(item => item.type === filterType);
  }, [combinedLedger, filterType]);

  // 2. Generate chart data from filtered ledger
  const chartData = useMemo(() => {
    const dailyData: Record<string, { date: string; incoming: number; outgoing: number }> = {};

    // Determine range from filtered data or default last 7 days
    if (filteredLedger.length > 0) {
      // Group by date from filtered ledger
      filteredLedger.forEach(item => {
        const dateKey = item.date.split("T")[0];
        if (!dailyData[dateKey]) {
          const d = new Date(dateKey);
          dailyData[dateKey] = {
            date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            incoming: 0,
            outgoing: 0
          };
        }
        if (item.type === "in") {
          dailyData[dateKey].incoming += item.quantity;
        } else {
          dailyData[dateKey].outgoing += item.quantity;
        }
      });
    } else {
      // Fill last 7 days as default when no data
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const sqlDate = d.toISOString().split("T")[0];
        dailyData[sqlDate] = { date: dateString, incoming: 0, outgoing: 0 };
      }
    }

    // Sort entries by date ascending for the chart
    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredLedger]);

  // 3. Compute filtered KPIs
  const filteredStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    combinedLedger.forEach(item => {
      if (item.type === "in") totalIn += item.quantity;
      else totalOut += item.quantity;
    });
    return { totalIn, totalOut, netBalance: totalIn - totalOut };
  }, [combinedLedger]);

  // 4. Export to CSV
  const handleDownloadCSV = () => {
    const headers = ["Transaction ID", "Item Name", "Type", "Quantity", "Remaining Balance", "Operator", "Date", "Details"];
    const csvRows = [headers.join(",")];

    filteredLedger.forEach(row => {
      const values = [
        row.id,
        `"${row.itemName.replace(/"/g, '""')}"`,
        row.type.toUpperCase(),
        row.quantity,
        row.balance,
        row.operator,
        new Date(row.date).toLocaleDateString(),
        `"${row.detail.replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const rangeStr = dateFrom || dateTo
      ? `_${dateFrom || "start"}_to_${dateTo || "today"}`
      : "";
    link.setAttribute("download", `sms_stock_report${rangeStr}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 5. Print Report
  const handlePrint = () => {
    window.print();
  };

  // 6. Clear date filters
  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFilterType("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const hasActiveFilters = dateFrom || dateTo || filterType !== "all";

  return (
    <div className="space-y-6 pb-8 print:p-0 print:space-y-4">
      {/* Print-only header — visible only when printing */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-xl font-black text-black text-center">SMS — Stock Management System</h1>
        <h2 className="text-sm font-bold text-gray-700 text-center mt-1">Stock Ledger Report</h2>
        <p className="text-xs text-gray-500 text-center mt-1">
          Generated on {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          {dateFrom || dateTo ? ` | Period: ${dateFrom || "—"} to ${dateTo || "—"}` : " | All dates"}
          {filterType !== "all" ? ` | Filter: ${filterType === "in" ? "Stock In" : "Stock Out"} only` : ""}
        </p>
        <hr className="mt-3 border-gray-300" />
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Stock Ledger Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View, filter, download and print stock movement reports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            className="text-xs gap-1.5 h-8 font-bold border-border bg-card"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 h-8 font-bold bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Print Report
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card className="border border-border/80 shadow-sm bg-card print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Date Range
            </div>
            <div className="flex flex-wrap items-end gap-3 flex-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-xs bg-background border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-xs bg-background border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="text-xs bg-background border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="in">Stock In Only</option>
                  <option value="out">Stock Out Only</option>
                </select>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-semibold whitespace-nowrap">
              {filteredLedger.length} record{filteredLedger.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards — uses filtered totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-sm bg-card print:border print:bg-white print:text-black">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-black">
                {hasActiveFilters ? "Filtered" : "Total"} Stock In
              </span>
              <h3 className="text-lg font-black text-emerald-500 print:text-green-700">
                +{filteredStats.totalIn.toLocaleString()} units
              </h3>
            </div>
            <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 print:hidden">
              <ArrowUpRight size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card print:border print:bg-white print:text-black">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-black">
                {hasActiveFilters ? "Filtered" : "Total"} Stock Out
              </span>
              <h3 className="text-lg font-black text-red-500 print:text-red-700">
                -{filteredStats.totalOut.toLocaleString()} units
              </h3>
            </div>
            <div className="h-8 w-8 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 print:hidden">
              <ArrowDownRight size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card print:border print:bg-white print:text-black">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-black">
                {hasActiveFilters ? "Filtered" : "Net"} Balance
              </span>
              <h3 className="text-lg font-black text-primary print:text-blue-900">
                {filteredStats.netBalance.toLocaleString()} units
              </h3>
            </div>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary print:hidden">
              <FileText size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart — uses unique gradient IDs to avoid conflict with Dashboard */}
      <Card className="border border-border/80 shadow-sm bg-card print:border print:shadow-none">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            {hasActiveFilters ? "Filtered" : "7-Day"} Stock Movement Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="rptColorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="rptColorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" className="text-[10px] fill-muted-foreground font-semibold" />
              <YAxis className="text-[10px] fill-muted-foreground font-semibold" />
              <Tooltip
                contentStyle={{
                  fontSize: "11px",
                  borderRadius: "8px",
                  border: "1px solid hsl(0 0% 14%)",
                  backgroundColor: "hsl(0 0% 8%)",
                  color: "#fff"
                }}
              />
              <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 600 }} />
              <Area type="monotone" dataKey="incoming" name="Stock In (+)" stroke="#10b981" fillOpacity={1} fill="url(#rptColorIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="outgoing" name="Stock Out (-)" stroke="#ef4444" fillOpacity={1} fill="url(#rptColorOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border border-border/80 shadow-sm bg-card print:border print:shadow-none">
        <div className="flex items-center justify-between p-4 border-b border-border print:border-b">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            Transaction Ledger ({filteredLedger.length})
          </CardTitle>

          {/* Type filter inline — hidden on print */}
          <div className="flex items-center gap-2 print:hidden">
            <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-xs bg-card border border-border rounded-md px-2 py-1 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20 whitespace-nowrap print:bg-gray-100 print:text-black">
                <th className="text-left p-3 font-semibold uppercase">ID</th>
                <th className="text-left p-3 font-semibold uppercase">Item</th>
                <th className="text-left p-3 font-semibold uppercase">Type</th>
                <th className="text-left p-3 font-semibold uppercase">Qty</th>
                <th className="text-left p-3 font-semibold uppercase">Remaining</th>
                <th className="text-left p-3 font-semibold uppercase">Operator</th>
                <th className="text-left p-3 font-semibold uppercase">Date</th>
                <th className="text-left p-3 font-semibold uppercase">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length > 0 ? (
                filteredLedger.map((row, idx) => {
                  const isIn = row.type === "in";
                  return (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors print:hover:bg-transparent">
                      <td className="p-3 font-mono font-bold text-muted-foreground">{row.id}</td>
                      <td className="p-3 font-bold text-foreground">{row.itemName}</td>
                      <td className="p-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                          isIn ? "bg-emerald-500/15 text-emerald-500 print:text-green-700" : "bg-red-500/15 text-red-500 print:text-red-700"
                        }`}>
                          {isIn ? "Stock In" : "Stock Out"}
                        </span>
                      </td>
                      <td className="p-3 font-black text-foreground">{row.quantity}</td>
                      <td className="p-3 font-semibold text-foreground">{row.balance}</td>
                      <td className="p-3 text-muted-foreground">{row.operator}</td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-muted-foreground italic">{row.detail}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground italic text-xs">
                    No transactions match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Print-only summary footer */}
        <div className="hidden print:block p-4 border-t border-gray-300 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Total Records: {filteredLedger.length}</span>
            <span>In: +{filteredStats.totalIn} | Out: -{filteredStats.totalOut} | Net: {filteredStats.netBalance}</span>
          </div>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            SMS Stock Management System — Report generated on {new Date().toLocaleString()}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
