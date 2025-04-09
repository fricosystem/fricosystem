
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import NotasFiscais from "./pages/NotasFiscais";
import Relatorios from "./pages/Relatorios";
import Administrativo from "./pages/Administrativo";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("fricoUser") !== null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const NoAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem("fricoUser") !== null;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<NoAuthGuard><Login /></NoAuthGuard>} />
            
            {/* Rotas protegidas */}
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/produtos" element={<AuthGuard><Produtos /></AuthGuard>} />
            <Route path="/notas-fiscais" element={<AuthGuard><NotasFiscais /></AuthGuard>} />
            <Route path="/relatorios" element={<AuthGuard><Relatorios /></AuthGuard>} />
            <Route path="/administrativo" element={<AuthGuard><Administrativo /></AuthGuard>} />
            <Route path="/configuracoes" element={<AuthGuard><Configuracoes /></AuthGuard>} />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
