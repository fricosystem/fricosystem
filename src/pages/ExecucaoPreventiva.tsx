import { useState } from "react";
import { BottomNavigation } from "@/components/ExecucaoPreventiva/BottomNavigation";
import { DashboardMobile } from "@/components/ExecucaoPreventiva/DashboardMobile";
import { TimelineMobile } from "@/components/ExecucaoPreventiva/TimelineMobile";
import { CalendarioMobile } from "@/components/ExecucaoPreventiva/CalendarioMobile";
import { HistoricoMobile } from "@/components/ExecucaoPreventiva/HistoricoMobile";
import { PerfilManutentor } from "@/components/ExecucaoPreventiva/PerfilManutentor";
import { useMinhasTarefas } from "@/hooks/useMinhasTarefas";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExecucaoPreventiva() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "timeline" | "calendario" | "historico" | "perfil">("dashboard");
  const { tarefas, loading, stats, tarefasHoje, tarefasAtrasadas, historicoExecucoes, execucoesPorTarefa } = useMinhasTarefas();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const alertasTotal = stats.atrasadas + stats.hoje;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Execução Preventiva</h1>
            <p className="text-xs text-muted-foreground">Minhas Manutenções</p>
          </div>
          <Button variant="ghost" size="icon" className="relative">
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
          />
        )}

        {activeTab === "timeline" && <TimelineMobile tarefas={tarefas} execucoesPorTarefa={execucoesPorTarefa} />}

        {activeTab === "calendario" && <CalendarioMobile tarefas={tarefas} execucoesPorTarefa={execucoesPorTarefa} />}

        {activeTab === "historico" && <HistoricoMobile historicoExecucoes={historicoExecucoes} />}

        {activeTab === "perfil" && <PerfilManutentor stats={stats} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
