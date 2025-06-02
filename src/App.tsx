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
import Fornecedores from "./pages/Fornecedores";
import ImportarPlanilha from "./pages/ImportarPlanilha";
import MedidaLenha from "./pages/MedidaLenha";
import FornecedorProdutos from "./pages/Fornecedor/FornecedorProdutos";

// Páginas de Transferência e entrada manual
import EntradaProdutosET from "./pages/EntradaProdutosET";
import TransferenciasET from "./pages/TransferenciasET";

// Páginas de Compras e Pedidos
import Compras from "./pages/Compras";
import GestaoProdutos from "./pages/GestaoProdutos";

// Páginas de Produção
import DashboardProducao from "./pages/Producao/DashboardProducao";
import PlanejamentoProducao from "./pages/Producao/PlanejamentoProducao";
import PlanejamentoDiarioProducao from "./pages/Producao/PlanejamentoDiarioProducao";
import ProdutosProducao from "./pages/Producao/ProdutosProducao";
import ProdutosFinaisProducao from "./pages/Producao/ProdutosFinaisProducao";

// Páginas de comunicação
import ChatPage from "./pages/ChatPage";

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
          <Route path="/fornecedores" element={<AuthGuard><Fornecedores /></AuthGuard>} />
          <Route path="/importar-planilha" element={<AuthGuard><ImportarPlanilha /></AuthGuard>} />
          <Route path="/medida-de-lenha" element={<AuthGuard><MedidaLenha /></AuthGuard>} />
          <Route path="/gestao-produtos" element={<AuthGuard><GestaoProdutos /></AuthGuard>} />
          <Route path="/fornecedor-produtos" element={<AuthGuard><FornecedorProdutos /></AuthGuard>} />

          {/* Rotas de Entrada Manual e Transferência */}
          <Route path="/entrada-manual" element={<AuthGuard><EntradaProdutosET /></AuthGuard>} />
          <Route path="/transferencia" element={<AuthGuard><TransferenciasET /></AuthGuard>} />

          {/* Rotas de Compras e Pedidos */}
          <Route path="/compras" element={<AuthGuard><Compras /></AuthGuard>} />

          {/* Rotas de Produção */}
          <Route path="/producao" element={<AuthGuard><DashboardProducao /></AuthGuard>} />
          <Route path="/producao/planejamento" element={<AuthGuard><PlanejamentoProducao /></AuthGuard>} />
          <Route path="/producao/planejamentoDiarioProducao" element={<AuthGuard><PlanejamentoDiarioProducao /></AuthGuard>} />
          <Route path="/producao/produtosProducao" element={<AuthGuard><ProdutosProducao /></AuthGuard>} />
          <Route path="/producao/produtosFinaisProducao" element={<AuthGuard><ProdutosFinaisProducao /></AuthGuard>} />

          {/* Rotas de Comunicação */}
          <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />
          
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