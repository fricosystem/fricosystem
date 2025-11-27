import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarioManutencaoProps {
  tarefas: TarefaManutencao[];
  onTarefaClick?: (tarefa: TarefaManutencao) => void;
}

export function CalendarioManutencao({ tarefas, onTarefaClick }: CalendarioManutencaoProps) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<"mensal" | "semanal">("mensal");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const mesesDoAno = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Obter tipos únicos de manutenção
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(tarefas.map(t => t.tipo));
    return Array.from(tipos);
  }, [tarefas]);

  // Filtrar tarefas
  const tarefasFiltradas = useMemo(() => {
    if (filtroTipo === "todos") return tarefas;
    return tarefas.filter(t => t.tipo === filtroTipo);
  }, [tarefas, filtroTipo]);

  // Gerar dias do mês
  const diasDoMes = useMemo(() => {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    
    const dias = [];
    const diaSemanaInicio = primeiroDia.getDay();
    
    // Adicionar dias do mês anterior
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const dia = new Date(ano, mes, -i);
      dias.push({ data: dia, mesAtual: false });
    }
    
    // Adicionar dias do mês atual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const data = new Date(ano, mes, dia);
      dias.push({ data, mesAtual: true });
    }
    
    // Adicionar dias do próximo mês para completar a grade
    const diasRestantes = 42 - dias.length; // 6 semanas * 7 dias
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const data = new Date(ano, mes + 1, dia);
      dias.push({ data, mesAtual: false });
    }
    
    return dias;
  }, [dataAtual]);

  // Obter tarefas de um dia específico
  const getTarefasDoDia = (data: Date) => {
    const dataStr = data.toISOString().split('T')[0];
    return tarefasFiltradas.filter(t => t.proximaExecucao === dataStr);
  };

  // Navegação
  const proximoMes = () => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setDataAtual(new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1));
  };

  const voltarHoje = () => {
    setDataAtual(new Date());
  };

  // Cor da tarefa por status
  const getCorTarefa = (tarefa: TarefaManutencao) => {
    if (tarefa.status === "concluida") return "bg-green-500";
    if (tarefa.status === "em_andamento") return "bg-blue-500";
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataExecucao = new Date(tarefa.proximaExecucao);
    
    if (dataExecucao < hoje) return "bg-red-500";
    if (dataExecucao.toDateString() === hoje.toDateString()) return "bg-orange-500";
    return "bg-primary";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendário de Manutenções
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tiposUnicos.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={voltarHoje}>
              Hoje
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="icon" onClick={mesAnterior}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {mesesDoAno[dataAtual.getMonth()]} {dataAtual.getFullYear()}
          </h3>
          
          <Button variant="outline" size="icon" onClick={proximoMes}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Grade do Calendário */}
        <div className="grid grid-cols-7 gap-2">
          {/* Cabeçalho dos dias da semana */}
          {diasDaSemana.map(dia => (
            <div key={dia} className="text-center font-semibold text-sm py-2">
              {dia}
            </div>
          ))}
          
          {/* Dias do mês */}
          {diasDoMes.map(({ data, mesAtual }, index) => {
            const tarefasDia = getTarefasDoDia(data);
            const ehHoje = data.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border rounded-lg
                  ${mesAtual ? 'bg-background' : 'bg-muted/30'}
                  ${ehHoje ? 'ring-2 ring-primary' : ''}
                `}
              >
                <div className={`
                  text-sm font-medium mb-1
                  ${mesAtual ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {data.getDate()}
                </div>
                
                <div className="space-y-1">
                  {tarefasDia.slice(0, 3).map(tarefa => (
                    <div
                      key={tarefa.id}
                      onClick={() => onTarefaClick?.(tarefa)}
                      className={`
                        ${getCorTarefa(tarefa)}
                        text-white text-xs p-1 rounded cursor-pointer
                        hover:opacity-80 transition-opacity
                        truncate
                      `}
                      title={`${tarefa.maquinaNome} - ${tarefa.descricaoTarefa}`}
                    >
                      {tarefa.maquinaNome}
                    </div>
                  ))}
                  
                  {tarefasDia.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{tarefasDia.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-sm">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Atrasada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm">Em Andamento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Concluída</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
