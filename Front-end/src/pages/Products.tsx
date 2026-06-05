import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Pencil, Trash2, ChevronDown, ChevronUp, ImageIcon, AlertTriangle, Loader2, Star, Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const Products = () => {
  const navigate = useNavigate();
  const { products: productList, isLoading, refreshProducts, deleteProduct, deleteMultipleProducts, markAsStockOut, toggleHomePage } = useProducts();
  const { isAdmin, isManager } = useAuth();
  const isStaffOnly = !isManager; 
  
  const [expanded, setExpanded] = useState<number | string | null>(null);
  const [viewProduct, setViewProduct] = useState<any | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<(number | string)[]>([]);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [stockOutId, setStockOutId] = useState<number | string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [loadingHomeId, setLoadingHomeId] = useState<string | number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTarget, setActiveTarget] = useState<"watch" | "wear">("wear");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      refreshProducts(searchTerm, activeTarget);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTarget]);

  const featuredProducts = productList.filter(p => p.on_home_page);

  const statusColor: Record<string, string> = {
    "In Stock": "bg-success/15 text-success",
    "Out of Stock": "bg-destructive/15 text-destructive",
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return dateStr.split("T")[0];
    } catch {
      return dateStr;
    }
  };

  const toggleSelect = (id: number | string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allIds = productList.map((p) => p.id || (p as any)._id);
    if (selectedProducts.length === allIds.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(allIds);
    }
  };

  const handleDelete = async (id: number | string) => {
    setIsProcessing(true);
    try {
       await deleteProduct(id);
       setDeleteId(null);
    } finally {
       setIsProcessing(false);
    }
  };

  const handleDeleteSelected = async () => {
    setIsProcessing(true);
    try {
        await deleteMultipleProducts(selectedProducts);
        setSelectedProducts([]);
        setShowBulkDelete(false);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSetStockOut = async (id: number | string) => {
    setIsProcessing(true);
    try {
        await markAsStockOut(id);
        setStockOutId(null);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleToggleHome = async (id: string | number) => {
    setLoadingHomeId(id);
    await toggleHomePage(id, activeTarget);
    setLoadingHomeId(null);
  };

  if (isLoading && productList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-40 mt-1" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Products</h1>
          <p className="text-xs text-muted-foreground">{productList.length} products total</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs w-48 lg:w-64"
            />
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50">
             <Star size={14} className={featuredProducts.length > 0 ? "text-primary fill-primary" : "text-muted-foreground"} />
             <span className="text-[10px] font-bold uppercase tracking-wider">Home Page Slots: {featuredProducts.length}/8</span>
          </div>
          <div className="flex items-center gap-2">
            {!isStaffOnly && selectedProducts.length > 0 && (
              <Button size="sm" variant="destructive" className="gap-1.5 text-xs h-8" onClick={() => setShowBulkDelete(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedProducts.length})
              </Button>
            )}
            {!isStaffOnly && (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/products/new")}>
                <Plus className="h-3.5 w-3.5" /> Add Product
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!viewProduct} onOpenChange={(val) => { if (!val) setViewProduct(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{viewProduct?.name}</DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {viewProduct.images?.map((img: string, i: number) => (
                   <img key={i} src={img} alt="" className="h-24 w-24 rounded-lg border border-border object-cover shrink-0" />
                ))}
              </div>
              <p className="text-muted-foreground">{viewProduct.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="bg-card border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground bg-muted/20">
              <th className="text-left p-3 font-medium w-8">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={productList.length > 0 && selectedProducts.length === productList.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="text-left p-3 font-medium">PRODUCT</th>
              <th className="text-left p-3 font-medium">BRAND</th>
              <th className="text-left p-3 font-medium">TARGET</th>
              <th className="text-left p-3 font-medium">CATEGORY</th>
              <th className="text-left p-3 font-medium">OLD PRICE</th>
              <th className="text-left p-3 font-medium">NEW PRICE</th>
              <th className="text-left p-3 font-medium">STOCK</th>
              <th className="text-left p-3 font-medium">STATUS</th>
              <th className="text-left p-3 font-medium">INFO / SPECS</th>
              <th className="text-left p-3 font-medium">ADDED</th>
              <th className="text-left p-3 font-medium">HOME</th>
              <th className="text-left p-3 font-medium">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {productList.map((p: any) => {
              const pId = p.id || p._id;
              return (
                <tr key={pId} className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors align-top ${selectedProducts.includes(pId) ? "bg-muted/30" : ""}`}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedProducts.includes(pId)}
                      onChange={() => toggleSelect(pId)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                        {p.images && p.images.length > 0 ? (
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-foreground font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.brand}</td>
                  <td className="p-3">
                     <span className="text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                        {p.gender || "Men"}
                     </span>
                   </td>
                  <td className="p-3 text-muted-foreground">{p.category}</td>
                  <td className="p-3 text-muted-foreground line-through">RF {(p.old_price || p.oldPrice || 0).toLocaleString()}</td>
                  <td className="p-3 text-primary font-medium">RF {(p.new_price || p.newPrice || 0).toLocaleString()}</td>
                  <td className="p-3 text-foreground font-medium">{p.stockLevel}</td>
                  <td className="p-3">
                    <span className={`text-2xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${(p.stockLevel === 0 || p.stock_status === "Out of Stock" || p.stockStatus === "Out of Stock") ? statusColor["Out of Stock"] : statusColor["In Stock"]}`}>
                      {(p.stockLevel === 0 || p.stock_status === "Out of Stock" || p.stockStatus === "Out of Stock") ? "Out of Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="p-3 max-w-[200px]">
                    {expanded === pId ? (
                      <div className="space-y-3">
                        <p className="text-muted-foreground leading-relaxed italic">{p.description}</p>
                        {p.features && Object.keys(p.features).length > 0 && (
                             <div className="grid grid-cols-1 gap-1">
                                {Object.entries(p.features).map(([k, v]: any) => (
                                  <div key={k} className="flex justify-between border-b border-border/50 pb-0.5">
                                    <span className="text-muted-foreground">{k}:</span>
                                    <span className="text-foreground font-medium">{v}</span>
                                  </div>
                                ))}
                             </div>
                        )}
                        <button onClick={() => setExpanded(null)} className="text-primary font-medium text-[10px] flex items-center gap-0.5 pt-1">
                          <ChevronUp className="h-3 w-3" /> Hide
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground truncate">{p.description?.substring(0, 30)}...</p>
                        <button onClick={() => setExpanded(pId)} className="text-primary font-medium text-[10px] flex items-center gap-0.5 mt-1">
                          <ChevronDown className="h-3 w-3" /> See Specs
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isStaffOnly || loadingHomeId === pId || (!p.on_home_page && featuredProducts.length >= 8)}
                      onClick={() => !isStaffOnly && handleToggleHome(pId)}
                      className={`h-7 w-7 rounded-full ${p.on_home_page ? 'text-primary' : 'text-muted-foreground'} ${isStaffOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isStaffOnly ? "Staff Restricted" : (p.on_home_page ? "Remove from Home Page" : "Add to Home Page")}
                    >
                      {loadingHomeId === pId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Star size={14} className={p.on_home_page ? "fill-primary" : ""} />
                      )}
                    </Button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setViewProduct(p)} title="View Info"><Eye className="h-3.5 w-3.5" /></Button>
                      {!isStaffOnly && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => navigate("/products/edit/" + pId)} title="Edit Product"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-warning" onClick={() => setStockOutId(pId)} title="Mark Stock Out"><AlertTriangle className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(pId)} title="Delete Product"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={stockOutId !== null} onOpenChange={(val) => !val && setStockOutId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Mark as Stock Out</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will mark the product as Out of Stock and set your quantity to zero permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8" disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="text-xs h-8 bg-warning text-warning-foreground gap-2" 
              onClick={(e) => { e.preventDefault(); stockOutId !== null && handleSetStockOut(stockOutId); }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(val) => !val && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete Product Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the product and all its images from the cloud storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8" disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="text-xs h-8 bg-destructive text-destructive-foreground gap-2" 
              onClick={(e) => { e.preventDefault(); deleteId !== null && handleDelete(deleteId); }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete Multiple Products?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete {selectedProducts.length} items and all their cloud images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8" disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="text-xs h-8 bg-destructive text-destructive-foreground gap-2" 
              onClick={(e) => { e.preventDefault(); handleDeleteSelected(); }}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirm Bulk Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
