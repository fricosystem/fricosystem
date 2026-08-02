import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TarefaManutencao } from "@/types/typesManutencaoPreventiva";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para integração entre Manutenção Preventiva e outros módulos
 */
export const useIntegracaoManutencao = (maquinaId?: string) => {
  const [tarefasPendentes, setTarefasPendentes] = useState<TarefaManutencao[]>([]);
  const [proximasManutencoes, setProximasManutencoes] = useState<TarefaManutencao[]>([]);
  const { toast } = useToast();

  // Buscar tarefas pendentes da máquina
  useEffect(() => {
    if (!maquinaId) return;

    const q = query(
      collection(db, "tarefas_manutencao"),
      where("maquinaId", "==", maquinaId),
      where("status", "==", "pendente")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TarefaManutencao[];
      
      setTarefasPendentes(tarefas);

      // Filtrar próximas manutenções (próximos 30 dias)
      const hoje = new Date();
      const daqui30Dias = new Date();
      daqui30Dias.setDate(hoje.getDate() + 30);

      const proximas = tarefas.filter(t => {
        const dataExecucao = new Date(t.proximaExecucao);
        return dataExecucao >= hoje && dataExecucao <= daqui30Dias;
      });

      setProximasManutencoes(proximas);
    });

    return () => unsubscribe();
  }, [maquinaId]);

  /**
   * Criar Ordem de Serviço a partir de uma tarefa de manutenção
   */
  const criarOrdemServico = async (tarefa: TarefaManutencao, dadosAdicionais?: any) => {
    try {
      const ordemData = {
        setor: "Manutenção Preventiva",
        equipamento: tarefa.maquinaNome,
        equipamentoId: tarefa.maquinaId,
        hrInicial: "",
        hrFinal: "",
        tempoParada: "",
        linhaParada: "Não",
        descricaoMotivo: `Manutenção Preventiva: ${tarefa.descricaoTarefa}`,
        observacao: `Tipo: ${tarefa.tipo}\nSistema: ${tarefa.sistema}\nComponente: ${tarefa.componente}`,
        origemParada: {
          automatizacao: false,
          terceiros: false,
          eletrica: tarefa.tipo === "Elétrica",
          mecanica: tarefa.tipo === "Mecânica",
          outro: !["Elétrica", "Mecânica"].includes(tarefa.tipo),
        },
        responsavelManutencao: tarefa.manutentorNome,
        tipoManutencao: "Preventiva",
        solucaoAplicada: "",
        produtosUtilizados: [],
        valorTotalProdutos: 0,
        criadoPor: "Sistema - Manutenção Preventiva",
        criadoEm: serverTimestamp(),
        status: "pendente",
        tarefaManutencaoId: tarefa.id,
        ...dadosAdicionais
      };

      const docRef = await addDoc(collection(db, "ordens_servicos"), ordemData);

      toast({
        title: "Ordem de Serviço Criada",
        description: `OS #${docRef.id.slice(0, 8)} criada com sucesso`,
      });

      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar ordem de serviço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a ordem de serviço",
        variant: "destructive"
      });
      throw error;
    }
  };

  /**
   * Verificar se há tarefas atrasadas
   */
  const verificarTarefasAtrasadas = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return tarefasPendentes.filter(t => {
      const dataExecucao = new Date(t.proximaExecucao);
      return dataExecucao < hoje;
    });
  };

  /**
   * Obter próxima manutenção da máquina
   */
  const getProximaManutencao = () => {
    if (proximasManutencoes.length === 0) return null;

    return proximasManutencoes.reduce((prev, curr) => {
      const prevData = new Date(prev.proximaExecucao);
      const currData = new Date(curr.proximaExecucao);
      return currData < prevData ? curr : prev;
    });
  };

  return {
    tarefasPendentes,
    proximasManutencoes,
    tarefasAtrasadas: verificarTarefasAtrasadas(),
    proximaManutencao: getProximaManutencao(),
    criarOrdemServico
  };
};
