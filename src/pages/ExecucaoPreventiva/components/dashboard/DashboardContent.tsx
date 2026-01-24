import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { HistoricoExecucao } from "@/services/historicoExecucoes";
import { FiltroData } from "./dashboardUtils";
import { SecaoPreventivas } from "./SecaoPreventivas";
import { SecaoParadas } from "./SecaoParadas";
import { SecaoOS } from "./SecaoOS";
import { SecaoIndicadores } from "./SecaoIndicadores";
import { SecaoResumo } from "./SecaoResumo";
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
        <div className="sticky top-0 z-10 bg-background pb-2">
          <TabsList className="w-full flex flex-nowrap overflow-x-auto h-auto gap-1 bg-muted border border-border p-1.5 rounded-lg mb-2 shadow-sm">
            <TabsTrigger 
              value="preventivas" 
              className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Manutenções Preventivas</span>
              <span className="sm:hidden">Preventivas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="paradas" 
              className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Paradas de Máquina</span>
              <span className="sm:hidden">Paradas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="os" 
              className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Ordens de Serviço</span>
              <span className="sm:hidden">OS</span>
            </TabsTrigger>
            <TabsTrigger 
              value="indicadores" 
              className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Indicadores Estratégicos</span>
              <span className="sm:hidden">Indicadores</span>
            </TabsTrigger>
            <TabsTrigger 
              value="resumo" 
              className="flex items-center gap-2 flex-shrink-0 px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Resumo / Disponibilidade</span>
              <span className="sm:hidden">Resumo</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
          <SecaoIndicadores
            paradasMaquina={paradasMaquina}
            historicoExecucoes={historicoExecucoes}
            filtro={filtroTabelas}
            onFiltroChange={onFiltroTabelasChange}
          />
        </TabsContent>

        <TabsContent value="resumo">
          <SecaoResumo
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
