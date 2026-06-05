import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export interface StockInRecord {
  stock_id: number;
  ItemName: string;
  Description: string;
  quantityin: number;
  totalquantityin: number;
  stockDate: string;
  supplierName: string;
  user_id: number;
  user_name?: string;
}

export interface StockOutRecord {
  stock_id: number;
  quantityout: number;
  totalquantityout: number;
  stockoutDate: string;
  stock_id_fk: number;
  user_id: number;
  ItemName?: string;
  Description?: string;
  supplierName?: string;
  user_name?: string;
}

export interface DashboardStats {
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  totalUsers: number;
  recentMovements: any[];
}

interface StockMovementContextType {
  stockInList: StockInRecord[];
  stockOutList: StockOutRecord[];
  isLoading: boolean;
  stats: DashboardStats | null;
  refreshData: () => Promise<void>;
  addStockIn: (data: {
    ItemName: string;
    Description: string;
    quantityin: number;
    supplierName: string;
    stockDate: string;
  }) => Promise<void>;
  addStockOut: (data: {
    stock_id_fk: number;
    quantityout: number;
    stockoutDate: string;
  }) => Promise<void>;
}

const StockMovementContext = createContext<StockMovementContextType | undefined>(undefined);

export const StockMovementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockInList, setStockInList] = useState<StockInRecord[]>([]);
  const [stockOutList, setStockOutList] = useState<StockOutRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [inData, outData, statsData] = await Promise.all([
        api.get("/stock/in"),
        api.get("/stock/out"),
        api.get("/stock/stats")
      ]);
      setStockInList(inData as StockInRecord[]);
      setStockOutList(outData as StockOutRecord[]);
      setStats(statsData as DashboardStats);
    } catch (error: any) {
      console.error("Fetch stock data failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only run if token exists
    const token = localStorage.getItem("sms_token");
    if (token) {
      refreshData();
    }
  }, []);

  const addStockIn = async (data: {
    ItemName: string;
    Description: string;
    quantityin: number;
    supplierName: string;
    stockDate: string;
  }) => {
    try {
      const response: any = await api.post("/stock/in", data);
      setStockInList(prev => [response, ...prev]);
      toast({ title: "Success", description: "Stock In recorded successfully." });
      await refreshData(); // Refresh dashboard stats and other counts
    } catch (error: any) {
      toast({ 
        title: "Failed", 
        description: error.message || "Could not record Stock In.", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  const addStockOut = async (data: {
    stock_id_fk: number;
    quantityout: number;
    stockoutDate: string;
  }) => {
    try {
      const response: any = await api.post("/stock/out", data);
      setStockOutList(prev => [response, ...prev]);
      toast({ title: "Success", description: "Stock Out recorded successfully." });
      await refreshData(); // Refresh dashboard stats and other counts
    } catch (error: any) {
      toast({ 
        title: "Failed", 
        description: error.message || "Could not record Stock Out.", 
        variant: "destructive" 
      });
      throw error;
    }
  };

  return (
    <StockMovementContext.Provider value={{ 
      stockInList, 
      stockOutList, 
      isLoading, 
      stats, 
      refreshData, 
      addStockIn, 
      addStockOut 
    }}>
      {children}
    </StockMovementContext.Provider>
  );
};

export const useStockMovements = () => {
  const context = useContext(StockMovementContext);
  if (!context) throw new Error("useStockMovements must be used within a StockMovementProvider");
  return context;
};
