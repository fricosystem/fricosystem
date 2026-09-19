import { TarefaManutencao, EficienciaManutentor, MaquinaCritica } from "@/types/typesManutencaoPreventiva";

/**
 * Calcula o MTTR (Mean Time To Repair) em minutos
 */
export function calcularMTTR(tarefas: TarefaManutencao[]): number {
  const tarefasConcluidas = tarefas.filter(t => t.status === "concluida" && t.tempoRealizado);
  if (tarefasConcluidas.length === 0) return 0;
  
  const totalMinutos = tarefasConcluidas.reduce((acc, t) => acc + (t.tempoRealizado || 0), 0);
  return Math.round(totalMinutos / tarefasConcluidas.length);
}

/**
 * Calcula a taxa de conclusão das tarefas
 */
export function calcularTaxaConclusao(tarefas: TarefaManutencao[]): number {
  if (tarefas.length === 0) return 0;
  const concluidas = tarefas.filter(t => t.status === "concluida").length;
  return Math.round((concluidas / tarefas.length) * 100);
}

/**
 * Calcula o custo total das manutenções
 */
export function calcularCustosTotal(tarefas: TarefaManutencao[]): number {
  return tarefas.reduce((acc, t) => {
    const custoMateriais = t.materiaisUtilizados?.reduce((sum, m) => 
      sum + (m.quantidade * (m.valorUnitario || 0)), 0) || 0;
    return acc + custoMateriais;
  }, 0);
}

/**
 * Identifica as máquinas mais críticas
 */
export function identificarMaquinasCriticas(tarefas: TarefaManutencao[], limite: number = 5): MaquinaCritica[] {
  const maquinas: Record<string, MaquinaCritica> = {};
  
  tarefas.forEach(t => {
    const id = t.maquinaId;
    if (!maquinas[id]) {
      maquinas[id] = {
        maquinaId: id,
        maquinaNome: t.maquinaNome,
        numeroFalhas: 0,
        tempoParadaTotal: 0,
        custoTotal: 0
      };
    }
    
    maquinas[id].numeroFalhas++;
    maquinas[id].tempoParadaTotal += t.tempoRealizado || 0;
    
    const custoMateriais = t.materiaisUtilizados?.reduce((sum, m) => 
      sum + (m.quantidade * (m.valorUnitario || 0)), 0) || 0;
    maquinas[id].custoTotal += custoMateriais;
  });
  
  return Object.values(maquinas)
    .sort((a, b) => b.numeroFalhas - a.numeroFalhas)
    .slice(0, limite);
}

/**
 * Calcula a eficiência dos manutentores
 */
export function calcularEficienciaManutentores(tarefas: TarefaManutencao[]): EficienciaManutentor[] {
  const manutentores: Record<string, {
    id: string;
    nome: string;
    concluidas: number;
    total: number;
    tempoTotal: number;
    desvioTotal: number;
    sucessos: number;
  }> = {};
  
  tarefas.forEach(t => {
    const id = t.manutentorId;
    if (!id) return;
    
    if (!manutentores[id]) {
      manutentores[id] = {
        id,
        nome: t.manutentorNome,
        concluidas: 0,
        total: 0,
        tempoTotal: 0,
        desvioTotal: 0,
        sucessos: 0
      };
    }
    
    manutentores[id].total++;
    
    if (t.status === "concluida") {
      manutentores[id].concluidas++;
      manutentores[id].tempoTotal += t.tempoRealizado || 0;
      manutentores[id].sucessos++;
      
      if (t.tempoEstimado && t.tempoRealizado) {
        const desvio = Math.abs(((t.tempoRealizado - t.tempoEstimado) / t.tempoEstimado) * 100);
        manutentores[id].desvioTotal += desvio;
      }
    }
  });
  
  return Object.values(manutentores)
    .map(m => ({
      manutentorId: m.id,
      manutentorNome: m.nome,
      tarefasConcluidas: m.concluidas,
      tempoMedioExecucao: m.concluidas > 0 ? Math.round(m.tempoTotal / m.concluidas) : 0,
      desvioTempoEstimado: m.concluidas > 0 ? Math.round(m.desvioTotal / m.concluidas) : 0,
      taxaSucesso: m.total > 0 ? Math.round((m.sucessos / m.total) * 100) : 0
    }))
    .sort((a, b) => b.taxaSucesso - a.taxaSucesso);
}

/**
 * Calcula a tendência mensal de manutenções
 */
export function calcularTendenciaMensal(tarefas: TarefaManutencao[], meses: number = 6): { mes: string; concluidas: number; pendentes: number }[] {
  const resultado: { mes: string; concluidas: number; pendentes: number }[] = [];
  const agora = new Date();
  
  for (let i = meses - 1; i >= 0; i--) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    
    const tarefasDoMes = tarefas.filter(t => {
      if (!t.proximaExecucao) return false;
      const dataExec = new Date(t.proximaExecucao);
      return dataExec.getMonth() === data.getMonth() && dataExec.getFullYear() === data.getFullYear();
    });
    
    resultado.push({
      mes: mesAno,
      concluidas: tarefasDoMes.filter(t => t.status === "concluida").length,
      pendentes: tarefasDoMes.filter(t => t.status !== "concluida").length
    });
  }
  
  return resultado;
}
