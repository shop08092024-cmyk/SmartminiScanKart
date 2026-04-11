import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { ShopProfileProvider } from "@/context/ShopProfileContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import ScanPage from "@/pages/ScanPage";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import SettingsPage from "@/pages/SettingsPage";
import ProductsPage from "@/pages/ProductsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import CustomersPage from "@/pages/CustomersPage";
import SubscriptionPage from "@/pages/SubscriptionPage";
import NotFound from "@/pages/NotFound";
import { useStore } from "@/store/useStore";

const queryClient = new QueryClient();

function DataLoader({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  // Use stable reference: Zustand action functions don't change between renders
  const fetchAll = useStore((s) => s.fetchAll);

  useEffect(() => {
    if (session) {
      fetchAll().catch((err) => console.error("Initial data fetch failed:", err));
    }
  // fetchAll is a stable Zustand action — safe to include without causing loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);
  
  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading SmartMiniScanKart...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <ShopProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <DataLoader>
                <Routes>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/scan" element={<ScanPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/subscription" element={<SubscriptionPage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/new" element={<ProductsPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/customers" element={<CustomersPage />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DataLoader>
            </BrowserRouter>
          </TooltipProvider>
        </ShopProfileProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
