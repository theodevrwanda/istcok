import { useState, useMemo } from "react";
import { useStockMovements } from "@/contexts/StockMovementContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, ArrowUpRight, ArrowDownRight, Printer, Download, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const { stockInList, stockOutList, isLoading, stats } = useStockMovements();
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

  // 1. Generate daily trend data for the last 7 days
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

  // 2. Generate a combined transaction ledger list
  const combinedLedger = useMemo(() => {
    const ledger: any[] = [];
    
    stockInList.forEach(item => {
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
  }, [stockInList, stockOutList]);

  // Filter ledger list
  const filteredLedger = useMemo(() => {
    if (filterType === "all") return combinedLedger;
    return combinedLedger.filter(item => item.type === filterType);
  }, [combinedLedger, filterType]);

  // 3. Export to CSV Function
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

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sms_stock_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Print Report
  const handlePrint = () => {
    window.print();
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

  return (
    <div className="space-y-6 pb-8 print:p-0 print:space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:border-b print:pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary print:hidden" />
            Stock Ledger Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated on {new Date().toLocaleDateString()} by operator.
          </p>
        </div>
        
        {/* Actions - hidden on printing */}
        <div className="flex items-center gap-2 print:hidden">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-sm bg-card print:border print:bg-white print:text-black">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-black">Total Stock In</span>
              <h3 className="text-lg font-black text-success print:text-green-700">
                +{(stats?.totalIn ?? 0).toLocaleString()} units
              </h3>
            </div>
            <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center text-success print:hidden">
              <ArrowUpRight size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card print:border print:bg-white print:text-black">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-black">Total Stock Out</span>
              <h3 className="text-lg font-black text-destructive print:text-red-700">
                -{(stats?.totalOut ?? 0).toLocaleString()} units
              </h3>
            </div>
            <div className="h-8 w-8 bg-destructive/10 rounded-full flex items-center justify-center text-destructive print:hidden">
              <ArrowDownRight size={16} />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-sm bg-card print:border print:bg-white print:text-black">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground print:text-black">Net Stock Balance</span>
              <h3 className="text-lg font-black text-primary print:text-blue-900">
                {(stats?.currentBalance ?? 0).toLocaleString()} units
              </h3>
            </div>
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary print:hidden">
              <FileText size={16} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts graph - hidden on simple printing or styled appropriately */}
      <Card className="border border-border/80 shadow-sm bg-card print:border print:shadow-none">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">7-Day Stock Movement Trend</CardTitle>
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

      {/* Ledger Table */}
      <Card className="border border-border/80 shadow-sm bg-card print:border print:shadow-none">
        <div className="flex items-center justify-between p-4 border-b border-border print:border-b">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Historical Ledger Details</CardTitle>
          
          {/* Filters - hidden on printing */}
          <div className="flex items-center gap-2 print:hidden">
            <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
              className="text-2xs bg-card border border-border rounded-md px-2 py-1 focus:outline-none"
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
              <tr className="border-b border-border text-muted-foreground bg-muted/20 whitespace-nowrap">
                <th className="text-left p-3 font-semibold uppercase">ID</th>
                <th className="text-left p-3 font-semibold uppercase">ITEM</th>
                <th className="text-left p-3 font-semibold uppercase">TYPE</th>
                <th className="text-left p-3 font-semibold uppercase">QTY</th>
                <th className="text-left p-3 font-semibold uppercase">REMAINING</th>
                <th className="text-left p-3 font-semibold uppercase">OPERATOR</th>
                <th className="text-left p-3 font-semibold uppercase">DATE</th>
                <th className="text-left p-3 font-semibold uppercase">DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length > 0 ? (
                filteredLedger.map((row, idx) => {
                  const isIn = row.type === "in";
                  return (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-muted-foreground">{row.id}</td>
                      <td className="p-3 font-bold text-foreground">{row.itemName}</td>
                      <td className="p-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                          isIn ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
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
                    No transactions match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
