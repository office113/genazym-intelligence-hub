import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StatusThresholdsProvider } from "@/contexts/StatusThresholdsContext";
import { CustomerCardProvider } from "@/contexts/CustomerCardContext";
import CustomerCard from "@/components/customers/CustomerCard";
import AppLayout from "@/components/layout/AppLayout";
import PastSales from "@/pages/PastSales";
import CurrentSale from "@/pages/CurrentSale";
import Targeting from "@/pages/Targeting";
import Customers from "@/pages/Customers";
import Consignors from "@/pages/Consignors";
import Registrants from "@/pages/Registrants";
import Books from "@/pages/Books";
import Activity from "@/pages/Activity";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StatusThresholdsProvider>
      <CustomerCardProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/current-sale" replace />} />
                <Route path="/past-sales" element={<PastSales />} />
                <Route path="/current-sale" element={<CurrentSale />} />
                <Route path="/targeting" element={<Targeting />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/consignors" element={<Consignors />} />
                <Route path="/registrants" element={<Registrants />} />
                <Route path="/books" element={<Books />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
            <CustomerCard />
          </BrowserRouter>
        </TooltipProvider>
      </CustomerCardProvider>
    </StatusThresholdsProvider>
  </QueryClientProvider>
);

export default App;
