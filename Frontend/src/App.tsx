import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { StockMovementProvider } from "@/contexts/StockMovementContext";
import StockMovements from "./pages/StockMovements";
import Reports from "./pages/Reports";
import { Loader2 } from "lucide-react";
import ReloadPrompt from "@/components/ReloadPrompt";

const AppContent = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Securing Connection...</p>
        </div>
      </div>
    );
  }

  // If not logged in, only show the Login page
  if (!user) {
    return <Login />;
  }

  return (
    <StockMovementProvider>
      <DashboardLayout onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock-in" element={<StockMovements mode="in" />} />
          <Route path="/stock-out" element={<StockMovements mode="out" />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </DashboardLayout>
    </StockMovementProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ReloadPrompt />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
