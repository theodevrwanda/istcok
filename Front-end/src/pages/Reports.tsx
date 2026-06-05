import { useState, useMemo, useEffect } from "react";
import { useStockMovements } from "@/contexts/StockMovementContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowUpRight, ArrowDownRight, Printer, Download, ListFilter, CalendarDays, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const { stockInList, stockOutList, isLoading, stats } = useStockMovements();
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

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

  // 2. Segmented Matrix Breakdown states and logic
  const [matrixView, setMatrixView] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const formatWeekRange = () => {
    const end = new Date(selectedWeekStart);
    end.setDate(selectedWeekStart.getDate() + 6);
    return `${selectedWeekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const colHeaders = useMemo(() => {
    if (matrixView === "weekly") {
      const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return weekdays.map((dayName, idx) => {
        const d = new Date(selectedWeekStart);
        d.setDate(selectedWeekStart.getDate() + idx);
        return {
          title: dayName,
          subtitle: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }),
          index: idx
        };
      });
    } else if (matrixView === "monthly") {
      const numDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      return Array.from({ length: numDays }).map((_, idx) => {
        return {
          title: `${idx + 1}`,
          subtitle: "",
          index: idx
        };
      });
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map((monthName, idx) => {
        return {
          title: monthName,
          subtitle: "",
          index: idx
        };
      });
    }
  }, [matrixView, selectedWeekStart, selectedMonth, selectedYear]);

  const matrixData = useMemo(() => {
    const itemsSet = new Set<string>();
    stockInList.forEach(item => itemsSet.add(item.ItemName));
    stockOutList.forEach(item => itemsSet.add(item.ItemName || "Unknown Item"));
    const itemsList = Array.from(itemsSet).sort();

    const map: Record<string, Record<number, { incoming: number; outgoing: number }>> = {};
    itemsList.forEach(item => {
      map[item] = {};
    });

    const isSameWeek = (d1: Date, d2Start: Date) => {
      const t1 = d1.getTime();
      const t2Start = d2Start.getTime();
      const t2End = t2Start + 7 * 24 * 60 * 60 * 1000;
      return t1 >= t2Start && t1 < t2End;
    };

    stockInList.forEach(item => {
      const date = new Date(item.stockDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const dom = date.getDate();

      let colIndex = -1;

      if (matrixView === "yearly") {
        if (year === selectedYear) {
          colIndex = month;
        }
      } else if (matrixView === "monthly") {
        if (year === selectedYear && month === selectedMonth) {
          colIndex = dom - 1;
        }
      } else if (matrixView === "weekly") {
        if (isSameWeek(date, selectedWeekStart)) {
          colIndex = (date.getDay() + 6) % 7;
        }
      }

      if (colIndex !== -1) {
        const row = map[item.ItemName];
        if (row) {
          if (!row[colIndex]) {
            row[colIndex] = { incoming: 0, outgoing: 0 };
          }
          row[colIndex].incoming += item.quantityin;
        }
      }
    });

    stockOutList.forEach(item => {
      const itemName = item.ItemName || "Unknown Item";
      const date = new Date(item.stockoutDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const dom = date.getDate();

      let colIndex = -1;

      if (matrixView === "yearly") {
        if (year === selectedYear) {
          colIndex = month;
        }
      } else if (matrixView === "monthly") {
        if (year === selectedYear && month === selectedMonth) {
          colIndex = dom - 1;
        }
      } else if (matrixView === "weekly") {
        if (isSameWeek(date, selectedWeekStart)) {
          colIndex = (date.getDay() + 6) % 7;
        }
      }

      if (colIndex !== -1) {
        const row = map[itemName];
        if (row) {
          if (!row[colIndex]) {
            row[colIndex] = { incoming: 0, outgoing: 0 };
          }
          row[colIndex].outgoing += item.quantityout;
        }
      }
    });

    return { itemsList, map };
  }, [stockInList, stockOutList, matrixView, selectedYear, selectedMonth, selectedWeekStart]);

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

      {/* Segmented Matrix Breakdown Card */}
      <Card className={isFullscreen ? "fixed inset-0 z-[100] bg-background border-none rounded-none p-6 flex flex-col overflow-hidden" : "border border-border/80 shadow-sm bg-card print:border print:shadow-none"}>
        <CardHeader className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border">
          <div className="space-y-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              Segmented Matrix Breakdown
            </CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Displaying details for {matrixView} view
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* View Selector buttons */}
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              {(["weekly", "monthly", "yearly"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMatrixView(v)}
                  className={`text-[10px] uppercase font-bold px-3 py-1 rounded-md transition-all duration-200 ${
                    matrixView === v
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Navigation buttons/inputs */}
            <div className="flex flex-wrap items-center gap-2">
              {matrixView === "weekly" && (
                <div className="flex items-center gap-1.5 bg-muted/20 border border-border rounded-lg p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-7 w-7"
                    onClick={() => {
                      const prev = new Date(selectedWeekStart);
                      prev.setDate(selectedWeekStart.getDate() - 7);
                      setSelectedWeekStart(prev);
                    }}
                  >
                    &larr;
                  </Button>
                  <span className="text-[10px] font-bold px-1 whitespace-nowrap text-muted-foreground">
                    {formatWeekRange()}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-7 w-7"
                    onClick={() => {
                      const next = new Date(selectedWeekStart);
                      next.setDate(selectedWeekStart.getDate() + 7);
                      setSelectedWeekStart(next);
                    }}
                  >
                    &rarr;
                  </Button>
                </div>
              )}

              {matrixView === "monthly" && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="text-[11px] font-semibold bg-background border border-border rounded-md px-2 py-1 focus:outline-none"
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="text-[11px] font-semibold bg-background border border-border rounded-md px-2 py-1 focus:outline-none"
                  >
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const y = new Date().getFullYear() - 3 + idx;
                      return <option key={idx} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              )}

              {matrixView === "yearly" && (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="text-[11px] font-semibold bg-background border border-border rounded-md px-2 py-1 focus:outline-none"
                  >
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const y = new Date().getFullYear() - 3 + idx;
                      return <option key={idx} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Fullscreen Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              type="button"
              className="h-8 w-8 text-muted-foreground hover:text-foreground border-border bg-card"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={isFullscreen ? "p-0 flex-1 overflow-hidden flex flex-col mt-4" : "p-0"}>
          <div className={isFullscreen ? "overflow-auto w-full flex-1" : "overflow-x-auto md:overflow-x-visible w-full"}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground whitespace-nowrap">
                  {/* Sticky ITEM Column Header */}
                  <th className="sticky left-0 top-0 bg-background/95 backdrop-blur z-30 border-b border-r border-border font-bold p-3 text-left uppercase tracking-wider text-[10px] min-w-[150px] max-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    ITEM
                  </th>
                  {colHeaders.map((header) => (
                    <th key={header.index} className="sticky top-0 bg-background/95 backdrop-blur z-20 p-3 border-b border-r border-border text-center font-bold text-[10px] min-w-[85px] last:border-r-0">
                      <div>{header.title}</div>
                      {header.subtitle && (
                        <div className="text-[8px] font-medium text-muted-foreground mt-0.5">{header.subtitle}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.itemsList.length === 0 ? (
                  <tr>
                    <td colSpan={colHeaders.length + 1} className="p-8 text-center text-muted-foreground italic text-xs">
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  matrixData.itemsList.map((item, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
                      {/* Sticky ITEM Cell */}
                      <td className="sticky left-0 bg-background/95 backdrop-blur z-10 border-r border-border font-bold p-3 text-foreground shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[150px] max-w-[200px] truncate">
                        {item}
                      </td>
                      {colHeaders.map((header) => {
                        const cell = matrixData.map[item][header.index];
                        if (!cell || (cell.incoming === 0 && cell.outgoing === 0)) {
                          return (
                            <td key={header.index} className="p-3 text-center border-r border-border text-muted-foreground/30 font-semibold last:border-r-0 select-none">
                              -
                            </td>
                          );
                        }

                        let cellStyle = "";
                        let primaryText = "";
                        let secondaryText = "";

                        if (cell.incoming > 0 && cell.outgoing === 0) {
                          cellStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/30 dark:hover:bg-emerald-950/30";
                          primaryText = `+${cell.incoming.toLocaleString()}`;
                          secondaryText = "INCOMING";
                        } else if (cell.outgoing > 0 && cell.incoming === 0) {
                          cellStyle = "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-800/30 dark:hover:bg-rose-950/30";
                          primaryText = `-${cell.outgoing.toLocaleString()}`;
                          secondaryText = "OUTGOING";
                        } else {
                          cellStyle = "bg-indigo-50 text-indigo-700 border border-indigo-150 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-800/30 dark:hover:bg-indigo-950/30";
                          const balance = cell.incoming - cell.outgoing;
                          primaryText = balance >= 0 ? `+${balance.toLocaleString()}` : `${balance.toLocaleString()}`;
                          secondaryText = `${cell.incoming} IN / ${cell.outgoing} OUT`;
                        }

                        return (
                          <td key={header.index} className="p-1.5 border-r border-border text-center align-middle last:border-r-0">
                            <div className={`p-1.5 rounded-lg flex flex-col items-center justify-center text-center min-w-[75px] h-[44px] transition-all duration-200 ${cellStyle}`}>
                              <span className="font-extrabold text-[10px] leading-none tracking-tight">{primaryText}</span>
                              <span className="text-[7.5px] font-bold tracking-wider leading-none mt-1 opacity-85">{secondaryText}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

        <div className="overflow-x-auto md:overflow-x-visible w-full">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20 whitespace-nowrap print:bg-gray-100 print:text-black">
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">ID</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Item</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Type</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Qty</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Remaining</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Operator</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Date</th>
                <th className="sticky top-0 bg-card/95 backdrop-blur z-10 text-left p-3 font-semibold uppercase border-b border-border">Details</th>
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
