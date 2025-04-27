import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import NotasFiscais from "./pages/NotasFiscais";
import Relatorios from "./pages/Relatorios";
import Administrativo from "./pages/Administrativo";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Carrinho from "./pages/Carrinho";
import Requisicoes from "./pages/Requisicoes";
import Enderecamento from "./pages/Enderecamento";
import OrdensServico from "./pages/OrdensServico";

// Páginas de Produção
import DashboardProducao from "@/pages/Producao/DashboardProducao";
import PlanejamentoProducao from "@/pages/Producao/PlanejamentoProducao";
import FuncionariosProducao from "@/pages/Producao/FuncionariosProducao";

// Create a client
const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // Show loading when auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const NoAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Show loading when auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  return (
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
          <Route path="/carrinho" element={<AuthGuard><Carrinho /></AuthGuard>} />
          <Route path="/requisicoes" element={<AuthGuard><Requisicoes /></AuthGuard>} />
          <Route path="/enderecamento" element={<AuthGuard><Enderecamento /></AuthGuard>} />
          <Route path="/ordensServico" element={<AuthGuard><OrdensServico /></AuthGuard>} />
          
          {/* Rotas de Produção */}
          <Route path="/producao" element={<AuthGuard><DashboardProducao /></AuthGuard>} />
          <Route path="/producao/planejamento" element={<AuthGuard><PlanejamentoProducao /></AuthGuard>} />
          <Route path="/producao/funcionarios" element={<AuthGuard><FuncionariosProducao /></AuthGuard>} />
          
          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;