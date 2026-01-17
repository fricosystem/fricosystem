import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { FiltroData } from "./dashboardUtils";
import { SecaoPreventivas } from "./SecaoPreventivas";
import { SecaoParadas } from "./SecaoParadas";
import { SecaoOS } from "./SecaoOS";
import { TabelasResumo } from "./TabelasResumo";
import { SecaoDashboard } from "./dashboardUtils";
import { ParadaMaquinaData, SetorData } from "./hooks/useDashboardData";
import { SectionRefs } from "./hooks/useDashboardNavigation";
import { Wrench, AlertTriangle, ClipboardList, Target, BarChart3 } from "lucide-react";

interface DashboardContentProps {
  tarefas: TarefaManutencao[];
  historicoExecucoes: HistoricoExecucao[];
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
  paradasMaquina: ParadaMaquinaData[];
  setores: SetorData[];
  ordensServico: any[];
  ordensFinalizadas: any[];
  filtroPreventivas: FiltroData;
  onFiltroPreventivesChange: (filtro: FiltroData) => void;
  filtroParadas: FiltroData;
  onFiltroParadasChange: (filtro: FiltroData) => void;
  filtroOS: FiltroData;
  onFiltroOSChange: (filtro: FiltroData) => void;
  filtroTabelas: FiltroData;
  onFiltroTabelasChange: (filtro: FiltroData) => void;
  sectionRefs: SectionRefs;
  activeSection: SecaoDashboard;
  onNavigate: (sectionId: SecaoDashboard) => void;
}

export function DashboardContent({
  tarefas,
  historicoExecucoes,
  stats,
  paradasMaquina,
  setores,
  ordensServico,
  ordensFinalizadas,
  filtroPreventivas,
  onFiltroPreventivesChange,
  filtroParadas,
  onFiltroParadasChange,
  filtroOS,
  onFiltroOSChange,
  filtroTabelas,
  onFiltroTabelasChange,
}: DashboardContentProps) {
  return (
    <div className="pb-4">
      <Tabs defaultValue="preventivas" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg mb-4">
          <TabsTrigger value="preventivas" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Manutenções Preventivas</span>
            <span className="sm:hidden">Preventivas</span>
          </TabsTrigger>
          <TabsTrigger value="paradas" className="flex items-center gap-2 data-[state=active]:bg-background">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Paradas de Máquina</span>
            <span className="sm:hidden">Paradas</span>
          </TabsTrigger>
          <TabsTrigger value="os" className="flex items-center gap-2 data-[state=active]:bg-background">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Ordens de Serviço</span>
            <span className="sm:hidden">OS</span>
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Indicadores Estratégicos</span>
            <span className="sm:hidden">Indicadores</span>
          </TabsTrigger>
          <TabsTrigger value="resumo" className="flex items-center gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumo / Disponibilidade</span>
            <span className="sm:hidden">Resumo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preventivas">
          <SecaoPreventivas
            tarefas={tarefas}
            historicoExecucoes={historicoExecucoes}
            stats={stats}
            filtro={filtroPreventivas}
            onFiltroChange={onFiltroPreventivesChange}
          />
        </TabsContent>

        <TabsContent value="paradas">
          <SecaoParadas
            paradasMaquina={paradasMaquina}
            filtro={filtroParadas}
            onFiltroChange={onFiltroParadasChange}
          />
        </TabsContent>

        <TabsContent value="os">
          <SecaoOS
            ordensServico={ordensServico}
            ordensFinalizadas={ordensFinalizadas}
            filtro={filtroOS}
            onFiltroChange={onFiltroOSChange}
          />
        </TabsContent>

        <TabsContent value="indicadores">
          <TabelasResumo
            paradasMaquina={paradasMaquina}
            setores={setores}
            historicoExecucoes={historicoExecucoes}
            filtro={filtroTabelas}
            onFiltroChange={onFiltroTabelasChange}
          />
        </TabsContent>

        <TabsContent value="resumo">
          <TabelasResumo
            paradasMaquina={paradasMaquina}
            setores={setores}
            historicoExecucoes={historicoExecucoes}
            filtro={filtroTabelas}
            onFiltroChange={onFiltroTabelasChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
