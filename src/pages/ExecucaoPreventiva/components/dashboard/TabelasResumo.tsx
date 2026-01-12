import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gauge, Timer, Wrench, Clock, BarChart3, Target } from "lucide-react";
import { DashboardFilters } from "./DashboardFilters";
import { 
  FiltroData, 
  filtrarPorPeriodo, 
  calcularDisponibilidade, 
  getTempoDisponivelMinutos,
  getTempoParadaReal,
  formatarTempoHMS,
  timestampToDate,
  getDatasSemanaAtual
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
  hrInicial?: string;
  hrFinal?: string;
  dataConclusao?: any;
}

// Calcula tempo de parada a partir de hrInicial e hrFinal (em minutos)
const calcularTempoParadaHoras = (hrInicial?: string, hrFinal?: string): number => {
  if (!hrInicial || !hrFinal) return 0;
  const [hI, mI] = hrInicial.split(":").map(Number);
  const [hF, mF] = hrFinal.split(":").map(Number);
  if (isNaN(hI) || isNaN(mI) || isNaN(hF) || isNaN(mF)) return 0;
  const inicioMin = hI * 60 + mI;
  let fimMin = hF * 60 + mF;
  // Se hora final menor que inicial, considera virada de dia
  if (fimMin < inicioMin) {
    fimMin += 24 * 60;
  }
  return fimMin - inicioMin;
};

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
  // Filtra apenas paradas com status "concluido" para a tabela de tempo por setor
  const tempoParadaPorSetor = () => {
    const setorData: Record<string, { 
      tempo: number; 
      count: number;
    }> = {};

    // Filtra apenas status "concluido" e calcula tempo usando hrInicial e hrFinal
    paradasFiltradas
      .filter(p => p.status === "concluido")
      .forEach(p => {
        const setor = p.setor || "Outros";
        if (!setorData[setor]) {
          setorData[setor] = { tempo: 0, count: 0 };
        }
        
        // Calcula tempo de parada a partir de hrInicial e hrFinal
        const tempo = calcularTempoParadaHoras(p.hrInicial, p.hrFinal);
        setorData[setor].tempo += tempo;
        setorData[setor].count++;
      });

    return Object.entries(setorData)
      .map(([setor, data]) => {
        const disponibilidade = calcularDisponibilidade(data.tempo, tempoDisponivel, true);
        return {
          setor,
          disponibilidade: disponibilidade.toFixed(2),
          tempoParada: formatarTempoHMS(data.tempo),
          tempoParadaMinutos: data.tempo,
          qtdParadas: data.count,
          mediaParada: formatarTempoHMS(data.count > 0 ? data.tempo / data.count : 0)
        };
      })
      .sort((a, b) => b.tempoParadaMinutos - a.tempoParadaMinutos);
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
        
        // Calcula tempo usando hrInicial e hrFinal (em minutos)
        const tempo = calcularTempoParadaHoras(p.hrInicial, p.hrFinal);
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
        tempoGasto: formatarTempoHMS(data.tempo),
        tempoMinutos: data.tempo
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
    const META_FIXA = 98; // 98% de meta
    const TEMPO_OPERACAO_DIA_MIN = 936; // 15.6 horas * 60 minutos (TO MIN fixo)
    
    const mesesNomes = [
      "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
      "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
    ];

    const mesData: Record<number, { paradasMin: number; diasSet: Set<string> }> = {};
    
    // Inicializa todos os meses
    for (let i = 0; i < 12; i++) {
      mesData[i] = { paradasMin: 0, diasSet: new Set() };
    }

    // Processa todas as paradas (não apenas filtradas, pois é por período mensal)
    paradasMaquina.forEach(p => {
      // Usa dataConclusao para determinar dias trabalhados
      const dataConclusao = timestampToDate(p.dataConclusao);
      if (dataConclusao) {
        const mes = dataConclusao.getMonth();
        const diaStr = dataConclusao.toISOString().split('T')[0];
        mesData[mes].diasSet.add(diaStr);
      }

      // Soma tempo de parada para o mês (baseado em criadoEm ou dataConclusao)
      const dataRef = timestampToDate(p.dataConclusao) || timestampToDate(p.criadoEm);
      if (dataRef && p.status === "concluido") {
        const mes = dataRef.getMonth();
        const tempo = calcularTempoParadaHoras(p.hrInicial, p.hrFinal);
        mesData[mes].paradasMin += tempo;
      }
    });

    return mesesNomes.map((nome, index) => {
      const data = mesData[index];
      const diasTrab = data.diasSet.size;
      const toMin = TEMPO_OPERACAO_DIA_MIN; // TO MIN fixo
      const paradasMin = data.paradasMin;
      
      // Calcula porcentagem: ((TO_MIN * DIAS_TRAB) - PARADAS_MIN) / (TO_MIN * DIAS_TRAB) * 100
      let porcentagem = 0;
      if (diasTrab > 0) {
        const tempoTotalDisponivel = toMin * diasTrab;
        porcentagem = ((tempoTotalDisponivel - paradasMin) / tempoTotalDisponivel) * 100;
      }

      return {
        mes: nome,
        meta: META_FIXA,
        paradasMin: paradasMin.toFixed(1),
        diasTrab,
        toMin,
        porcentagem: diasTrab > 0 ? porcentagem.toFixed(2) : "#DIV/0!"
      };
    });
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
                  <th className="text-right p-3 font-semibold">Tempo Parada</th>
                  <th className="text-right p-3 font-semibold">Qtd.</th>
                  <th className="text-right p-3 font-semibold">Média/Parada</th>
                </tr>
              </thead>
              <tbody>
                {tempoData.length > 0 ? (
                  <>
                    {tempoData.map((row) => (
                      <tr key={row.setor} className="border-b hover:bg-muted/30">
                        <td className="p-3">{row.setor}</td>
                        <td className="text-right p-3">{row.disponibilidade.replace('.', ',')}%</td>
                        <td className="text-right p-3">{row.tempoParada}</td>
                        <td className="text-right p-3">{row.qtdParadas}</td>
                        <td className="text-right p-3">{row.mediaParada}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/70 font-semibold">
                      <td className="p-3">Total Geral</td>
                      <td className="text-right p-3">
                        {calcularDisponibilidade(
                          tempoData.reduce((acc, r) => acc + r.tempoParadaMinutos, 0), 
                          tempoDisponivel, 
                          true
                        ).toFixed(2).replace('.', ',')}%
                      </td>
                      <td className="text-right p-3">
                        {formatarTempoHMS(tempoData.reduce((acc, r) => acc + r.tempoParadaMinutos, 0))}
                      </td>
                      <td className="text-right p-3">
                        {tempoData.reduce((acc, r) => acc + r.qtdParadas, 0)}
                      </td>
                      <td className="text-right p-3">
                        {formatarTempoHMS(
                          tempoData.reduce((acc, r) => acc + r.qtdParadas, 0) > 0 
                            ? tempoData.reduce((acc, r) => acc + r.tempoParadaMinutos, 0) / tempoData.reduce((acc, r) => acc + r.qtdParadas, 0) 
                            : 0
                        )}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Nenhuma parada concluída no período selecionado
                    </td>
                  </tr>
                )}
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
                      <td className="text-right p-3">{formatarTempoHMS(tiposData.reduce((acc, d) => acc + d.tempoMinutos, 0))}</td>
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
            <Target className="h-5 w-5 text-success" />
            Disponibilidade x Meta Mensal
          </CardTitle>
          <CardDescription>Meta fixa de 98% - Dias trabalhados baseado em dataConclusao</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">MÊS</th>
                  <th className="text-center p-3 font-semibold">META</th>
                  <th className="text-right p-3 font-semibold">PARADAS (MIN)</th>
                  <th className="text-center p-3 font-semibold">DIAS TRAB</th>
                  <th className="text-right p-3 font-semibold">TO MIN</th>
                  <th className="text-right p-3 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {metaMensalData.map((row) => {
                  const porcentagemNum = parseFloat(row.porcentagem as string);
                  const atingiuMeta = !isNaN(porcentagemNum) && porcentagemNum >= row.meta;
                  const isError = row.porcentagem === "#DIV/0!";
                  
                  return (
                    <tr key={row.mes} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{row.mes}</td>
                      <td className="text-center p-3">{row.meta}%</td>
                      <td className="text-right p-3">{row.paradasMin}</td>
                      <td className="text-center p-3">{row.diasTrab}</td>
                      <td className="text-right p-3">{row.toMin}</td>
                      <td className={`text-right p-3 font-semibold ${
                        isError 
                          ? "text-destructive" 
                          : atingiuMeta 
                            ? "text-success" 
                            : "text-warning"
                      }`}>
                        {isError ? row.porcentagem : `${row.porcentagem}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabela 4: Execuções por Dia da Semana (Semana Atual) */}
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
