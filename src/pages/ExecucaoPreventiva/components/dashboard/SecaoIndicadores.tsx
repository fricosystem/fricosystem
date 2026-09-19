import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, Activity, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DashboardFilters } from "./DashboardFilters";
import { 
  FiltroData, 
  filtrarPorPeriodo, 
  getTempoParadaReal,
  timestampToDate,
  getDatasPeriodo
} from "./dashboardUtils";

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

interface HistoricoExecucao {
  dataExecucao?: any;
  tempoRealizado?: number;
}

interface SecaoIndicadoresProps {
  paradasMaquina: ParadaMaquinaData[];
  historicoExecucoes: HistoricoExecucao[];
  filtro: FiltroData;
  onFiltroChange: (filtro: FiltroData) => void;
}

export function SecaoIndicadores({ 
  paradasMaquina, 
  historicoExecucoes,
  filtro, 
  onFiltroChange 
}: SecaoIndicadoresProps) {
  // ============ TABELA: DISPONIBILIDADE X META MENSAL ============
  const disponibilidadeMetaMensal = () => {
    const META_MENSAL = 80;
    const { inicio: periodoInicio, fim: periodoFim } = getDatasPeriodo(filtro);
    const mesesData: Record<string, Set<string>> = {};

    const processarData = (data: Date | null) => {
      if (!data) return null;
      if (data < periodoInicio || data > periodoFim) return null;
      
      const ano = data.getFullYear();
      const mes = data.getMonth();
      const dia = data.getDate();
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      return { chave, dia, ano, mes };
    };

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
      .sort((a, b) => b.chave.localeCompare(a.chave));
  };

  // ============ TABELA: INDICADOR DE METAS DE MANUTENÇÃO ============
  const indicadorMetasManutencao = () => {
    const HDE_PADRAO = 8 * 60;
    const META_PADRAO = 98;
    const { inicio: periodoInicio, fim: periodoFim } = getDatasPeriodo(filtro);
    
    const mesesData: Record<string, {
      diasTrabalhados: Set<string>;
      numQuebras: number;
      tempoQuebra: number;
      hdeTotal: number;
    }> = {};

    const processarData = (data: Date | null) => {
      if (!data) return null;
      if (data < periodoInicio || data > periodoFim) return null;
      
      const ano = data.getFullYear();
      const mes = data.getMonth();
      const dia = data.getDate();
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      return { chave, dia, ano, mes };
    };

    paradasMaquina.forEach(p => {
      const data = timestampToDate(p.criadoEm);
      const resultado = processarData(data);
      if (resultado) {
        if (!mesesData[resultado.chave]) {
          mesesData[resultado.chave] = {
            diasTrabalhados: new Set(),
            numQuebras: 0,
            tempoQuebra: 0,
            hdeTotal: 0
          };
        }
        
        mesesData[resultado.chave].diasTrabalhados.add(resultado.dia.toString());
        mesesData[resultado.chave].numQuebras++;
        mesesData[resultado.chave].tempoQuebra += getTempoParadaReal(p);
      }
    });

    historicoExecucoes.forEach(exec => {
      const data = timestampToDate(exec.dataExecucao);
      const resultado = processarData(data);
      if (resultado) {
        if (!mesesData[resultado.chave]) {
          mesesData[resultado.chave] = {
            diasTrabalhados: new Set(),
            numQuebras: 0,
            tempoQuebra: 0,
            hdeTotal: 0
          };
        }
        mesesData[resultado.chave].diasTrabalhados.add(resultado.dia.toString());
      }
    });

    const nomeMeses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    return Object.entries(mesesData)
      .map(([chave, data]) => {
        const [ano, mes] = chave.split("-").map(Number);
        const diasTrabalhados = data.diasTrabalhados.size;
        const hde = diasTrabalhados * HDE_PADRAO;
        const hdeHoras = Math.round(hde / 60);
        const tempoQuebra = data.tempoQuebra;
        const tempoQuebraHoras = (tempoQuebra / 60).toFixed(2);
        const numQuebras = data.numQuebras;
        
        const mttr = numQuebras > 0 ? (tempoQuebra / numQuebras / 60).toFixed(2) : "0.00";
        const mtbf = numQuebras > 0 ? ((hde - tempoQuebra) / numQuebras / 60).toFixed(2) : "0.00";
        const disposicao = hde > 0 ? (((hde - tempoQuebra) / hde) * 100).toFixed(2) : "100.00";
        
        const disposicaoNum = parseFloat(disposicao);
        const metaAtingida = Math.round((disposicaoNum / META_PADRAO) * 100);
        
        return {
          chave,
          ano,
          mesNome: nomeMeses[mes],
          diasTrabalhados,
          hde: hdeHoras,
          numQuebras,
          tempoQuebra: tempoQuebraHoras,
          mttr,
          mtbf,
          disposicao,
          meta: `${metaAtingida}%`,
          metaNum: metaAtingida
        };
      })
      .sort((a, b) => b.chave.localeCompare(a.chave));
  };

  const metaMensalData = disponibilidadeMetaMensal();
  const indicadorMetasData = indicadorMetasManutencao();

  return (
    <div id="secao-indicadores" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Indicadores Estratégicos</h2>
        </div>
        <DashboardFilters filtro={filtro} onFiltroChange={onFiltroChange} />
      </div>

      {/* Tabela: Disponibilidade x Meta Mensal */}
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

      {/* Tabela: Indicador de Metas de Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Indicador de Metas de Manutenção
          </CardTitle>
          <CardDescription>MTTR, MTBF, Disposição e Meta por mês</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold" colSpan={2}>Data</th>
                  <th className="text-center p-3 font-semibold" colSpan={8}>Manutenção</th>
                </tr>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-2 font-semibold text-xs">Ano</th>
                  <th className="text-left p-2 font-semibold text-xs">Mês</th>
                  <th className="text-center p-2 font-semibold text-xs">Dias Trab.</th>
                  <th className="text-center p-2 font-semibold text-xs">HDE</th>
                  <th className="text-center p-2 font-semibold text-xs">Nº Quebras</th>
                  <th className="text-center p-2 font-semibold text-xs">Tempo Quebra</th>
                  <th className="text-center p-2 font-semibold text-xs">MTTR</th>
                  <th className="text-center p-2 font-semibold text-xs">MTBF</th>
                  <th className="text-center p-2 font-semibold text-xs">Disposição</th>
                  <th className="text-center p-2 font-semibold text-xs">Meta</th>
                </tr>
              </thead>
              <tbody>
                {indicadorMetasData.length > 0 ? (
                  indicadorMetasData.map((row) => (
                    <tr key={row.chave} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{row.ano}</td>
                      <td className="p-2 font-medium">{row.mesNome}</td>
                      <td className="text-center p-2">{row.diasTrabalhados}</td>
                      <td className="text-center p-2">{row.hde}</td>
                      <td className="text-center p-2 text-destructive font-medium">{row.numQuebras}</td>
                      <td className="text-center p-2">{row.tempoQuebra.replace('.', ',')}</td>
                      <td className="text-center p-2">{row.mttr.replace('.', ',')}</td>
                      <td className="text-center p-2">{row.mtbf.replace('.', ',')}</td>
                      <td className="text-center p-2">
                        <span className={parseFloat(row.disposicao) >= 95 ? "text-success font-medium" : parseFloat(row.disposicao) >= 90 ? "text-warning font-medium" : "text-destructive font-medium"}>
                          {row.disposicao.replace('.', ',')}%
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <span className={row.metaNum >= 100 ? "text-success font-medium" : "text-destructive font-medium"}>
                          {row.meta}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-muted-foreground">
                      Nenhum dado de manutenção disponível
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
