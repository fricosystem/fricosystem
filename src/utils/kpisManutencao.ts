import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { Timestamp } from "firebase/firestore";

/**
 * Calcula MTBF (Mean Time Between Failures) - Tempo médio entre falhas
 * Formula: Total de horas operacionais / Número de falhas
 */
export function calcularMTBF(
  horasOperacionaisTotal: number,
  numeroFalhas: number
): number {
  if (numeroFalhas === 0) return horasOperacionaisTotal;
  return Math.round(horasOperacionaisTotal / numeroFalhas);
}

/**
 * Calcula MTTR (Mean Time To Repair) - Tempo médio de reparo
 * Formula: Total de tempo de reparo / Número de reparos
 */
export function calcularMTTR(tarefas: TarefaManutencao[]): number {
  const tarefasConcluidas = tarefas.filter(t => t.status === "concluida" && t.tempoRealizado);
  
  if (tarefasConcluidas.length === 0) return 0;
  
  const tempoTotal = tarefasConcluidas.reduce(
    (acc, t) => acc + (t.tempoRealizado || 0),
    0
  );
  
  return Math.round(tempoTotal / tarefasConcluidas.length);
}

/**
 * Calcula taxa de conclusão no prazo
 */
export function calcularTaxaConclusao(tarefas: TarefaManutencao[]): number {
  if (tarefas.length === 0) return 100;
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const tarefasVencidas = tarefas.filter(t => {
    if (t.status === "concluida") return false;
    const dataExecucao = new Date(t.proximaExecucao);
    return dataExecucao < hoje;
  });
  
  const noPrazo = tarefas.length - tarefasVencidas.length;
  return Math.round((noPrazo / tarefas.length) * 100);
}

/**
 * Calcula custos totais de manutenção
 */
export function calcularCustosTotal(tarefas: TarefaManutencao[]): number {
  return tarefas.reduce((acc, tarefa) => {
    const custoMateriais = tarefa.materiaisUtilizados?.reduce(
      (sum, mat) => sum + (mat.quantidade * (mat.valorUnitario || 0)),
      0
    ) || 0;
    
    return acc + custoMateriais;
  }, 0);
}

/**
 * Calcula custos por máquina
 */
export function calcularCustosPorMaquina(
  tarefas: TarefaManutencao[]
): { [maquinaId: string]: number } {
  const custos: { [maquinaId: string]: number } = {};
  
  tarefas.forEach(tarefa => {
    const custoMateriais = tarefa.materiaisUtilizados?.reduce(
      (sum, mat) => sum + (mat.quantidade * (mat.valorUnitario || 0)),
      0
    ) || 0;
    
    if (!custos[tarefa.maquinaId]) {
      custos[tarefa.maquinaId] = 0;
    }
    
    custos[tarefa.maquinaId] += custoMateriais;
  });
  
  return custos;
}

/**
 * Identifica máquinas críticas (mais problemas)
 */
export function identificarMaquinasCriticas(
  tarefas: TarefaManutencao[],
  limite: number = 5
): Array<{
  maquinaId: string;
  maquinaNome: string;
  numeroFalhas: number;
  tempoParadaTotal: number;
  custoTotal: number;
}> {
  const maquinasMap = new Map<string, {
    maquinaId: string;
    maquinaNome: string;
    numeroFalhas: number;
    tempoParadaTotal: number;
    custoTotal: number;
  }>();
  
  tarefas.forEach(tarefa => {
    if (!maquinasMap.has(tarefa.maquinaId)) {
      maquinasMap.set(tarefa.maquinaId, {
        maquinaId: tarefa.maquinaId,
        maquinaNome: tarefa.maquinaNome,
        numeroFalhas: 0,
        tempoParadaTotal: 0,
        custoTotal: 0
      });
    }
    
    const maquina = maquinasMap.get(tarefa.maquinaId)!;
    
    if (tarefa.status === "concluida") {
      maquina.numeroFalhas++;
      maquina.tempoParadaTotal += tarefa.tempoRealizado || 0;
      
      const custoMateriais = tarefa.materiaisUtilizados?.reduce(
        (sum, mat) => sum + (mat.quantidade * (mat.valorUnitario || 0)),
        0
      ) || 0;
      
      maquina.custoTotal += custoMateriais;
    }
  });
  
  return Array.from(maquinasMap.values())
    .sort((a, b) => b.numeroFalhas - a.numeroFalhas)
    .slice(0, limite);
}

/**
 * Calcula eficiência dos manutentores
 */
export function calcularEficienciaManutentores(
  tarefas: TarefaManutencao[]
): Array<{
  manutentorId: string;
  manutentorNome: string;
  tarefasConcluidas: number;
  tempoMedioExecucao: number;
  desvioTempoEstimado: number;
  taxaSucesso: number;
}> {
  const manutentoresMap = new Map<string, {
    manutentorId: string;
    manutentorNome: string;
    tarefasConcluidas: number;
    tempoTotal: number;
    desvioTotal: number;
    tarefasComProblemas: number;
    tarefasTotal: number;
  }>();
  
  tarefas.forEach(tarefa => {
    if (!manutentoresMap.has(tarefa.manutentorId)) {
      manutentoresMap.set(tarefa.manutentorId, {
        manutentorId: tarefa.manutentorId,
        manutentorNome: tarefa.manutentorNome,
        tarefasConcluidas: 0,
        tempoTotal: 0,
        desvioTotal: 0,
        tarefasComProblemas: 0,
        tarefasTotal: 0
      });
    }
    
    const manutentor = manutentoresMap.get(tarefa.manutentorId)!;
    manutentor.tarefasTotal++;
    
    if (tarefa.status === "concluida" && tarefa.tempoRealizado) {
      manutentor.tarefasConcluidas++;
      manutentor.tempoTotal += tarefa.tempoRealizado;
      
      const desvio = Math.abs(tarefa.tempoRealizado - tarefa.tempoEstimado);
      manutentor.desvioTotal += (desvio / tarefa.tempoEstimado) * 100;
      
      if (tarefa.requerAcompanhamento) {
        manutentor.tarefasComProblemas++;
      }
    }
  });
  
  return Array.from(manutentoresMap.values()).map(m => ({
    manutentorId: m.manutentorId,
    manutentorNome: m.manutentorNome,
    tarefasConcluidas: m.tarefasConcluidas,
    tempoMedioExecucao: m.tarefasConcluidas > 0 
      ? Math.round(m.tempoTotal / m.tarefasConcluidas)
      : 0,
    desvioTempoEstimado: m.tarefasConcluidas > 0
      ? Math.round(m.desvioTotal / m.tarefasConcluidas)
      : 0,
    taxaSucesso: m.tarefasTotal > 0
      ? Math.round(((m.tarefasTotal - m.tarefasComProblemas) / m.tarefasTotal) * 100)
      : 100
  }));
}

/**
 * Calcula tendência de manutenções ao longo do tempo
 */
export function calcularTendenciaMensal(
  tarefas: TarefaManutencao[],
  meses: number = 6
): Array<{ mes: string; total: number; concluidas: number; atrasadas: number }> {
  const hoje = new Date();
  const resultado = [];
  
  for (let i = meses - 1; i >= 0; i--) {
    const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const mesProximo = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
    
    const tarefasMes = tarefas.filter(t => {
      const dataExecucao = new Date(t.proximaExecucao);
      return dataExecucao >= mesData && dataExecucao < mesProximo;
    });
    
    resultado.push({
      mes: mesData.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      total: tarefasMes.length,
      concluidas: tarefasMes.filter(t => t.status === "concluida").length,
      atrasadas: tarefasMes.filter(t => {
        if (t.status === "concluida") return false;
        return new Date(t.proximaExecucao) < hoje;
      }).length
    });
  }
  
  return resultado;
}
