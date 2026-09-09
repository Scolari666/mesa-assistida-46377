import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerProvider } from "@/contexts/CustomerContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Cardapio from "./pages/Cardapio";
import Cart from "./pages/Cart";
import Identify from "./pages/Identify";
import Checkout from "./pages/Checkout";
import OrderStatus from "./pages/OrderStatus";
import StripeReturn from "./pages/StripeReturn";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <CustomerProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cardapio" element={<Cardapio />} />
                <Route path="/carrinho" element={<Cart />} />
                <Route path="/identificar" element={<Identify />} />
                <Route path="/finalizar" element={<Checkout />} />
                <Route path="/pedido/stripe" element={<StripeReturn />} />
                <Route path="/pedido/:id" element={<OrderStatus />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/cardapio"
                  element={
                    <ProtectedRoute>
                      <AdminMenu />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/configuracoes"
                  element={
                    <ProtectedRoute>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </CustomerProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
