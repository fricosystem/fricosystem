import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// PÃ¡ginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TelaBemVindo from "./pages/TelaBemVindo";
import Produtos from "./pages/Produtos";
import NotasFiscais from "./pages/NotasFiscaisParse";
import Administrativo from "./pages/Administrativo";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";
import Carrinho from "./pages/Carrinho";
import Requisicoes from "./pages/Requisicoes";
import DevolucaoMateriais from "./pages/DevolucaoMateriais";
import Enderecamento from "./pages/Enderecamento";
import OrdensServico from "./pages/OrdensServico";
import Fornecedores from "./pages/Fornecedores";
import ImportarPlanilha from "./pages/ImportarPlanilha";
import MedidaLenha from "./pages/MedidaLenha";
import FornecedorProdutos from "./pages/Fornecedor/FornecedorProdutos";
import NotasFiscaisLancamento from "./pages/NotasFiscaisLancamento";
import PCP from "./pages/PCP/PCP";
import RelatoriosES from "./pages/Relatorios/Relatorios";
import PlanejamentoDesenvolvimento from "./pages/Planejamento/PlanejamentoDesenvolvimento";
import IDE from "./pages/IDE";

// PÃ¡ginas de TransferÃªncia e entrada manual
import EntradaProdutosET from "./pages/EntradaProdutosET";
import TransferenciasET from "./pages/TransferenciasET";

// PÃ¡ginas de Compras e Pedidos
import Compras from "./pages/Compras";
import GestaoProdutos from "./pages/GestaoProdutos";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import CentroCusto from "./pages/CentroCusto";
import Unidades from "./pages/Unidades";

// PÃ¡ginas de comunicaÃ§Ã£o
import ChatPage from "./pages/ChatPage";
import Email from "./pages/Email";
import Reunioes from "./pages/Agendamento";

// PÃ¡ginas de InventÃ¡rio
import Inventario from "./pages/Inventario";

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
          {/* Rotas pÃºblicas */}
          <Route path="/" element={<NoAuthGuard><Login /></NoAuthGuard>} />
          
          {/* Rotas protegidas */}
          <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/bem-vindo" element={<AuthGuard><TelaBemVindo /></AuthGuard>} />
          <Route path="/produtos" element={<AuthGuard><Produtos /></AuthGuard>} />
          <Route path="/inventario" element={<AuthGuard><Inventario /></AuthGuard>} />
          <Route path="/notas-fiscais" element={<AuthGuard><NotasFiscais /></AuthGuard>} />
          <Route path="/administrativo" element={<AuthGuard><Administrativo /></AuthGuard>} />
          <Route path="/perfil" element={<AuthGuard><Perfil /></AuthGuard>} />
          <Route path="/carrinho" element={<AuthGuard><Carrinho /></AuthGuard>} />
          <Route path="/requisicoes" element={<AuthGuard><Requisicoes /></AuthGuard>} />
          <Route path="/devolucao" element={<AuthGuard><DevolucaoMateriais /></AuthGuard>} />
          <Route path="/enderecamento" element={<AuthGuard><Enderecamento /></AuthGuard>} />
          <Route path="/ordensServico" element={<AuthGuard><OrdensServico /></AuthGuard>} />
          <Route path="/fornecedores" element={<AuthGuard><Fornecedores /></AuthGuard>} />
          <Route path="/importar-planilha" element={<AuthGuard><ImportarPlanilha /></AuthGuard>} />
          <Route path="/medida-de-lenha" element={<AuthGuard><MedidaLenha /></AuthGuard>} />
          <Route path="/gestao-produtos" element={<AuthGuard><GestaoProdutos /></AuthGuard>} />
          <Route path="/gestao-usuarios" element={<AuthGuard><GestaoUsuarios /></AuthGuard>} />
          <Route path="/fornecedor-produtos" element={<AuthGuard><FornecedorProdutos /></AuthGuard>} />
          <Route path="/notas-fiscais-lancamento" element={<AuthGuard><NotasFiscaisLancamento /></AuthGuard>} />
          <Route path="/centro-custo" element={<AuthGuard><CentroCusto /></AuthGuard>} />
          <Route path="/unidades" element={<AuthGuard><Unidades /></AuthGuard>} />
           <Route path="/pcp" element={<AuthGuard><PCP /></AuthGuard>} />
           <Route path="/relatorios" element={<AuthGuard><RelatoriosES /></AuthGuard>} />
           <Route path="/planejamento-desenvolvimento" element={<AuthGuard><PlanejamentoDesenvolvimento /></AuthGuard>} />
           <Route path="/ide" element={<AuthGuard><IDE /></AuthGuard>} />

          {/* Rotas de Entrada Manual e TransferÃªncia */}
          <Route path="/entrada-manual" element={<AuthGuard><EntradaProdutosET /></AuthGuard>} />
          <Route path="/transferencia" element={<AuthGuard><TransferenciasET /></AuthGuard>} />

          {/* Rotas de Compras e Pedidos */}
          <Route path="/compras" element={<AuthGuard><Compras /></AuthGuard>} />

          {/* Rotas de ComunicaÃ§Ã£o */}
          <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />
          <Route path="/email" element={<AuthGuard><Email /></AuthGuard>} />
          <Route path="/reunioes" element={<AuthGuard><Reunioes /></AuthGuard>} />
          
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
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;