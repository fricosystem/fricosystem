import { useState, useEffect } from "react";
import { BottomNavigation } from "./components/BottomNavigation";
import { DashboardMobile } from "./components/DashboardMobile";
import { TimelineMobile } from "./components/TimelineMobile";
import { CalendarioMobile } from "./components/CalendarioMobile";
import { HistoricoMobile } from "./components/HistoricoMobile";
import { PerfilManutentor } from "./components/PerfilManutentor";
import { ParadasMaquinaMobile } from "./components/ParadasMaquinaMobile";
import { HistoricoParadasMobile } from "./components/HistoricoParadasMobile";
import { OSAbertasMobile } from "./components/OSAbertasMobile";
import { OSHistoricoMobile } from "./components/OSHistoricoMobile";
import { OfflineStatusBar } from "./components/OfflineStatusBar";
import { OfflineSyncProvider } from "@/contexts/OfflineSyncContext";
import { useMinhasTarefas } from "@/hooks/useMinhasTarefas";
import { useBlockBackNavigation } from "@/hooks/useBlockBackNavigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

type TabType = "dashboard" | "timeline" | "calendario" | "historico" | "perfil" | "paradas" | "historico-paradas" | "os-abertas" | "os-historico";

export default function ExecucaoPreventiva() {
  useBlockBackNavigation();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const { tarefas, loading, stats, tarefasHoje, tarefasAtrasadas, historicoExecucoes, execucoesPorTarefa } = useMinhasTarefas();
  const [paradasPendentes, setParadasPendentes] = useState(0);
  const [osPendentes, setOsPendentes] = useState(0);

  useEffect(() => {
    const fetchParadasPendentes = async () => {
      try {
        const paradasRef = collection(db, "paradasMaquina");
        const q = query(paradasRef, where("status", "in", ["pendente", "em_andamento"]));
        const snapshot = await getDocs(q);
        setParadasPendentes(snapshot.size);
      } catch (error) {
        console.error("Erro ao buscar paradas pendentes:", error);
      }
    };

    const fetchOsPendentes = async () => {
      try {
        const osRef = collection(db, "ordens_servicos");
        const q = query(osRef, where("status", "==", "aberta"));
        const snapshot = await getDocs(q);
        setOsPendentes(snapshot.size);
      } catch (error) {
        console.error("Erro ao buscar OS pendentes:", error);
      }
    };

    fetchParadasPendentes();
    fetchOsPendentes();
  }, []);

  const preventivasPendentes = tarefas.filter(t => t.status !== "concluida").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const alertasTotal = stats.atrasadas + stats.hoje;

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "perfil":
        return "Perfil";
      case "paradas":
        return "Paradas de Máquina";
      case "historico-paradas":
        return "Histórico de Paradas";
      case "os-abertas":
        return "Ordens de Serviço";
      case "os-historico":
        return "Histórico de OS";
      default:
        return "Execução Preventiva";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Visão Geral";
      case "perfil":
        return "Minhas Configurações";
      case "paradas":
        return "Execução de Paradas";
      case "historico-paradas":
        return "Paradas Concluídas";
      case "os-abertas":
        return "Abertas para Execução";
      case "os-historico":
        return "OS Concluídas";
      default:
        return "Minhas Manutenções";
    }
  };

  return (
    <OfflineSyncProvider>
      <div className="min-h-screen bg-background">
        {/* Barra de Status Offline */}
        <OfflineStatusBar />

        {/* Header Fixo */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto py-4 px-6 flex items-center gap-3">
            <img src="https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png" alt="APEX HUB" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">{getPageTitle()}</h1>
              <p className="text-xs text-muted-foreground">{getPageSubtitle()}</p>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="container mx-auto px-4 py-4">
          {activeTab === "dashboard" && (
            <DashboardMobile
              stats={stats}
              tarefasHoje={tarefasHoje}
              tarefasAtrasadas={tarefasAtrasadas}
              execucoesPorTarefa={execucoesPorTarefa}
              tarefas={tarefas}
              historicoExecucoes={historicoExecucoes}
            />
          )}

          {activeTab === "timeline" && <TimelineMobile tarefas={tarefas} execucoesPorTarefa={execucoesPorTarefa} historicoExecucoes={historicoExecucoes} />}

          {activeTab === "perfil" && <PerfilManutentor stats={stats} />}

          {activeTab === "paradas" && <ParadasMaquinaMobile />}

          {activeTab === "historico-paradas" && <HistoricoParadasMobile />}

          {activeTab === "os-abertas" && <OSAbertasMobile />}

          {activeTab === "os-historico" && <OSHistoricoMobile />}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          badgeCounts={{
            preventivas: preventivasPendentes,
            paradas: paradasPendentes,
            os: osPendentes
          }}
        />
      </div>
    </OfflineSyncProvider>
  );
}
