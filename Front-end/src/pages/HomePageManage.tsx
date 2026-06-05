import { useState, useEffect } from "react";
import { useProducts } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Home, Star, LayoutGrid, Check, X, Loader2, Search, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const HomePageManage = () => {
  const { products, isLoading, refreshProducts, toggleHomePage } = useProducts();
  const { toast } = useToast();
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [target, setTarget] = useState("wear");

  useEffect(() => {
    refreshProducts("", target);
  }, [target]);

  const featuredProducts = products.filter(p => p.on_home_page);
  const remainingSlots = 8 - featuredProducts.length;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleHomeStatus = async (productId: string) => {
    setLoadingIds(prev => [...prev, productId]);
    try {
      await toggleHomePage(productId, target);
      refreshProducts("", target);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== productId));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-16 w-36 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-10 w-64 rounded-xl" />
            </div>
            <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-20 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-card border border-border/50 rounded-3xl h-96 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Home size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Curation Suite</span>
          </div>
          <h1 className="text-3xl font-display italic">Home Page Showcase</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-60">Manage your storefront's top 8 featured masterpieces</p>
          
          
        </div>
        
        <div className="flex items-center gap-4 bg-muted/40 p-4 rounded-2xl border border-border/50">
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Slots</p>
              <p className="text-2xl font-display">{featuredProducts.length} <span className="text-sm italic opacity-50">/ 8</span></p>
           </div>
           <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${featuredProducts.length === 8 ? 'border-primary bg-primary/10 text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
              <Star size={20} fill={featuredProducts.length === 8 ? "currentColor" : "none"} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-8">
        {/* Main Content: Table */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 w-full">
              <LayoutGrid size={16} className="text-primary" />
              Inventory Management
            </h2>
            <div className="relative w-full sm:max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
               <Input 
                 placeholder="Search by name or brand..." 
                 className="pl-9 h-10 text-xs rounded-xl"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
          
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px] text-[10px] uppercase tracking-widest font-bold">Image</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold">Product Details</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest font-bold">Status</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-widest font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const pId = product.id || product._id;
                  return (
                    <TableRow key={pId} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border/50">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-primary uppercase tracking-widest">{product.brand}</p>
                          <p className="text-sm font-display leading-none">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono opacity-60">ID: #{String(pId).slice(-6)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.on_home_page ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            Home Page
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground/20 rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                            Catalog Only
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={product.on_home_page ? "destructive" : "hero"}
                          onClick={() => toggleHomeStatus(pId)}
                          disabled={loadingIds.includes(pId) || (!product.on_home_page && featuredProducts.length >= 8)}
                          className={`h-9 px-4 rounded-xl uppercase tracking-widest text-[9px] font-bold ${!product.on_home_page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white border-0'}`}
                        >
                          {loadingIds.includes(pId) ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : product.on_home_page ? (
                            <span className="flex items-center gap-1.5"><X size={12} /> Remove</span>
                          ) : (
                            <span className="flex items-center gap-1.5"><Check size={12} /> Select</span>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Sidebar: Summary */}
        <div className="space-y-6">
           <div className="p-6 bg-card border border-border/50 rounded-3xl sticky top-8 shadow-sm">
              <h3 className="font-display text-xl mb-6 flex items-center gap-3">
                <Sparkles size={20} className="text-primary" />
                Storefront Preview
              </h3>
              
              <div className="space-y-4">
                {featuredProducts.length === 0 ? (
                  <div className="py-12 text-center space-y-3 border-2 border-dashed border-border rounded-2xl px-4 bg-muted/20">
                    <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mx-auto text-muted-foreground">
                      <Home size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Empty Selection</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-2 uppercase tracking-wide">Select products from the table</p>
                    </div>
                  </div>
                ) : (
                  featuredProducts.map((p, index) => {
                    const pId = p.id || p._id;
                    return (
                      <div
                        key={pId}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-muted/40 group border border-transparent hover:border-primary/20 transition-all animate-in slide-in-from-right-4 duration-300"
                      >
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-white uppercase">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase font-bold text-primary tracking-widest leading-none mb-1">{p.brand}</p>
                          <h5 className="text-[11px] font-display truncate pr-2 uppercase">{p.name}</h5>
                        </div>
                        <button 
                          onClick={() => toggleHomeStatus(pId)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {featuredProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-4">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Live View</p>
                    <p className="text-[11px] text-muted-foreground italic leading-relaxed uppercase tracking-wider">
                      These items are now shimmering on your homepage.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full rounded-2xl border-border/50 text-[10px] uppercase font-bold tracking-widest h-12 flex gap-2">
                     <ExternalLink size={14} /> View Storefront
                  </Button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageManage;
