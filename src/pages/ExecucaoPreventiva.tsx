import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/ExecucaoPreventiva/BottomNavigation";
import { DashboardMobile } from "@/components/ExecucaoPreventiva/DashboardMobile";
import { TimelineMobile } from "@/components/ExecucaoPreventiva/TimelineMobile";
import { CalendarioMobile } from "@/components/ExecucaoPreventiva/CalendarioMobile";
import { HistoricoMobile } from "@/components/ExecucaoPreventiva/HistoricoMobile";
import { PerfilManutentor } from "@/components/ExecucaoPreventiva/PerfilManutentor";
import { ParadasMaquinaMobile } from "@/components/ExecucaoPreventiva/ParadasMaquinaMobile";
import { HistoricoParadasMobile } from "@/components/ExecucaoPreventiva/HistoricoParadasMobile";
import { useMinhasTarefas } from "@/hooks/useMinhasTarefas";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

type TabType = "dashboard" | "timeline" | "calendario" | "historico" | "perfil" | "paradas" | "historico-paradas";

export default function ExecucaoPreventiva() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const { tarefas, loading, stats, tarefasHoje, tarefasAtrasadas, historicoExecucoes, execucoesPorTarefa } = useMinhasTarefas();
  const [paradasPendentes, setParadasPendentes] = useState(0);

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
    fetchParadasPendentes();
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
      case "paradas":
        return "Paradas de Máquina";
      case "historico-paradas":
        return "Histórico de Paradas";
      default:
        return "Execução Preventiva";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "paradas":
        return "Execução de Paradas";
      case "historico-paradas":
        return "Paradas Concluídas";
      default:
        return "Minhas Manutenções";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">{getPageTitle()}</h1>
            <p className="text-xs text-muted-foreground">{getPageSubtitle()}</p>
          </div>
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell className="h-5 w-5" />
            {alertasTotal > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {alertasTotal}
              </Badge>
            )}
          </Button>
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

        {activeTab === "timeline" && <TimelineMobile tarefas={tarefas} execucoesPorTarefa={execucoesPorTarefa} />}

        {activeTab === "calendario" && <CalendarioMobile tarefas={tarefas} execucoesPorTarefa={execucoesPorTarefa} />}

        {activeTab === "historico" && <HistoricoMobile historicoExecucoes={historicoExecucoes} />}

        {activeTab === "perfil" && <PerfilManutentor stats={stats} />}

        {activeTab === "paradas" && <ParadasMaquinaMobile />}

        {activeTab === "historico-paradas" && <HistoricoParadasMobile />}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        badgeCounts={{
          preventivas: preventivasPendentes,
          paradas: paradasPendentes
        }}
      />
    </div>
  );
}
