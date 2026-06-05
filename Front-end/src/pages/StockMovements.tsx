import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Loader2, ArrowUpRight, ArrowDownRight, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStockMovements, StockInRecord } from "@/contexts/StockMovementContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StockMovements = ({ mode }: { mode: "in" | "out" }) => {
  const { 
    stockInList, 
    stockOutList, 
    isLoading, 
    addStockIn, 
    addStockOut,
    updateStockIn,
    deleteStockIn,
    updateStockOut,
    deleteStockOut
  } = useStockMovements();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    ItemName: "",
    Description: "",
    quantityin: 1,
    supplierName: "",
    stockDate: new Date().toISOString().split("T")[0],
  });

  const [stockOutForm, setStockOutForm] = useState({
    stock_id_fk: "",
    quantityout: 1,
    stockoutDate: new Date().toISOString().split("T")[0],
  });

  // Edit states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editInForm, setEditInForm] = useState({
    ItemName: "",
    Description: "",
    quantityin: 1,
    supplierName: "",
    stockDate: "",
  });

  // View movement detail state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!editingItem || mode !== "in") return;

    setSubmitting(true);
    try {
      if (!editInForm.ItemName.trim() || !editInForm.supplierName.trim() || !editInForm.stockDate) {
        setErrorMsg("Please fill in all required fields.");
        setSubmitting(false);
        return;
      }
      await updateStockIn(editingItem.stock_id, {
        ItemName: editInForm.ItemName.trim(),
        Description: editInForm.Description.trim(),
        quantityin: Number(editInForm.quantityin),
        supplierName: editInForm.supplierName.trim(),
        stockDate: editInForm.stockDate,
      });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while updating.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    setIsDeleting(true);
    try {
      if (mode === "in") {
        await deleteStockIn(deleteConfirmId);
      } else {
        await deleteStockOut(deleteConfirmId);
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!stockInForm.ItemName.trim() || !stockInForm.supplierName.trim() || !stockInForm.stockDate) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    
    setSubmitting(true);
    try {
      await addStockIn({
        ItemName: stockInForm.ItemName.trim(),
        Description: stockInForm.Description.trim(),
        quantityin: Number(stockInForm.quantityin),
        supplierName: stockInForm.supplierName.trim(),
        stockDate: stockInForm.stockDate,
      });
      setIsDialogOpen(false);
      setStockInForm({
        ItemName: "",
        Description: "",
        quantityin: 1,
        supplierName: "",
        stockDate: new Date().toISOString().split("T")[0],
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!stockOutForm.stock_id_fk || !stockOutForm.stockoutDate) {
      setErrorMsg("Please select a target Stock In batch.");
      return;
    }

    const selectedBatch = stockInList.find(b => b.stock_id === Number(stockOutForm.stock_id_fk));
    if (!selectedBatch) {
      setErrorMsg("Invalid Stock In batch selected.");
      return;
    }

    if (Number(stockOutForm.quantityout) > selectedBatch.totalquantityin) {
      setErrorMsg(`Insufficient stock. Only ${selectedBatch.totalquantityin} units available in this batch.`);
      return;
    }
    
    setSubmitting(true);
    try {
      await addStockOut({
        stock_id_fk: Number(stockOutForm.stock_id_fk),
        quantityout: Number(stockOutForm.quantityout),
        stockoutDate: stockOutForm.stockoutDate,
      });
      setIsDialogOpen(false);
      setStockOutForm({
        stock_id_fk: "",
        quantityout: 1,
        stockoutDate: new Date().toISOString().split("T")[0],
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBatchInfo = stockOutForm.stock_id_fk 
    ? stockInList.find(b => b.stock_id === Number(stockOutForm.stock_id_fk))
    : null;

  // Filter lists based on search
  const filteredInList = stockInList.filter(item => 
    item.ItemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.stock_id).includes(searchTerm)
  );

  const filteredOutList = stockOutList.filter(item => 
    (item.ItemName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.stock_id_fk).includes(searchTerm) ||
    String(item.stock_id).includes(searchTerm)
  );

  const pageTitle = mode === "in" ? "Stock In Transactions" : "Stock Out Transactions";
  const buttonLabel = mode === "in" ? "Record Stock In" : "Record Stock Out";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {mode === "in" ? (
              <ArrowUpRight className="h-6 w-6 text-success bg-success/10 p-1 rounded-md" />
            ) : (
              <ArrowDownRight className="h-6 w-6 text-destructive bg-destructive/10 p-1 rounded-md" />
            )}
            {pageTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === "in" ? `${stockInList.length} total receipts` : `${stockOutList.length} total issues`} recorded
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search items, operators, ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs w-full sm:w-56 lg:w-64 bg-card"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); setErrorMsg(""); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" /> {buttonLabel}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold">{buttonLabel}</DialogTitle>
              </DialogHeader>
              
              {errorMsg && (
                <div className="text-xs font-semibold text-destructive bg-destructive/5 border border-destructive/10 rounded-md p-3 text-center">
                  {errorMsg}
                </div>
              )}

              {mode === "in" ? (
                <form onSubmit={handleCreateStockIn} className="space-y-4 pt-2 text-xs">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Item Name *</Label>
                    <Input 
                      placeholder="e.g. Acer Laptop Core i5" 
                      value={stockInForm.ItemName} 
                      onChange={(e) => setStockInForm({...stockInForm, ItemName: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Textarea 
                      placeholder="Optional details about this stock batch" 
                      value={stockInForm.Description} 
                      onChange={(e) => setStockInForm({...stockInForm, Description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Quantity In *</Label>
                      <Input 
                        type="number" 
                        min={1} 
                        value={stockInForm.quantityin} 
                        onChange={(e) => setStockInForm({...stockInForm, quantityin: Math.max(1, parseInt(e.target.value) || 1)})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Stock In Date *</Label>
                      <Input 
                        type="date" 
                        value={stockInForm.stockDate} 
                        onChange={(e) => setStockInForm({...stockInForm, stockDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Supplier Name *</Label>
                    <Input 
                      placeholder="e.g. Alink Technology Ltd" 
                      value={stockInForm.supplierName} 
                      onChange={(e) => setStockInForm({...stockInForm, supplierName: e.target.value})}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Stock In Record
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCreateStockOut} className="space-y-4 pt-2 text-xs">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Select Stock In Batch *</Label>
                    <Select 
                      value={stockOutForm.stock_id_fk} 
                      onValueChange={(val) => {
                        setStockOutForm({...stockOutForm, stock_id_fk: val});
                        setErrorMsg("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose batch item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stockInList
                          .filter(b => b.totalquantityin > 0)
                          .map((b) => (
                            <SelectItem key={b.stock_id} value={String(b.stock_id)}>
                              #{b.stock_id} - {b.ItemName} (Avail: {b.totalquantityin})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedBatchInfo && (
                    <div className="bg-muted/50 border border-border/80 rounded-md p-3 text-2xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Batch Item:</span>
                        <span className="font-bold">{selectedBatchInfo.ItemName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Initial Batch Qty:</span>
                        <span>{selectedBatchInfo.quantityin} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Current Stock Avail:</span>
                        <span className="font-bold text-success">{selectedBatchInfo.totalquantityin} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Supplier:</span>
                        <span>{selectedBatchInfo.supplierName}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Quantity Out *</Label>
                      <Input 
                        type="number" 
                        min={1} 
                        value={stockOutForm.quantityout} 
                        onChange={(e) => setStockOutForm({...stockOutForm, quantityout: Math.max(1, parseInt(e.target.value) || 1)})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Stock Out Date *</Label>
                      <Input 
                        type="date" 
                        value={stockOutForm.stockoutDate} 
                        onChange={(e) => setStockOutForm({...stockOutForm, stockoutDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {selectedBatchInfo && stockOutForm.quantityout > 0 && (
                    <div className="text-right text-[10px] font-bold text-muted-foreground">
                      Remaining stock after transaction:{" "}
                      <span className={selectedBatchInfo.totalquantityin - stockOutForm.quantityout < 0 ? "text-destructive" : "text-primary"}>
                        {selectedBatchInfo.totalquantityin - stockOutForm.quantityout} units
                      </span>
                    </div>
                  )}

                  <Button type="submit" disabled={submitting || !stockOutForm.stock_id_fk} className="w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Stock Out Record
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto shadow-sm">
        {mode === "in" ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20 whitespace-nowrap">
                {["BATCH ID", "ITEM NAME", "INITIAL QTY", "IN STOCK", "RECORDER", "SUPPLIER", "DATE", "ACTIONS"].map((h) => (
                  <th key={h} className="text-left p-3 font-medium uppercase tracking-tight">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0 animate-pulse">
                    {Array.from({ length: 8 }).map((_, col) => (
                      <td key={col} className="p-3"><Skeleton className="h-4 w-20 bg-muted" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredInList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground italic bg-muted/5">No stock receipt entries found.</td>
                </tr>
              ) : (
                filteredInList.map((m) => (
                  <tr key={m.stock_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-muted-foreground">#{m.stock_id}</td>
                    <td className="p-3 font-medium text-foreground">{m.ItemName}</td>
                    <td className="p-3 text-foreground font-semibold">{m.quantityin}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        m.totalquantityin === 0 
                          ? "bg-destructive/10 text-destructive" 
                          : "bg-success/10 text-success"
                      }`}>
                        {m.totalquantityin}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{m.user_name || "System"}</td>
                    <td className="p-3 text-muted-foreground">{m.supplierName}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(m.stockDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedItem({ ...m, type: "in" });
                            setIsViewOpen(true);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:bg-muted"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingItem(m);
                            setEditInForm({
                              ItemName: m.ItemName,
                              Description: m.Description || "",
                              quantityin: m.quantityin,
                              supplierName: m.supplierName,
                              stockDate: m.stockDate.split("T")[0]
                            });
                            setIsEditDialogOpen(true);
                          }}
                          className="h-7 w-7 text-primary hover:bg-muted"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteConfirmId(m.stock_id)}
                          className="h-7 w-7 text-destructive hover:bg-muted"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20 whitespace-nowrap">
                {["OUT ID", "ITEM NAME", "QTY OUT", "REMAINING BATCH STOCK", "RECORDER", "DATE", "REF BATCH", "ACTIONS"].map((h) => (
                  <th key={h} className="text-left p-3 font-medium uppercase tracking-tight">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0 animate-pulse">
                    {Array.from({ length: 8 }).map((_, col) => (
                      <td key={col} className="p-3"><Skeleton className="h-4 w-20 bg-muted" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredOutList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground italic bg-muted/5">No stock output entries found.</td>
                </tr>
              ) : (
                filteredOutList.map((m) => (
                  <tr key={m.stock_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-muted-foreground">#{m.stock_id}</td>
                    <td className="p-3 font-medium text-foreground">{m.ItemName || "Unknown Item"}</td>
                    <td className="p-3 text-foreground font-bold">{m.quantityout}</td>
                    <td className="p-3 text-muted-foreground font-semibold">{m.totalquantityout}</td>
                    <td className="p-3 text-muted-foreground">{m.user_name || "System"}</td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(m.stockoutDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
                    <td className="p-3 font-mono font-bold text-muted-foreground">#{m.stock_id_fk}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedItem({ ...m, type: "out" });
                            setIsViewOpen(true);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:bg-muted"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteConfirmId(m.stock_id)}
                          className="h-7 w-7 text-destructive hover:bg-muted"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={(open) => !open && setIsViewOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium">Transaction ID:</span>
                <span className="font-mono font-bold text-foreground">#{selectedItem.stock_id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium">Item Name:</span>
                <span className="font-bold text-foreground">{selectedItem.ItemName || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                <span className="text-muted-foreground font-medium">Type:</span>
                <span className={`font-bold ${selectedItem.type === "in" ? "text-success" : "text-destructive"}`}>
                  {selectedItem.type === "in" ? "Stock In (Receipt)" : "Stock Out (Issue)"}
                </span>
              </div>
              
              {selectedItem.type === "in" ? (
                <>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Quantity Received:</span>
                    <span className="font-bold text-foreground">{selectedItem.quantityin} units</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Current Stock In Batch:</span>
                    <span className="font-bold text-foreground">{selectedItem.totalquantityin} units</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Supplier Name:</span>
                    <span className="text-foreground">{selectedItem.supplierName}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Description:</span>
                    <span className="text-foreground">{selectedItem.Description || "No description provided."}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Operator / User:</span>
                    <span className="text-foreground">{selectedItem.user_name || "System"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground font-medium">Date Recorded:</span>
                    <span className="text-foreground">{new Date(selectedItem.stockDate).toLocaleDateString()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Quantity Issued:</span>
                    <span className="font-bold text-foreground">{selectedItem.quantityout} units</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Remaining Stock Level:</span>
                    <span className="font-bold text-foreground">{selectedItem.totalquantityout} units</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Referenced Batch ID:</span>
                    <span className="font-mono font-bold text-foreground">#{selectedItem.stock_id_fk}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Operator / User:</span>
                    <span className="text-foreground">{selectedItem.user_name || "System"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground font-medium">Date Issued:</span>
                    <span className="text-foreground">{new Date(selectedItem.stockoutDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}
              
              <div className="pt-2 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Details Dialog */}
      {mode === "in" && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) { setEditingItem(null); setErrorMsg(""); } }}>
          <DialogContent className="sm:max-w-md text-xs">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Edit Stock In Receipt</DialogTitle>
            </DialogHeader>

            {errorMsg && (
              <div className="text-xs font-semibold text-destructive bg-destructive/5 border border-destructive/10 rounded-md p-3 text-center">
                {errorMsg}
              </div>
            )}

            {editingItem && (
              <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Item Name *</Label>
                  <Input 
                    value={editInForm.ItemName} 
                    onChange={(e) => setEditInForm({...editInForm, ItemName: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea 
                    value={editInForm.Description} 
                    onChange={(e) => setEditInForm({...editInForm, Description: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Quantity In *</Label>
                    <Input 
                      type="number" 
                      min={1} 
                      value={editInForm.quantityin} 
                      onChange={(e) => setEditInForm({...editInForm, quantityin: Math.max(1, parseInt(e.target.value) || 1)})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Stock In Date *</Label>
                    <Input 
                      type="date" 
                      value={editInForm.stockDate} 
                      onChange={(e) => setEditInForm({...editInForm, stockDate: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Supplier Name *</Label>
                  <Input 
                    value={editInForm.supplierName} 
                    onChange={(e) => setEditInForm({...editInForm, supplierName: e.target.value})}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Stock In Record
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteConfirmId(null)}>
        <AlertDialogContent className="sm:max-w-md text-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete Record Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1 space-y-2">
              <p>
                Are you sure you want to delete this {mode === "in" ? "Stock In" : "Stock Out"} transaction? This action is permanent and cannot be undone.
              </p>
              {mode === "in" && (
                <div className="p-2 border border-destructive/20 bg-destructive/5 rounded text-destructive font-medium">
                  <strong>Warning:</strong> Deleting this Stock In record will also cascade delete all referenced Stock Out transactions associated with this batch!
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel 
              className="text-xs h-8" 
              disabled={isDeleting}
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold gap-1.5"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StockMovements;
