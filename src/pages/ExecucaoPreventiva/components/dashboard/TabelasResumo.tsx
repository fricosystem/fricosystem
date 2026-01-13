import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gauge, Timer, Wrench, Clock, BarChart3, Target, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DashboardFilters } from "./DashboardFilters";
import { 
  FiltroData, 
  filtrarPorPeriodo, 
  calcularDisponibilidade, 
  getTempoDisponivelMinutos,
  getTempoParadaReal,
  formatarTempoHMS,
  timestampToDate,
  getDatasSemanaAtual,
  getDatasPeriodo
} from "./dashboardUtils";
import { Separator } from "@/components/ui/separator";

interface ParadaMaquinaData {
  id: string;
  setor: string;
  equipamento: string;
  tipoManutencao: string;
  status: string;
  tempoParada?: number;
  criadoEm?: any;
  finalizadoEm?: any;
}

interface SetorData {
  id: string;
  nome: string;
  unidade: string;
  status: string;
}

interface HistoricoExecucao {
  dataExecucao?: any;
  tempoRealizado?: number;
}

interface TabelasResumoProps {
  paradasMaquina: ParadaMaquinaData[];
  setores: SetorData[];
  historicoExecucoes: HistoricoExecucao[];
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
}

export function TabelasResumo({ 
  paradasMaquina, 
  setores, 
  historicoExecucoes,
  filtro, 
  onFiltroChange 
}: TabelasResumoProps) {
  const tempoDisponivel = getTempoDisponivelMinutos(filtro);
  
  // Filtra paradas por período
  const paradasFiltradas = filtrarPorPeriodo(
    paradasMaquina,
    filtro,
    (parada) => parada.criadoEm
  );

  // Filtra execuções para semana atual (para tabela de dia da semana)
  const { inicio: inicioSemana, fim: fimSemana } = getDatasSemanaAtual();

  // ============ TABELA 1: DISPONIBILIDADE POR SETOR ============
  const disponibilidadePorSetor = () => {
    const setorData: Record<string, { 
      tempoParada: number; 
      abertas: number; 
      fechadas: number; 
      total: number;
    }> = {};

    // Inicializa com setores conhecidos
    setores.forEach(s => {
      setorData[s.nome] = { tempoParada: 0, abertas: 0, fechadas: 0, total: 0 };
    });

    // Processa paradas
    paradasFiltradas.forEach(p => {
      const setor = p.setor || "Outros";
      if (!setorData[setor]) {
        setorData[setor] = { tempoParada: 0, abertas: 0, fechadas: 0, total: 0 };
      }
      
      // Calcula tempo de parada real usando a nova função
      const tempo = getTempoParadaReal(p);
      setorData[setor].tempoParada += tempo;
      setorData[setor].total++;
      
      if (p.status === "concluido") {
        setorData[setor].fechadas++;
      } else {
        setorData[setor].abertas++;
      }
    });

    return Object.entries(setorData)
      .filter(([_, data]) => data.total > 0)
      .map(([setor, data]) => {
        // Disponibilidade baseada em tempo real de paradas
        const disponibilidade = calcularDisponibilidade(data.tempoParada, tempoDisponivel, true);
        // Disponibilidade de máquina (considera 90% do tempo como produtivo)
        const dispMaquina = calcularDisponibilidade(data.tempoParada, tempoDisponivel * 0.9, true);
        return {
          setor,
          disponibilidade: disponibilidade.toFixed(2),
          dispMaquina: dispMaquina.toFixed(2),
          dispGeral: disponibilidade.toFixed(2),
          abertas: data.abertas,
          fechadas: data.fechadas,
          qtdParadas: data.total,
          tempoParada: data.tempoParada
        };
      })
      .sort((a, b) => b.qtdParadas - a.qtdParadas);
  };

  // ============ TABELA 2: TEMPO DE PARADA POR SETOR ============
  const tempoParadaPorSetor = () => {
    const setorData: Record<string, { 
      tempo: number; 
      count: number;
      abertas: number;
      fechadas: number;
    }> = {};

    paradasFiltradas.forEach(p => {
      const setor = p.setor || "Outros";
      if (!setorData[setor]) {
        setorData[setor] = { tempo: 0, count: 0, abertas: 0, fechadas: 0 };
      }
      
      // Calcula tempo de parada real usando a nova função
      const tempo = getTempoParadaReal(p);
      setorData[setor].tempo += tempo;
      setorData[setor].count++;
      
      if (p.status === "concluido") {
        setorData[setor].fechadas++;
      } else {
        setorData[setor].abertas++;
      }
    });

    return Object.entries(setorData)
      .map(([setor, data]) => {
        const disponibilidade = calcularDisponibilidade(data.tempo, tempoDisponivel, true);
        return {
          setor,
          disponibilidade: disponibilidade.toFixed(2),
          abertas: data.abertas,
          fechadas: data.fechadas,
          tempoParada: formatarTempoHMS(data.tempo),
          tempoParadaMinutos: data.tempo,
          qtdParadas: data.count,
          mediaParada: formatarTempoHMS(data.count > 0 ? data.tempo / data.count : 0)
        };
      })
      .sort((a, b) => b.qtdParadas - a.qtdParadas);
  };

  // ============ TABELA 3: TIPOS DE MANUTENÇÃO (SEMANA ATUAL) ============
  const tiposManutencaoSemana = () => {
    const tipoData: Record<string, { count: number; tempo: number; abertas: number; fechadas: number }> = {};

    paradasMaquina
      .filter(p => {
        const data = timestampToDate(p.criadoEm);
        return data && data >= inicioSemana && data <= fimSemana;
      })
      .forEach(p => {
        const tipo = p.tipoManutencao || "(vazio)";
        if (!tipoData[tipo]) {
          tipoData[tipo] = { count: 0, tempo: 0, abertas: 0, fechadas: 0 };
        }
        tipoData[tipo].count++;
        
        // Usa a nova função para calcular tempo real
        const tempo = getTempoParadaReal(p);
        tipoData[tipo].tempo += tempo;
        
        if (p.status === "concluido") {
          tipoData[tipo].fechadas++;
        } else {
          tipoData[tipo].abertas++;
        }
      });

    return Object.entries(tipoData)
      .map(([tipo, data]) => ({
        tipo,
        contagem: data.count,
        abertas: data.abertas,
        fechadas: data.fechadas,
        tempoGasto: formatarTempoHMS(data.tempo)
      }))
      .sort((a, b) => b.contagem - a.contagem);
  };

  // ============ TABELA 4: EXECUÇÕES POR DIA DA SEMANA (SEMANA ATUAL) ============
  const execucoesPorDiaSemana = () => {
    const diasSemana = [0, 0, 0, 0, 0, 0, 0]; // Dom, Seg, Ter, Qua, Qui, Sex, Sab
    const diasParadas = [0, 0, 0, 0, 0, 0, 0];
    const diasTempo = [0, 0, 0, 0, 0, 0, 0];

    historicoExecucoes.forEach(exec => {
      const data = timestampToDate(exec.dataExecucao);
      if (data && data >= inicioSemana && data <= fimSemana) {
        diasSemana[data.getDay()]++;
      }
    });

    paradasMaquina.forEach(p => {
      const data = timestampToDate(p.criadoEm);
      if (data && data >= inicioSemana && data <= fimSemana) {
        diasParadas[data.getDay()]++;
        // Usa a nova função para calcular tempo real
        const tempo = getTempoParadaReal(p);
        diasTempo[data.getDay()] += tempo;
      }
    });

    // Reordena: Seg, Ter, Qua, Qui, Sex, Sab, Dom
    const reorder = (arr: number[]) => [arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[0]];
    return {
      exec: reorder(diasSemana),
      paradas: reorder(diasParadas),
      tempo: reorder(diasTempo)
    };
  };

  // ============ TABELA 5: DISPONIBILIDADE X META MENSAL ============
  const disponibilidadeMetaMensal = () => {
    const META_MENSAL = 80; // Meta fixa de 80%
    const { inicio: periodoInicio, fim: periodoFim } = getDatasPeriodo(filtro);
    const mesesData: Record<string, Set<string>> = {};

    // Função para extrair ano-mês e dia de uma data
    const processarData = (data: Date | null) => {
      if (!data) return null;
      // Verifica se está dentro do período filtrado
      if (data < periodoInicio || data > periodoFim) return null;
      
      const ano = data.getFullYear();
      const mes = data.getMonth();
      const dia = data.getDate();
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      return { chave, dia, ano, mes };
    };

    // Processa paradas concluídas (finalizadoEm)
    paradasMaquina.forEach(p => {
      if (p.status === "concluido" && p.finalizadoEm) {
        const data = timestampToDate(p.finalizadoEm);
        const resultado = processarData(data);
        if (resultado) {
          if (!mesesData[resultado.chave]) {
            mesesData[resultado.chave] = new Set();
          }
          mesesData[resultado.chave].add(resultado.dia.toString());
        }
      }
    });

    // Processa histórico de execuções (dataExecucao)
    historicoExecucoes.forEach(exec => {
      const data = timestampToDate(exec.dataExecucao);
      const resultado = processarData(data);
      if (resultado) {
        if (!mesesData[resultado.chave]) {
          mesesData[resultado.chave] = new Set();
        }
        mesesData[resultado.chave].add(resultado.dia.toString());
      }
    });

    // Converte para array ordenado
    const nomeMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const getDiasNoMes = (ano: number, mes: number) => {
      return new Date(ano, mes + 1, 0).getDate();
    };

    return Object.entries(mesesData)
      .map(([chave, diasSet]) => {
        const [ano, mes] = chave.split("-").map(Number);
        const diasTrabalhados = diasSet.size;
        const diasNoMes = getDiasNoMes(ano, mes);
        const disponibilidade = (diasTrabalhados / diasNoMes) * 100;
        
        return {
          chave,
          mesNome: `${nomeMeses[mes]}/${ano}`,
          diasTrabalhados,
          diasNoMes,
          disponibilidade: disponibilidade.toFixed(1),
          disponibilidadeNum: disponibilidade,
          meta: META_MENSAL,
          atingiuMeta: disponibilidade >= META_MENSAL
        };
      })
      .sort((a, b) => b.chave.localeCompare(a.chave)); // Mais recente primeiro
  };

  const dispData = disponibilidadePorSetor();
  const tempoData = tempoParadaPorSetor();
  const tiposData = tiposManutencaoSemana();
  const diasData = execucoesPorDiaSemana();
  const metaMensalData = disponibilidadeMetaMensal();

  // Totais
  const totalDispData = dispData.reduce((acc, d) => ({
    abertas: acc.abertas + d.abertas,
    fechadas: acc.fechadas + d.fechadas,
    qtdParadas: acc.qtdParadas + d.qtdParadas,
  }), { abertas: 0, fechadas: 0, qtdParadas: 0 });

  const totalTempoMinutos = paradasFiltradas.reduce((acc, p) => {
    return acc + getTempoParadaReal(p);
  }, 0);

  return (
    <div id="secao-tabelas" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Resumo / Disponibilidade</h2>
        </div>
        <DashboardFilters filtro={filtro} onFiltroChange={onFiltroChange} />
      </div>

      {/* Tabela 1: Disponibilidade por Setor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="h-5 w-5 text-success" />
            Disponibilidade por Setor
          </CardTitle>
          <CardDescription>Média de disponibilidade da máquina e geral</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Setor</th>
                  <th className="text-right p-3 font-semibold">Disponib.</th>
                  <th className="text-right p-3 font-semibold">Abertas</th>
                  <th className="text-right p-3 font-semibold">Fechadas</th>
                  <th className="text-right p-3 font-semibold">Disp. Máq.</th>
                  <th className="text-right p-3 font-semibold">Disp. Geral</th>
                  <th className="text-right p-3 font-semibold">Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {dispData.map((row) => (
                  <tr key={row.setor} className="border-b hover:bg-muted/30">
                    <td className="p-3">{row.setor}</td>
                    <td className="text-right p-3">{row.disponibilidade.replace('.', ',')}%</td>
                    <td className="text-right p-3 text-warning">{row.abertas}</td>
                    <td className="text-right p-3 text-success">{row.fechadas}</td>
                    <td className="text-right p-3">{row.dispMaquina.replace('.', ',')}%</td>
                    <td className="text-right p-3">{row.dispGeral.replace('.', ',')}%</td>
                    <td className="text-right p-3">{row.qtdParadas}</td>
                  </tr>
                ))}
                <tr className="bg-muted/70 font-semibold">
                  <td className="p-3">Total Geral</td>
                  <td className="text-right p-3">{calcularDisponibilidade(totalTempoMinutos, tempoDisponivel, true).toFixed(2).replace('.', ',')}%</td>
                  <td className="text-right p-3 text-warning">{totalDispData.abertas}</td>
                  <td className="text-right p-3 text-success">{totalDispData.fechadas}</td>
                  <td className="text-right p-3">{calcularDisponibilidade(totalTempoMinutos, tempoDisponivel * 0.9, true).toFixed(2).replace('.', ',')}%</td>
                  <td className="text-right p-3">{calcularDisponibilidade(totalTempoMinutos, tempoDisponivel, true).toFixed(2).replace('.', ',')}%</td>
                  <td className="text-right p-3">{totalDispData.qtdParadas}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela 2: Tempo de Parada por Setor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="h-5 w-5 text-warning" />
            Tempo de Parada por Setor
          </CardTitle>
          <CardDescription>Soma de tempo de parada por setor</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Setor</th>
                  <th className="text-right p-3 font-semibold">Disponib.</th>
                  <th className="text-right p-3 font-semibold">Abertas</th>
                  <th className="text-right p-3 font-semibold">Fechadas</th>
                  <th className="text-right p-3 font-semibold">Tempo Parada</th>
                  <th className="text-right p-3 font-semibold">Qtd.</th>
                  <th className="text-right p-3 font-semibold">Média/Parada</th>
                </tr>
              </thead>
              <tbody>
                {tempoData.map((row) => (
                  <tr key={row.setor} className="border-b hover:bg-muted/30">
                    <td className="p-3">{row.setor}</td>
                    <td className="text-right p-3">{row.disponibilidade.replace('.', ',')}%</td>
                    <td className="text-right p-3 text-warning">{row.abertas}</td>
                    <td className="text-right p-3 text-success">{row.fechadas}</td>
                    <td className="text-right p-3">{row.tempoParada}</td>
                    <td className="text-right p-3">{row.qtdParadas}</td>
                    <td className="text-right p-3">{row.mediaParada}</td>
                  </tr>
                ))}
                <tr className="bg-muted/70 font-semibold">
                  <td className="p-3">Total Geral</td>
                  <td className="text-right p-3">{calcularDisponibilidade(totalTempoMinutos, tempoDisponivel, true).toFixed(2).replace('.', ',')}%</td>
                  <td className="text-right p-3 text-warning">{totalDispData.abertas}</td>
                  <td className="text-right p-3 text-success">{totalDispData.fechadas}</td>
                  <td className="text-right p-3">{formatarTempoHMS(totalTempoMinutos)}</td>
                  <td className="text-right p-3">{totalDispData.qtdParadas}</td>
                  <td className="text-right p-3">{formatarTempoHMS(totalDispData.qtdParadas > 0 ? totalTempoMinutos / totalDispData.qtdParadas : 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela 3: Tipos de Manutenção (Semana Atual) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Tipos de Manutenção - Semana Atual
          </CardTitle>
          <CardDescription>Contagem e tempo gasto por tipo</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Tipo de Manutenção</th>
                  <th className="text-right p-3 font-semibold">Abertas</th>
                  <th className="text-right p-3 font-semibold">Fechadas</th>
                  <th className="text-right p-3 font-semibold">Contagem</th>
                  <th className="text-right p-3 font-semibold">Tempo Gasto</th>
                </tr>
              </thead>
              <tbody>
                {tiposData.length > 0 ? (
                  <>
                    {tiposData.map((row) => (
                      <tr key={row.tipo} className="border-b hover:bg-muted/30">
                        <td className={`p-3 ${row.tipo === "(vazio)" ? "text-muted-foreground italic" : ""}`}>{row.tipo}</td>
                        <td className="text-right p-3 text-warning">{row.abertas}</td>
                        <td className="text-right p-3 text-success">{row.fechadas}</td>
                        <td className="text-right p-3">{row.contagem}</td>
                        <td className="text-right p-3">{row.tempoGasto}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/70 font-semibold">
                      <td className="p-3">Total Geral</td>
                      <td className="text-right p-3 text-warning">{tiposData.reduce((acc, d) => acc + d.abertas, 0)}</td>
                      <td className="text-right p-3 text-success">{tiposData.reduce((acc, d) => acc + d.fechadas, 0)}</td>
                      <td className="text-right p-3">{tiposData.reduce((acc, d) => acc + d.contagem, 0)}</td>
                      <td className="text-right p-3">-</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Nenhuma parada registrada nesta semana
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela 5: Disponibilidade x Meta Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Disponibilidade x Meta Mensal
          </CardTitle>
          <CardDescription>Dias trabalhados vs meta de 80%</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Mês</th>
                  <th className="text-center p-3 font-semibold">Dias Trabalhados</th>
                  <th className="text-center p-3 font-semibold">Dias no Mês</th>
                  <th className="text-center p-3 font-semibold">Disponibilidade</th>
                  <th className="text-center p-3 font-semibold">Meta</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {metaMensalData.length > 0 ? (
                  metaMensalData.map((row) => (
                    <tr key={row.chave} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{row.mesNome}</td>
                      <td className="text-center p-3">{row.diasTrabalhados}</td>
                      <td className="text-center p-3">{row.diasNoMes}</td>
                      <td className="text-center p-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className={row.atingiuMeta ? "text-success font-medium" : "text-destructive font-medium"}>
                            {row.disponibilidade.replace('.', ',')}%
                          </span>
                          <Progress 
                            value={Math.min(row.disponibilidadeNum, 100)} 
                            className="h-1.5 w-16" 
                          />
                        </div>
                      </td>
                      <td className="text-center p-3 text-muted-foreground">{row.meta}%</td>
                      <td className="text-center p-3">
                        {row.atingiuMeta ? (
                          <div className="flex items-center justify-center gap-1 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Atingido</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Abaixo</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      Nenhum dado de execução disponível
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela 6: Execuções por Dia da Semana (Semana Atual) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Execuções por Dia da Semana - Semana Atual
          </CardTitle>
          <CardDescription>Distribuição de execuções preventivas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-center p-3 font-semibold">Segunda</th>
                  <th className="text-center p-3 font-semibold">Terça</th>
                  <th className="text-center p-3 font-semibold">Quarta</th>
                  <th className="text-center p-3 font-semibold">Quinta</th>
                  <th className="text-center p-3 font-semibold">Sexta</th>
                  <th className="text-center p-3 font-semibold">Sábado</th>
                  <th className="text-center p-3 font-semibold">Domingo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/30">
                  {diasData.exec.map((val, i) => (
                    <td key={`exec-${i}`} className="text-center p-3 text-success font-medium">{val} exec.</td>
                  ))}
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  {diasData.paradas.map((val, i) => (
                    <td key={`parada-${i}`} className="text-center p-3 text-destructive">{val} paradas</td>
                  ))}
                </tr>
                <tr className="hover:bg-muted/30">
                  {diasData.tempo.map((val, i) => (
                    <td key={`tempo-${i}`} className="text-center p-3 text-muted-foreground text-xs">{Math.round(val)} min</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
