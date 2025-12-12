import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ManutencaoAlertsProvider } from "@/contexts/ManutencaoAlertsContext";
import { EquipamentosProvider } from "@/contexts/EquipamentosContext";

// Páginas
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
import ParadaMaquina from "./pages/ParadaMaquina";
import Fornecedores from "./pages/Fornecedores";
import ImportarPlanilha from "./pages/ImportarPlanilha";
import MedidaLenha from "./pages/MedidaLenha";
import FornecedorProdutos from "./pages/Fornecedor/FornecedorProdutos";
import NotasFiscaisLancamento from "./pages/NotasFiscaisLancamento";
import PCP from "./pages/PCP/PCP";
import RelatoriosES from "./pages/Relatorios/Relatorios";
import PlanejamentoDesenvolvimento from "./pages/Planejamento/PlanejamentoDesenvolvimento";
import IDE from "./pages/IDE";

// Páginas de Transferência e entrada manual
import EntradaProdutosET from "./pages/EntradaProdutosET";
import TransferenciasET from "./pages/TransferenciasET";

// Páginas de Compras e Pedidos
import Compras from "./pages/Compras";
import GestaoProdutos from "./pages/GestaoProdutos";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import GestaoPerfis from "./pages/GestaoPerfis";
import CentroCusto from "./pages/CentroCusto";
import Unidades from "./pages/Unidades";
import Maquinas from "./pages/Maquinas";
import Setores from "./pages/Setores";
import GestaoSetores from "./pages/GestaoSetores";
import MaquinaDetalhes from "./pages/MaquinaDetalhes";
import ManutencoesDashboard from "./pages/ManutencoesDashboard";
import ManutencaoPreventiva from "./pages/ManutencaoPreventiva";
import GestaoTarefas from "./pages/GestaoTarefas";
import ExecucaoPreventiva from "./pages/ExecucaoPreventiva";
import { ManutentorGuard } from "./guards/ManutentorGuard";

// Páginas de comunicação
import ChatPage from "./pages/ChatPage";
import Email from "./pages/Email";
import Reunioes from "./pages/Agendamento";

// Páginas de Inventário
import Inventario from "./pages/Inventario";

// Página de Manuais
import Manuais from "./pages/Manuais";

// Create a client
const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  
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

  // Verifica se o usuário está ativo - se não, redireciona para página de aguardar aprovação
  const isActive = userData?.ativo === "sim";
  const isWelcomePage = location.pathname === "/bem-vindo";

  if (!isActive && !isWelcomePage) {
    return <Navigate to="/bem-vindo" replace />;
  }

  // Se está ativo e tentando acessar a página de bem-vindo, redireciona para dashboard
  if (isActive && isWelcomePage) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const NoAuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useAuth();

  // Show loading when auth state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    // Verifica se o usuário está ativo antes de redirecionar
    const isActive = userData?.ativo === "sim";
    return <Navigate to={isActive ? "/dashboard" : "/bem-vindo"} replace />;
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
          <Route path="/parada-maquina" element={<AuthGuard><ParadaMaquina /></AuthGuard>} />
          <Route path="/fornecedores" element={<AuthGuard><Fornecedores /></AuthGuard>} />
          <Route path="/importar-planilha" element={<AuthGuard><ImportarPlanilha /></AuthGuard>} />
          <Route path="/medida-de-lenha" element={<AuthGuard><MedidaLenha /></AuthGuard>} />
          <Route path="/gestao-produtos" element={<AuthGuard><GestaoProdutos /></AuthGuard>} />
          <Route path="/gestao-usuarios" element={<AuthGuard><GestaoUsuarios /></AuthGuard>} />
          <Route path="/gestao-perfis" element={<AuthGuard><GestaoPerfis /></AuthGuard>} />
          <Route path="/fornecedor-produtos" element={<AuthGuard><FornecedorProdutos /></AuthGuard>} />
          <Route path="/notas-fiscais-lancamento" element={<AuthGuard><NotasFiscaisLancamento /></AuthGuard>} />
          <Route path="/centro-custo" element={<AuthGuard><CentroCusto /></AuthGuard>} />
          <Route path="/unidades" element={<AuthGuard><Unidades /></AuthGuard>} />
          <Route path="/setores" element={<AuthGuard><Setores /></AuthGuard>} />
          <Route path="/gestao-manutencao" element={<AuthGuard><GestaoSetores /></AuthGuard>} />
          <Route path="/maquinas" element={<AuthGuard><Maquinas /></AuthGuard>} />
          <Route path="/maquinas/:id" element={<AuthGuard><MaquinaDetalhes /></AuthGuard>} />
          <Route path="/dashboard-manutencao" element={<AuthGuard><ManutencoesDashboard /></AuthGuard>} />
          <Route path="/manutencao-preventiva" element={<AuthGuard><ManutencaoPreventiva /></AuthGuard>} />
          <Route path="/execucao-preventiva" element={<AuthGuard><ManutentorGuard><ExecucaoPreventiva /></ManutentorGuard></AuthGuard>} />
          <Route path="/gestao-tarefas" element={<AuthGuard><GestaoTarefas /></AuthGuard>} />
           <Route path="/pcp" element={<AuthGuard><PCP /></AuthGuard>} />
           <Route path="/relatorios" element={<AuthGuard><RelatoriosES /></AuthGuard>} />
           <Route path="/planejamento-desenvolvimento" element={<AuthGuard><PlanejamentoDesenvolvimento /></AuthGuard>} />
           <Route path="/ide" element={<AuthGuard><IDE /></AuthGuard>} />

           {/* Rotas de Entrada Manual e Transferência */}
          <Route path="/entrada-manual" element={<AuthGuard><EntradaProdutosET /></AuthGuard>} />
          <Route path="/transferencia" element={<AuthGuard><TransferenciasET /></AuthGuard>} />

          {/* Rotas de Compras e Pedidos */}
          <Route path="/compras" element={<AuthGuard><Compras /></AuthGuard>} />

          {/* Rotas de Comunicação */}
          <Route path="/chat" element={<AuthGuard><ChatPage /></AuthGuard>} />
          <Route path="/email" element={<AuthGuard><Email /></AuthGuard>} />
          <Route path="/reunioes" element={<AuthGuard><Reunioes /></AuthGuard>} />
          
          {/* Manuais */}
          <Route path="/manuais" element={<AuthGuard><Manuais /></AuthGuard>} />
          
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
          <ManutencaoAlertsProvider>
            <EquipamentosProvider>
              <AppContent />
            </EquipamentosProvider>
          </ManutencaoAlertsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;