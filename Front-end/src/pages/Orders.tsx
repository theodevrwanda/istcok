import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Eye, Trash2, Banknote, CheckSquare, Square, ShoppingCart, ShieldCheck, ShieldAlert, User, MapPin, CreditCard, Info, Clock, Check, Package, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import { Order } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const tabs = ["All", "Pending", "Completed", "Cancelled"] as const;

const statusColor: Record<string, string> = {
  Pending: "bg-warning/15 text-warning",
  Completed: "bg-success/15 text-success",
  Cancelled: "bg-destructive/15 text-destructive",
};

const methodColor: Record<string, string> = {
  "Pick up": "bg-info/15 text-info",
  "Delivery": "bg-primary/15 text-primary",
};

const paymentColor: Record<string, string> = {
  MTN: "bg-warning/15 text-warning border border-warning/20",
  Airtel: "bg-destructive/15 text-destructive border border-destructive/20",
  Bank: "bg-info/15 text-info border border-info/20",
};

const Orders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    orders, 
    totalOrders,
    isLoading,
    deleteOrder, 
    deleteMultipleOrders, 
    toggleRead, 
    toggleVerify, 
    recordPayment, 
    updateOrder, 
    markMultipleAsRead,
    refreshOrders 
  } = useOrders();

  const { isAdmin, isManager } = useAuth();
  const isStaffOnly = !isManager; 

  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const [payAmount, setPayAmount] = useState("");
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [verifyOrder, setVerifyOrder] = useState<Order | null>(null);
  const [showAutoCompleteConfirm, setShowAutoCompleteConfirm] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    refreshOrders(currentPage, ITEMS_PER_PAGE);
  }, [currentPage]);

  const toggleSelect = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((oId) => oId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (orders.length > 0 && selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o._id));
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setIsProcessing(true);
    try {
      await deleteOrder(id);
      setDeleteId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBulk = async () => {
    setIsProcessing(true);
    try {
      await deleteMultipleOrders(selectedOrders);
      setSelectedOrders([]);
      setShowBulkDelete(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickPay = async () => {
    if (!payOrder || !payAmount) return;
    const amount = Number(payAmount);
    
    if (amount > payOrder.payment.remainAmount) {
      toast({ 
        title: "Overpayment Error", 
        description: `Cannot pay more than balance (RF ${payOrder.payment.remainAmount.toLocaleString()})`,
        variant: "destructive" 
      });
      return;
    }

    setIsProcessing(true);
    try {
      await recordPayment(payOrder._id, amount);
      
      const newPaid = payOrder.payment.paidAmount + amount;
      if (newPaid >= payOrder.payment.totalAmount && payOrder.status !== "Completed") {
        setShowAutoCompleteConfirm(payOrder);
      }
      
      setPayOrder(null);
      setPayAmount("");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAutoComplete = () => {
    if (showAutoCompleteConfirm) {
      updateOrder(showAutoCompleteConfirm._id, {
        status: "Completed",
        payment: {
          ...showAutoCompleteConfirm.payment,
          paidAmount: showAutoCompleteConfirm.payment.totalAmount,
          remainAmount: 0
        }
      });
      setShowAutoCompleteConfirm(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchFilter = filter === "All" || o.status === filter;
    const matchSearch = (o.customer?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      String(o.readableId || "").toLowerCase().includes(search.toLowerCase()) ||
      `ORD-${o.readableId}`.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Orders</h1>
          <p className="text-xs text-muted-foreground">{totalOrders} orders total</p>
        </div>
        <div className="flex items-center gap-2">
          {!isStaffOnly && selectedOrders.length > 0 && (
            <>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs shadow-sm bg-card" onClick={() => { markMultipleAsRead(selectedOrders, true); setSelectedOrders([]); }}>
                <CheckSquare className="h-3.5 w-3.5" /> Mark Read
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs shadow-sm bg-card" onClick={() => { markMultipleAsRead(selectedOrders, false); setSelectedOrders([]); }}>
                <Square className="h-3.5 w-3.5" /> Mark Unread
              </Button>
              <Button size="sm" variant="destructive" className="h-8 gap-1.5 text-xs shadow-sm" onClick={() => setShowBulkDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedOrders.length})
              </Button>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="h-8 pl-8 pr-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
            />
          </div>
          <div className="flex rounded-md overflow-hidden border border-border gap-px bg-border">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => { setFilter(t); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
          {!isStaffOnly && (
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/orders/new")}>
              <Plus className="h-3.5 w-3.5" /> New Order
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground bg-muted/20">
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={orders.length > 0 && selectedOrders.length === orders.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 w-10 font-medium">READ</th>
              {["FULL NAME", "PHONE", "PRODUCT", "METHOD", "PAYMENT", "SENDER", "TOTAL", "PAID", "REMAIN", "STATUS", "DATE", "ACTIONS"].map((h) => (
                <th key={h} className={`text-left p-3 font-medium whitespace-nowrap ${h === "DATE" ? "w-24" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                  <td className="p-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-14" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-6 w-24" /></td>
                </tr>
              ))
            ) : filtered.map((o) => {
              const isRead = o.readBy?.includes("Admin");
              return (
              <tr key={o._id} className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!isRead ? "bg-primary/5 font-medium border-l-2 border-l-primary" : ""}`}>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedOrders.includes(o._id)}
                    onChange={() => toggleSelect(o._id)}
                  />
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleRead(o._id)} className="text-muted-foreground hover:text-primary transition-colors">
                    {isRead ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                  </button>
                </td>
                <td className="p-3 text-foreground whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    {o.customer?.fullName}
                    {o.verified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-white fill-blue-500 shrink-0" />
                    )}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{o.customer?.phone}</td>
                <td className="p-3">
                  <div className="font-medium text-foreground uppercase tracking-tighter text-[10px] truncate max-w-[120px]" title={o.orderType?.productName}>
                    {o.orderType?.productName || "Item"}
                  </div>
                  <div className="text-muted-foreground text-[9px]">Qty: {o.orderType?.quantity}</div>
                </td>
                <td className="p-3"><span className={`text-2xs px-2 py-1 rounded-full font-medium ${methodColor[o.orderType.method]}`}>{o.orderType.method}</span></td>
                <td className="p-3"><span className={`text-2xs px-2 py-1 rounded-full font-medium ${paymentColor[o.payment.method]}`}>{o.payment.method}</span></td>
                <td className="p-3">
                  <div className="font-medium text-foreground text-[10px]">{o.payment.senderName}</div>
                  <div className="text-[9px] text-muted-foreground">{o.payment.senderNumber}</div>
                </td>
                <td className="p-3 text-foreground font-bold whitespace-nowrap">RF {o.payment.totalAmount.toLocaleString()}</td>
                <td className="p-3 text-success font-bold whitespace-nowrap">RF {o.payment.paidAmount.toLocaleString()}</td>
                <td className="p-3 text-destructive font-bold whitespace-nowrap">RF {o.payment.remainAmount.toLocaleString()}</td>
                <td className="p-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${statusColor[o.status]}`}>{o.status}</span></td>
                <td className="p-3 text-muted-foreground whitespace-nowrap">{o.createdAt?.split('T')[0] || "Just now"}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-7 w-7 rounded-md ${o.verified ? "text-blue-500 bg-blue-500/10 border border-blue-500/20" : "text-muted-foreground hover:bg-muted"}`}
                      onClick={() => !isStaffOnly && setVerifyOrder(o)}
                      title={o.verified ? `Verified by ${o.verifiedBy}` : (isStaffOnly ? "Verify (Read-Only)" : "Verify Payment")}
                      disabled={isStaffOnly}
                    >
                      {o.verified ? <BadgeCheck className="h-4 w-4 text-white fill-blue-500" /> : <ShieldAlert className="h-4 w-4" />}
                    </Button>
                    {!isStaffOnly && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:bg-success/10" onClick={() => setPayOrder(o)} title="Quick Pay"><Banknote className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={() => setViewOrder(o)} title="View Details"><Eye className="h-3.5 w-3.5" /></Button>
                    {!isStaffOnly && (
                       <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={() => navigate(`/orders/edit/${o._id}`)} title="Edit Order"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(o._id)} title="Delete Order"><Trash2 className="h-3.5 w-3.5" /></Button>
                       </>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={13} className="p-12 text-center text-muted-foreground italic bg-muted/5">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingCart className="h-8 w-8 opacity-10" />
                    <p>No transactions found matching your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-4 border border-border bg-card rounded-lg shadow-sm">
        <div className="text-xs text-muted-foreground font-medium">
          Showing <span className="text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, totalOrders)}</span> of <span className="text-foreground font-bold">{totalOrders}</span> orders
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-bold" 
            disabled={currentPage === 1} 
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-4 h-8 rounded-md bg-muted/50 border border-border text-xs font-bold text-foreground">
            {currentPage} / {totalPages || 1}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs font-bold" 
            disabled={currentPage >= totalPages} 
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(val) => !val && setViewOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Order #{viewOrder?.readableId} Intelligence
                </DialogTitle>
                <div className="flex items-center gap-2 text-2xs">
                   <span className="text-muted-foreground">Placed on:</span>
                   <span className="font-semibold text-foreground uppercase">{viewOrder?.createdAt?.split('T')[0] || "Live"}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${viewOrder ? statusColor[viewOrder.status] : ""}`}>
                {viewOrder?.status}
              </div>
            </div>
          </DialogHeader>

          {viewOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left Column: People & Product */}
              <div className="space-y-6">
                {/* Product Info */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 relative overflow-hidden">
                   <ShoppingCart className="absolute -right-2 -bottom-2 h-16 w-16 opacity-5 rotate-12" />
                   <h3 className="text-2xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-1">
                     <Package className="h-3 w-3" /> Selected Merchandise
                   </h3>
                   <div className="space-y-2">
                      <p className="font-bold text-base leading-tight">{viewOrder.orderType.productName}</p>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Quantity</p>
                          <p className="text-sm font-black text-primary">x {viewOrder.orderType.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Fulfillment</p>
                          <p className="text-sm font-bold">{viewOrder.orderType.method}</p>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3">
                   <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 px-1">
                     <User className="h-3 w-3" /> Customer Profile
                   </h3>
                   <div className="bg-card border border-border rounded-lg p-3 space-y-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">LEGAL NAME</p>
                        <p className="font-bold text-sm">{viewOrder.customer.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">COMMUNICATION</p>
                        <p className="font-bold text-sm tracking-widest">{viewOrder.customer.phone}</p>
                      </div>
                   </div>
                </div>

                 {/* Administrative History */}
                 <div className="space-y-3">
                   <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 px-1">
                     <Clock className="h-3 w-3" /> Audit Log
                   </h3>
                   <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded bg-success/20 flex items-center justify-center mt-0.5">
                           <Eye className="h-3 w-3 text-success" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground">Viewed By</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                             {viewOrder.readBy?.length ? (
                               viewOrder.readBy.map((u, i) => (
                                 <span key={i} className="bg-card border border-border px-1.5 py-0.5 rounded text-[9px] font-medium">{u}</span>
                               ))
                             ) : (
                               <span className="italic text-[9px] text-muted-foreground">No administrative reads recorded</span>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className={`h-5 w-5 rounded flex items-center justify-center mt-0.5 ${viewOrder.verified ? "bg-blue-500" : "bg-muted"}`}>
                           {viewOrder.verified ? <Check className="h-3 w-3 text-white" /> : <ShieldAlert className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-foreground">Verification Status</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                             {viewOrder.verified 
                               ? `Verified by ${viewOrder.verifiedBy || "Administrator"}` 
                               : "Pending financial proof confirmation"}
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column: Location & Financials */}
              <div className="space-y-6">
                {/* Financial Ledger */}
                <div className="bg-card border-l-4 border-l-primary shadow-sm rounded-lg p-4 space-y-4">
                   <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                     <CreditCard className="h-3 w-3" /> Financial Intelligence
                   </h3>
                   <div className="grid grid-cols-1 gap-3">
                      <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                         <span className="text-xs text-muted-foreground">Total Transaction Value</span>
                         <span className="font-bold text-sm">RF {viewOrder.payment.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
                         <span className="text-xs text-success font-medium">Payment Received</span>
                         <span className="font-black text-success text-sm">RF {viewOrder.payment.paidAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-destructive/5 px-2 rounded">
                         <span className="text-xs text-destructive font-bold">Unpaid Balance</span>
                         <span className="font-black text-destructive text-sm underline underline-offset-4">RF {viewOrder.payment.remainAmount.toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="pt-2 space-y-1.5 border-t border-border mt-2">
                      <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                         <span className="text-muted-foreground">Gateway</span>
                         <span className="font-bold">{viewOrder.payment.method}</span>
                      </div>
                      <div className="flex justify-between text-[9px] uppercase tracking-tighter">
                         <span className="text-muted-foreground">Sender Identification</span>
                         <span className="font-bold">{viewOrder.payment.senderName} ({viewOrder.payment.senderNumber})</span>
                      </div>
                   </div>
                </div>

                 {/* Logistics */}
                <div className="space-y-3">
                   <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 px-1">
                     <MapPin className="h-3 w-3" /> Fulfillment Logistics
                   </h3>
                   <div className="bg-card border border-border rounded-lg p-4">
                      <p className="text-[10px] text-muted-foreground uppercase mb-1">Detailed Address</p>
                      <p className="font-bold text-sm leading-relaxed">{viewOrder.location.address || "No address provided"}</p>
                   </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs font-bold" onClick={() => setViewOrder(null)}>Close Intel</Button>
            {!isStaffOnly && (
               <Button size="sm" className="h-8 text-xs font-bold" onClick={() => { navigate(`/orders/edit/${viewOrder?._id}`); setViewOrder(null); }}>Edit Order</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Confirmation */}
      <AlertDialog open={!!verifyOrder} onOpenChange={(val) => !val && setVerifyOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">
              {verifyOrder?.verified ? "Remove Verification?" : "Verify Order Payment?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {verifyOrder?.verified 
                ? <>Do you want to clear the payment verification for {verifyOrder?.customer?.fullName}'s order ({verifyOrder?.orderType?.productName}) of <strong className="text-foreground">RF {verifyOrder?.payment?.paidAmount?.toLocaleString()}</strong>?</> 
                : <>Confirm that the payment of <strong className="text-foreground">RF {verifyOrder?.payment?.paidAmount?.toLocaleString()}</strong> for {verifyOrder?.customer?.fullName}'s order ({verifyOrder?.orderType?.productName}) has been successfully received.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Wait, Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className={`text-xs h-8 ${verifyOrder?.verified ? "bg-destructive hover:bg-destructive/90" : "bg-success hover:bg-success/90"}`}
              onClick={async (e) => {
                e.preventDefault();
                if (verifyOrder) {
                  setIsProcessing(true);
                  try {
                    await toggleVerify(verifyOrder._id, "Admin");
                    setVerifyOrder(null);
                  } finally {
                    setIsProcessing(false);
                  }
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Confirm & Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Pay Dialog */}
      <Dialog open={!!payOrder} onOpenChange={(val) => !val && setPayOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm font-bold uppercase tracking-tight">Record Payment</DialogTitle></DialogHeader>
          {payOrder && (
            <div className="space-y-4 py-2">
              <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-border">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                  <span>Due Balance:</span>
                  <span className="text-destructive font-bold text-xs underline">RF {payOrder.payment.remainAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Installment Amount (RF)</Label>
                <Input 
                  type="number" 
                  value={payAmount} 
                  onChange={(e) => setPayAmount(e.target.value)} 
                  className="h-10 text-sm font-bold shadow-inner" 
                  placeholder="Enter value..."
                  autoFocus 
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickPay()}
                />
              </div>

              <Button 
                className="w-full text-xs h-10 shadow-sm" 
                onClick={handleQuickPay}
                disabled={isProcessing || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > payOrder.payment.remainAmount}
              >
                {isProcessing && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                Save Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Auto Complete Confirmation */}
      <AlertDialog open={!!showAutoCompleteConfirm} onOpenChange={(val) => !val && setShowAutoCompleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Mark as Fully Paid?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Balance is now zero. Would you like to automatically mark this order as "Completed"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">No, Keep Pending</AlertDialogCancel>
            <AlertDialogAction 
              className="text-xs h-8 bg-success hover:bg-success/90" 
              onClick={async (e) => {
                e.preventDefault();
                setIsProcessing(true);
                try {
                  await confirmAutoComplete();
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Yes, Complete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(val) => !val && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">Remove Order Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This will permanently erase the transaction record from your database. There is no undo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="text-xs h-8 bg-destructive hover:bg-destructive/90 text-white" 
              onClick={(e) => { e.preventDefault(); deleteId && handleDeleteSingle(deleteId); }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-destructive">Mass Deletion Warning</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">You are about to delete {selectedOrders.length} records simultaneously. This action is catastrophic and irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Abort</AlertDialogCancel>
            <AlertDialogAction 
              className="text-xs h-8 bg-destructive hover:bg-destructive/90 text-white" 
              onClick={(e) => { e.preventDefault(); handleDeleteBulk(); }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Execute Bulk Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
