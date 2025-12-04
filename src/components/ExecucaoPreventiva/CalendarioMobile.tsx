import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarioMobileProps {
  tarefas: TarefaManutencao[];
  onTarefaClick?: (tarefa: TarefaManutencao) => void;
  execucoesPorTarefa?: Record<string, number>;
}

export function CalendarioMobile({ tarefas, onTarefaClick, execucoesPorTarefa = {} }: CalendarioMobileProps) {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const diasDaSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
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
    const diasRestantes = 42 - dias.length;
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
  const getCorIndicador = (tarefa: TarefaManutencao) => {
    if (tarefa.status === "concluida") return "bg-green-500";
    if (tarefa.status === "em_andamento") return "bg-blue-500";
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataExecucao = new Date(tarefa.proximaExecucao);
    
    if (dataExecucao < hoje) return "bg-red-500";
    if (dataExecucao.toDateString() === hoje.toDateString()) return "bg-orange-500";
    return "bg-primary";
  };

  // Dia selecionado
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const tarefasDiaSelecionado = diaSelecionado ? getTarefasDoDia(diaSelecionado) : [];

  return (
    <div className="space-y-4 pb-20">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={mesAnterior}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <h3 className="font-semibold">
                {mesesDoAno[dataAtual.getMonth()]} {dataAtual.getFullYear()}
              </h3>
            </div>
            
            <Button variant="ghost" size="icon" onClick={proximoMes}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="flex-1">
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
        </CardHeader>
        
        <CardContent className="pt-2">
          {/* Grade do Calendário */}
          <div className="grid grid-cols-7 gap-1">
            {/* Cabeçalho dos dias da semana */}
            {diasDaSemana.map((dia, index) => (
              <div key={index} className="text-center font-semibold text-xs py-1 text-muted-foreground">
                {dia}
              </div>
            ))}
            
            {/* Dias do mês */}
            {diasDoMes.map(({ data, mesAtual }, index) => {
              const tarefasDia = getTarefasDoDia(data);
              const ehHoje = data.toDateString() === new Date().toDateString();
              const estaSelecionado = diaSelecionado?.toDateString() === data.toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => setDiaSelecionado(data)}
                  className={`
                    min-h-[50px] p-1 rounded-lg flex flex-col items-center justify-start
                    transition-colors
                    ${mesAtual ? 'bg-background' : 'bg-muted/30'}
                    ${ehHoje ? 'ring-2 ring-primary' : ''}
                    ${estaSelecionado ? 'bg-primary/20' : ''}
                    ${mesAtual ? 'hover:bg-muted' : ''}
                  `}
                >
                  <span className={`
                    text-sm font-medium
                    ${mesAtual ? 'text-foreground' : 'text-muted-foreground'}
                  `}>
                    {data.getDate()}
                  </span>
                  
                  {/* Indicadores de tarefas */}
                  {tarefasDia.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {tarefasDia.slice(0, 3).map((tarefa, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${getCorIndicador(tarefa)}`}
                        />
                      ))}
                      {tarefasDia.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">+{tarefasDia.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Atrasada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Concluída</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tarefas do dia selecionado */}
      {diaSelecionado && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Tarefas em {diaSelecionado.toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tarefasDiaSelecionado.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tarefa neste dia
              </p>
            ) : (
              <div className="space-y-2">
                {tarefasDiaSelecionado.map(tarefa => (
                  <button
                    key={tarefa.id}
                    onClick={() => onTarefaClick?.(tarefa)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getCorIndicador(tarefa)}`} />
                      <span className="font-medium text-sm">{tarefa.maquinaNome}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {tarefa.descricaoTarefa}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {tarefa.manutentorNome}
                      </Badge>
                      {tarefa.sistema && (
                        <Badge variant="secondary" className="text-xs">
                          {tarefa.sistema}
                        </Badge>
                      )}
                      {execucoesPorTarefa[tarefa.id] > 0 && (
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success">
                          {execucoesPorTarefa[tarefa.id]}x
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
