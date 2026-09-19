import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Users, Calendar, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoManutentorModal } from "./HistoricoManutentorModal";
import { 
  getProximosManutentoresComMotivo, 
  ManutentorComCarga,
  getCorCarga 
} from "@/services/rodizioManutentores";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProximosManutentoresProps {
  tarefas: TarefaManutencao[];
}

interface ManutentorProximo extends ManutentorComCarga {
  proximaTarefa?: TarefaManutencao;
}

export function ProximosManutentores({ tarefas }: ProximosManutentoresProps) {
  const [manutentorSelecionado, setManutentorSelecionado] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [manutentoresComCarga, setManutentoresComCarga] = useState<ManutentorProximo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadManutentoresComCarga();
  }, [tarefas]);

  const loadManutentoresComCarga = async () => {
    try {
      setLoading(true);
      const manutentores = await getProximosManutentoresComMotivo();
      
      // Associar próxima tarefa a cada manutentor
      const tarefasPendentes = tarefas.filter(
        t => t.status === "pendente" || t.status === "em_andamento"
      );
      
      const manutentoresComTarefas: ManutentorProximo[] = manutentores.map(m => {
        const tarefasDoManutentor = tarefasPendentes
          .filter(t => t.manutentorId === m.id)
          .sort((a, b) => new Date(a.proximaExecucao).getTime() - new Date(b.proximaExecucao).getTime());
        
        return {
          ...m,
          proximaTarefa: tarefasDoManutentor[0]
        };
      });
      
      setManutentoresComCarga(manutentoresComTarefas);
    } catch (error) {
      console.error("Erro ao carregar manutentores:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case "critica": return "destructive";
      case "alta": return "default";
      case "media": return "secondary";
      case "baixa": return "outline";
      default: return "secondary";
    }
  };

  const getPrioridadeLabel = (prioridade?: string) => {
    switch (prioridade) {
      case "critica": return "Crítica";
      case "alta": return "Alta";
      case "media": return "Média";
      case "baixa": return "Baixa";
      default: return "Média";
    }
  };

  const handleManutentorClick = (manutentorId: string) => {
    setManutentorSelecionado(manutentorId);
    setModalOpen(true);
  };

  const getProgressValue = (tarefasPendentes: number): number => {
    // Máximo de 10 para a barra de progresso
    return Math.min((tarefasPendentes / 10) * 100, 100);
  };

  const getNivelCargaIcon = (nivel: "baixa" | "media" | "alta") => {
    switch (nivel) {
      case "baixa":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "media":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "alta":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Próximos Manutentores em Ação
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Manutentores ordenados por menor carga de trabalho. A cor indica o nível de carga atual.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Carregando...</p>
            </div>
          ) : manutentoresComCarga.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum manutentor cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {manutentoresComCarga.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleManutentorClick(item.id)}
                  className="flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Cabeçalho com nome e indicador de carga */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getNivelCargaIcon(item.nivelCarga)}
                      <p className="font-medium text-primary">
                        {item.nome}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.funcao}
                    </Badge>
                  </div>
                  
                  {/* Barra de carga visual */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Carga de trabalho</span>
                      <span>{item.tarefasPendentes} pendente(s)</span>
                    </div>
                    <Progress 
                      value={getProgressValue(item.tarefasPendentes)} 
                      className={`h-2 ${
                        item.nivelCarga === "baixa" ? "[&>div]:bg-green-500" :
                        item.nivelCarga === "media" ? "[&>div]:bg-yellow-500" :
                        "[&>div]:bg-red-500"
                      }`}
                    />
                  </div>

                  {/* Motivo da seleção */}
                  <div className="bg-muted/50 rounded px-2 py-1.5 mb-2">
                    <p className="text-xs text-muted-foreground">
                      📊 {item.motivoSelecao}
                    </p>
                  </div>

                  {/* Próxima tarefa (se houver) */}
                  {item.proximaTarefa ? (
                    <div className="mt-auto">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Próxima: {format(new Date(item.proximaTarefa.proximaExecucao), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant={getPrioridadeColor(item.proximaTarefa.prioridade)}>
                          {getPrioridadeLabel(item.proximaTarefa.prioridade)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.proximaTarefa.tipo}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                        {item.proximaTarefa.maquinaNome}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-auto text-xs text-muted-foreground italic">
                      Sem tarefas agendadas
                    </div>
                  )}

                  {/* Alerta de sobrecarga */}
                  {item.nivelCarga === "alta" && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Atenção: manutentor com alta carga</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {manutentorSelecionado && (
        <HistoricoManutentorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          manutentorId={manutentorSelecionado}
          tarefas={tarefas}
        />
      )}
    </TooltipProvider>
  );
}
