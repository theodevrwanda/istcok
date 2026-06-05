import React, { createContext, useContext, useState, useEffect } from "react";
import api, { endpoints } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface ProductContextType {
  products: any[];
  isLoading: boolean;
  refreshProducts: (query?: string, target?: string) => Promise<void>;
  deleteProduct: (id: string | number) => Promise<void>;
  markAsStockOut: (id: string | number) => Promise<void>;
  deleteMultipleProducts: (ids: (string | number)[]) => Promise<void>;
  toggleHomePage: (id: string | number, target?: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = async (query?: string, target: string = "wear") => {
    setIsLoading(true);
    try {
      const url = `${endpoints.products}?target=${target}${query ? `&search=${encodeURIComponent(query)}` : ''}`;
      const data: any = await api.get(url);
      setProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Fetch failed", error);
      toast({
        title: "Database Offline",
        description: "Unable to reach the server. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleSync = () => {
      console.log("🔄 PWA: Real-time product sync triggered");
      fetchProducts();
    };

    window.addEventListener("oluxy-sync", handleSync);
    return () => window.removeEventListener("oluxy-sync", handleSync);
  }, []);

  const deleteProduct = async (id: string | number) => {
    try {
      await api.delete(`${endpoints.products}/${id}`);
      setProducts(products.filter((p) => (p.id || p._id) !== id));
      toast({ title: "Product Removed", description: "The item has been deleted from inventory." });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.detail || "The server is currently unreachable. Check your network.",
        variant: "destructive",
      });
    }
  };

  const deleteMultipleProducts = async (ids: (string | number)[]) => {
    try {
      await Promise.all(ids.map(id => api.delete(`${endpoints.products}/${id}`)));
      setProducts(products.filter((p) => !ids.includes(p.id || p._id)));
      toast({ title: "Bulk Delete Success", description: `${ids.length} products removed.` });
    } catch (error: any) {
       toast({
        title: "Bulk Delete Partial Failure",
        description: "Some items could not be deleted. Please check your connection.",
        variant: "destructive",
      });
      fetchProducts(); // Refresh to show current state
    }
  };

  const markAsStockOut = async (id: string | number) => {
    try {
      await api.patch(`${endpoints.products}/${id}`, { stock_status: "Out of Stock", stockLevel: 0 });
      setProducts(products.map((p) => ((p.id || p._id) === id ? { ...p, stock_status: "Out of Stock", stockLevel: 0 } : p)));
      toast({ title: "Inventory Updated", description: "Item marked as Out of Stock." });
    } catch (error: any) {
      toast({ title: "Update Failed", description: "Unable to update stock status.", variant: "destructive" });
    }
  };

  const toggleHomePage = async (id: string | number, target: string = "wear") => {
    try {
      const response: any = await api.post(`/dashboard/home/toggle/${id}?target=${target}`);
      setProducts(products.map((p) => 
        ((p.id || p._id) === id) ? { ...p, on_home_page: !p.on_home_page } : p
      ));
      toast({ 
        title: "Home Page Updated", 
        description: response.on_home_page ? "Product added to home page." : "Product removed from home page." 
      });
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.response?.data?.detail || "Unable to update home page status.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <ProductContext.Provider value={{ products, isLoading, refreshProducts: fetchProducts, deleteProduct, markAsStockOut, deleteMultipleProducts, toggleHomePage }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within a ProductProvider");
  return context;
};
