/**
 * Serviço aprimorado para automação completa de manutenções preventivas
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { diasParaManutencao, determinarStatusPorManutencao } from "@/utils/manutencaoUtils";
import { NivelUrgencia, AlertaManutencao, LogAutomacao } from "@/types/typesAlertasManutencao";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";

/**
 * Determina o nível de urgência baseado nos dias restantes
 */
function determinarUrgencia(diasRestantes: number): NivelUrgencia {
  if (diasRestantes < 0) return "critico"; // Atrasada
  if (diasRestantes === 0) return "critico"; // Hoje
  if (diasRestantes <= 1) return "alto"; // 1 dia
  if (diasRestantes <= 3) return "medio"; // 2-3 dias
  return "baixo";
}

/**
 * Cria um alerta de manutenção no sistema
 */
async function criarAlerta(
  tarefa: TarefaManutencao,
  diasRestantes: number,
  urgencia: NivelUrgencia,
  ordemServicoId?: string
): Promise<string> {
  const alertaData: Omit<AlertaManutencao, "id"> = {
    tarefaId: tarefa.id,
    tarefaNome: tarefa.descricaoTarefa,
    maquinaId: tarefa.maquinaId,
    maquinaNome: tarefa.maquinaNome,
    proximaExecucao: tarefa.proximaExecucao,
    diasRestantes,
    urgencia,
    lido: false,
    ordemServicoId,
    criadoEm: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, "alertas_manutencao"), alertaData);
  return docRef.id;
}

/**
 * Verifica se já existe alerta não lido para uma tarefa
 */
async function verificarAlertaExistente(tarefaId: string): Promise<boolean> {
  const alertasRef = collection(db, "alertas_manutencao");
  const q = query(
    alertasRef,
    where("tarefaId", "==", tarefaId),
    where("lido", "==", false)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Verifica se já existe ordem de serviço pendente para a tarefa
 */
async function verificarOrdemPendente(
  maquinaId: string,
  tarefaId: string
): Promise<{ existe: boolean; ordemId?: string }> {
  const ordensRef = collection(db, "ordens_servicos");
  const q = query(
    ordensRef,
    where("equipamentoId", "==", maquinaId),
    where("status", "in", ["pendente", "em_andamento"])
  );

  const snapshot = await getDocs(q);

  for (const doc of snapshot.docs) {
    const ordem = doc.data();
    if (ordem.tarefaManutencaoId === tarefaId) {
      return { existe: true, ordemId: doc.id };
    }
  }

  return { existe: false };
}

/**
 * Gera ID sequencial para ordens de serviço
 * Formato: OS-YYYYMMDD-XXXX
 */
async function gerarOrdemIdSequencial(): Promise<string> {
  const hoje = new Date();
  const dataStr = hoje.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `OS-${dataStr}`;

  // Buscar última ordem do dia
  const ordensRef = collection(db, "ordens_servicos");
  const q = query(
    ordensRef,
    where("ordemId", ">=", prefix),
    where("ordemId", "<", `OS-${dataStr}Z`)
  );
  
  const snapshot = await getDocs(q);
  let maxNum = 0;

  snapshot.forEach((doc) => {
    const ordemId = doc.data().ordemId as string;
    if (ordemId && ordemId.startsWith(prefix)) {
      const num = parseInt(ordemId.split("-")[2] || "0");
      if (num > maxNum) maxNum = num;
    }
  });

  const novoNum = (maxNum + 1).toString().padStart(4, "0");
  return `${prefix}-${novoNum}`;
}

/**
 * Cria uma ordem de serviço automática para uma tarefa
 */
async function criarOrdemServico(tarefa: TarefaManutencao): Promise<string> {
  const ordemId = await gerarOrdemIdSequencial();
  
  const ordemData = {
    ordemId, // ID sequencial gerado
    setor: tarefa.setor || "Manutenção Preventiva",
    equipamento: tarefa.maquinaNome,
    equipamentoId: tarefa.maquinaId,
    tarefaManutencaoId: tarefa.id,
    sistema: tarefa.sistema,
    componente: tarefa.componente,
    subcomponente: tarefa.subconjunto,
    hrInicial: "",
    hrFinal: "",
    tempoParada: "",
    linhaParada: "Não",
    descricaoMotivo: `Manutenção Preventiva Automática: ${tarefa.descricaoTarefa}`,
    observacao: `Tarefa agendada para: ${new Date(tarefa.proximaExecucao).toLocaleDateString("pt-BR")}\nTipo: ${tarefa.tipo}\nTempo estimado: ${tarefa.tempoEstimado} minutos`,
    origemParada: {
      automatizacao: false,
      terceiros: false,
      eletrica: tarefa.tipo.toLowerCase().includes("elétrica"),
      mecanica: tarefa.tipo.toLowerCase().includes("mecânica"),
      outro: true,
    },
    responsavelManutencao: tarefa.manutentorNome,
    responsavelEmail: tarefa.manutentorEmail,
    tipoManutencao: "Preventiva",
    tipoManutencaoEspecifico: tarefa.tipo,
    solucaoAplicada: "",
    produtosUtilizados: [],
    valorTotalProdutos: 0,
    criadoPor: "Sistema Automático",
    criadoEm: Timestamp.now(),
    status: "pendente",
    geradaAutomaticamente: true,
    tipoOrdem: "Automatica",
    dataAgendada: tarefa.dataHoraAgendada || tarefa.proximaExecucao,
    tempoEstimado: tarefa.tempoEstimado,
    prioridade: tarefa.prioridade || determinarStatusPorManutencao(tarefa.proximaExecucao).toLowerCase(),
  };

  const docRef = await addDoc(collection(db, "ordens_servicos"), ordemData);
  
  // Atualizar tarefa com o ordemId gerado
  await updateDoc(doc(db, "tarefas_manutencao", tarefa.id), {
    ordemId,
    atualizadoEm: Timestamp.now()
  });
  
  return docRef.id;
}

/**
 * Busca a configuração de automação
 */
async function buscarConfiguracao(): Promise<any> {
  const configRef = collection(db, "configuracao_automacao");
  const snapshot = await getDocs(configRef);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Retornar configuração padrão se não existir
  return {
    ativo: true,
    diasAntecedencia: 3,
    gerarOSAutomatica: true,
    horarioExecucao: "06:00",
    notificarPorEmail: false,
    emailsNotificacao: [],
    configuracoesPorTipo: {},
  };
}

/**
 * Registra um log de automação
 */
async function registrarLog(
  tipo: LogAutomacao["tipo"],
  descricao: string,
  tarefasVerificadas: number,
  osGeradas: number,
  alertasCriados: number,
  erro?: string,
  detalhes?: any
): Promise<void> {
  const logData: Omit<LogAutomacao, "id"> = {
    tipo,
    descricao,
    tarefasVerificadas,
    osGeradas,
    alertasCriados,
    erro,
    detalhes,
    criadoEm: Timestamp.now(),
  };

  await addDoc(collection(db, "logs_automacao"), logData);
}

/**
 * Função principal de automação - executa todo o processo
 */
export async function executarAutomacaoCompleta() {
  console.log("[Automação] Iniciando processo completo...");

  try {
    // 1. Buscar configuração
    const config = await buscarConfiguracao();

    if (!config.ativo) {
      console.log("[Automação] Sistema desativado nas configurações");
      await registrarLog(
        "verificacao",
        "Sistema de automação desativado",
        0,
        0,
        0
      );
      return {
        success: true,
        message: "Automação desativada",
        tarefasVerificadas: 0,
        osGeradas: 0,
        alertasCriados: 0,
      };
    }

    // 2. Buscar todas as tarefas pendentes
    const tarefasRef = collection(db, "tarefas_manutencao");
    const q = query(tarefasRef, where("status", "==", "pendente"));
    const snapshot = await getDocs(q);

    let osGeradas = 0;
    let alertasCriados = 0;
    const tarefasProcessadas: string[] = [];

    // 3. Processar cada tarefa
    for (const docSnapshot of snapshot.docs) {
      const tarefa = { id: docSnapshot.id, ...docSnapshot.data() } as TarefaManutencao;

      if (!tarefa.proximaExecucao) continue;

      const diasRestantes = diasParaManutencao(tarefa.proximaExecucao);
      const urgencia = determinarUrgencia(diasRestantes);

      // Verificar se está dentro do período de antecedência
      const diasAntecedencia = config.configuracoesPorTipo?.[tarefa.tipo]?.diasAntecedencia || config.diasAntecedencia;

      if (diasRestantes <= diasAntecedencia) {
        tarefasProcessadas.push(tarefa.id);

        // 4. Verificar se já existe alerta
        const temAlerta = await verificarAlertaExistente(tarefa.id);

        // 5. Verificar se já existe OS
        const { existe: temOS, ordemId } = await verificarOrdemPendente(
          tarefa.maquinaId,
          tarefa.id
        );

        let novaOrdemId = ordemId;

        // 6. Gerar OS se necessário e configurado
        if (!temOS && config.gerarOSAutomatica) {
          novaOrdemId = await criarOrdemServico(tarefa);
          osGeradas++;
          console.log(`[Automação] OS gerada para: ${tarefa.descricaoTarefa}`);
        }

        // 7. Criar alerta se necessário
        if (!temAlerta) {
          await criarAlerta(tarefa, diasRestantes, urgencia, novaOrdemId);
          alertasCriados++;
          console.log(`[Automação] Alerta criado para: ${tarefa.descricaoTarefa}`);
        }
      }
    }

    // 8. Registrar log de sucesso
    await registrarLog(
      "verificacao",
      "Automação executada com sucesso",
      snapshot.size,
      osGeradas,
      alertasCriados,
      undefined,
      { tarefasProcessadas }
    );

    console.log(`[Automação] Concluída: ${osGeradas} OS geradas, ${alertasCriados} alertas criados`);

    return {
      success: true,
      tarefasVerificadas: snapshot.size,
      osGeradas,
      alertasCriados,
      tarefasProcessadas,
    };
  } catch (error: any) {
    console.error("[Automação] Erro:", error);

    await registrarLog(
      "erro",
      "Erro durante automação",
      0,
      0,
      0,
      error.message
    );

    return {
      success: false,
      error: error.message,
      tarefasVerificadas: 0,
      osGeradas: 0,
      alertasCriados: 0,
    };
  }
}

/**
 * Função para recalcular a próxima execução após conclusão
 */
export async function recalcularProximaExecucao(tarefaId: string): Promise<void> {
  const tarefaRef = doc(db, "tarefas_manutencao", tarefaId);
  const tarefaDoc = await getDoc(tarefaRef);

  if (!tarefaDoc.exists()) {
    throw new Error("Tarefa não encontrada");
  }

  const tarefa = tarefaDoc.data() as TarefaManutencao;
  const hoje = new Date();
  const proximaData = new Date(hoje);
  proximaData.setDate(proximaData.getDate() + tarefa.periodo);

  await updateDoc(tarefaRef, {
    status: "pendente",
    proximaExecucao: proximaData.toISOString().split("T")[0],
    ultimaExecucao: Timestamp.now(),
    atualizadoEm: Timestamp.now(),
  });

  console.log(`[Automação] Próxima execução recalculada para: ${proximaData.toISOString().split("T")[0]}`);
}
