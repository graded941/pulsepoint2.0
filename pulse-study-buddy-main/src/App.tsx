import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AccessibilityDock from "@/components/AccessibilityDock";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Rooms = lazy(() => import("./pages/Rooms"));
const MySessions = lazy(() => import("./pages/MySessions"));
const Invite = lazy(() => import("./pages/Invite"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { 
      staleTime: 60_000, 
      gcTime: 300_000, 
      refetchOnWindowFocus: false, 
      retry: 1 
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AccessibilityDock />
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/sessions" element={<MySessions />} />
            <Route path="/r/:shortId" element={<Invite />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
