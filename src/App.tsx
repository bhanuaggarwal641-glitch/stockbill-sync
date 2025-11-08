import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductForm from "./pages/ProductForm";
import NewSale from "./pages/NewSale";
import Sales from "./pages/Sales";
import GstPurchase from "./pages/GstPurchase";
import NonGstPurchase from "./pages/NonGstPurchase";
import UserManagement from "./pages/UserManagement";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import CreditOutstanding from "./pages/CreditOutstanding";
import TodaySales from "./pages/TodaySales";
import LastMonthSales from "./pages/LastMonthSales";
import LowStock from "./pages/LowStock";
import CreditPayment from "./pages/CreditPayment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id" element={<ProductForm />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/purchases/gst" element={<GstPurchase />} />
            <Route path="/purchases/non-gst" element={<NonGstPurchase />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/credit-outstanding" element={<CreditOutstanding />} />
            <Route path="/today-sales" element={<TodaySales />} />
            <Route path="/last-month-sales" element={<LastMonthSales />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/credit-payment" element={<CreditPayment />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
