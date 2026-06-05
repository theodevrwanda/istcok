import React, { createContext, useContext, useState, useEffect } from "react";
import { Order } from "@/data/mockData";
import api, { endpoints } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface OrderContextType {
  orders: Order[];
  totalOrders: number;
  isLoading: boolean;
  addOrder: (order: any) => Promise<void>;
  updateOrder: (id: string | number, order: any) => Promise<void>;
  deleteOrder: (id: string | number) => Promise<void>;
  deleteMultipleOrders: (ids: string[]) => Promise<void>;
  toggleRead: (id: string) => Promise<void>;
  toggleVerify: (id: string, adminName: string) => Promise<void>;
  recordPayment: (id: string, amount: number) => Promise<void>;
  markMultipleAsRead: (ids: string[], isRead: boolean) => Promise<void>;
  stats: any;
  refreshOrders: (page?: number, size?: number) => Promise<void>;
  isWsConnected: boolean;
  requestNotificationPermission: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
  const WS_URL = API_BASE_URL.replace("http", "ws") + "/dashboard/ws";

  const refreshOrders = async (page: number = 1, size: number = 50) => {
    setIsLoading(true);
    try {
      const response: any = await api.get(`${endpoints.orders}?page=${page}&size=${size}`);
      
      const items = Array.isArray(response) ? response : (response.items || []);
      const total = typeof response === 'object' && !Array.isArray(response) ? (response.total || 0) : items.length;

      const formattedData = items.map((o: any) => {
        const oid = o._id || o.id;
        return {
          ...o,
          _id: oid,
          id: oid
        };
      });
      
      setOrders(formattedData);
      setTotalOrders(total);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get(endpoints.stats);
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const setupPush = async () => {
    console.log("🎫 PWA: Push Token simulated (Mock mode)");
  };

  const requestNotificationPermission = async () => {
    console.log("🎫 PWA: Notification permission requested (Mock mode)");
  };

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/pwa-icon-512.png",
        badge: "/pwa-icon-512.png",
        tag: "new-order",
      });
    }
  };

  useEffect(() => {
    refreshOrders(1, 10);
    fetchStats();
    
    // Simulate real-time sync with custom events
    const handleSync = () => {
      console.log("🔄 PWA Mock: Sync triggered");
      fetchStats();
      refreshOrders(1, 10);
    };

    window.addEventListener("oluxy-sync", handleSync);
    setIsWsConnected(true);

    return () => {
      window.removeEventListener("oluxy-sync", handleSync);
    };
  }, []);

  const addOrder = async (orderData: any) => {
    try {
      await api.post(endpoints.orders, orderData);
      await refreshOrders();
      toast({ title: "Success", description: "Order created successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const updateOrder = async (id: string | number, orderData: any) => {
    try {
      await api.patch(`${endpoints.orders}/${id}`, orderData);
      await refreshOrders();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleRead = async (id: string) => {
    const order = orders.find(o => (o._id && o._id === id) || (o.id && String(o.id) === String(id)));
    if (!order) return;
    
    const targetId = order._id || order.id;
    const isRead = order.readBy?.includes("Admin");
    const newReadBy = isRead 
      ? (order.readBy || []).filter(u => u !== "Admin")
      : [...(order.readBy || []), "Admin"];

    try {
      await api.patch(`${endpoints.orders}/${targetId}`, { readBy: newReadBy });
      setOrders(orders.map(o => (o._id === targetId || o.id === targetId) ? { ...o, readBy: newReadBy } : o));
      fetchStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleVerify = async (id: string, adminName: string) => {
    const order = orders.find(o => (o._id && o._id === id) || (o.id && String(o.id) === String(id)));
    if (!order) return;
    
    const targetId = order._id || order.id;
    const isVerifying = !order.verified;

    try {
      await api.patch(`${endpoints.orders}/${targetId}`, { 
        verified: isVerifying,
        verifiedBy: isVerifying ? adminName : null
      });
      
      setOrders(orders.map(o => (o._id === targetId || o.id === targetId) ? { 
        ...o, 
        verified: isVerifying,
        verifiedBy: isVerifying ? adminName : undefined
      } : o));
      
      toast({ 
        title: isVerifying ? "Order Verified" : "Verification Removed", 
        description: isVerifying ? `Verified by ${adminName}` : "Payment status reset." 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const recordPayment = async (dbId: string, amount: number) => {
    try {
      await api.patch(`${endpoints.orders}/${dbId}/pay?payment_amount=${amount}`);
      await refreshOrders();
      toast({ title: "Payment Recorded", description: "Ledger updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteOrder = async (id: string | number) => {
    try {
      await api.delete(`${endpoints.orders}/${id}`);
      await refreshOrders();
      toast({ title: "Deleted", description: "Order removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteMultipleOrders = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => api.delete(`${endpoints.orders}/${id}`)));
      await refreshOrders();
      toast({ title: "Deleted", description: "Selection removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const markMultipleAsRead = async (ids: string[], isRead: boolean) => {
    try {
      await Promise.all(ids.map(async (id) => {
        const order = orders.find(o => o._id === id || o.id === id);
        if (!order) return;
        
        const alreadyRead = order.readBy?.includes("Admin");
        if (alreadyRead === isRead) return;

        const newReadBy = isRead 
          ? [...(order.readBy || []), "Admin"]
          : (order.readBy || []).filter(u => u !== "Admin");

        await api.patch(`${endpoints.orders}/${order._id}`, { readBy: newReadBy });
      }));
      
      setOrders(orders.map(o => ids.includes(o._id) 
        ? { ...o, readBy: isRead 
            ? [...(o.readBy || []).filter(u => u !== "Admin"), "Admin"] 
            : (o.readBy || []).filter(u => u !== "Admin") 
          } 
        : o
      ));
      fetchStats();
      
      toast({ title: "Success", description: `${ids.length} orders updated.` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        totalOrders,
        isLoading,
        addOrder,
        updateOrder,
        deleteOrder,
        deleteMultipleOrders,
        toggleRead,
        toggleVerify,
        recordPayment,
        markMultipleAsRead,
        stats,
        refreshOrders,
        isWsConnected,
        requestNotificationPermission,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
