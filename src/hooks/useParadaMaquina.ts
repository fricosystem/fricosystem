import { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp,
  orderBy,
  getDoc
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  ParadaMaquina, 
  StatusParada, 
  HistoricoAcao,
  podeIniciarExecucao,
  verificarAtraso,
  getProximoStatusVerificacao,
  getStatusConcluido,
  isStatusConcluido,
  isStatusAguardandoVerificacao
} from "@/types/typesParadaMaquina";
import { calcularProximaManutencao } from "@/utils/manutencaoUtils";
import { v4 as uuidv4 } from "uuid";

export const useParadaMaquina = () => {
  const { user, userData } = useAuth();
  const [paradas, setParadas] = useState<ParadaMaquina[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar paradas em tempo real
  useEffect(() => {
    const q = query(
      collection(db, "paradas_maquina"),
      orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ParadaMaquina));
      
      setParadas(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar paradas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Criar nova entrada no histórico
  const criarHistorico = (
    acao: HistoricoAcao["acao"],
    statusAnterior: StatusParada,
    statusNovo: StatusParada,
    observacao?: string,
    tentativa?: number
  ): HistoricoAcao => ({
    id: uuidv4(),
    acao,
    userId: user?.uid || "",
    userName: userData?.nome || "Usuário",
    timestamp: Timestamp.now(),
    observacao,
    tentativa,
    statusAnterior,
    statusNovo
  });

  // Iniciar execução (Manutentor)
  const iniciarExecucao = async (paradaId: string) => {
    const parada = paradas.find(p => p.id === paradaId);
    if (!parada) {
      toast.error("Parada não encontrada");
      return false;
    }

    // Verificar regra dos 5 minutos
    const { pode, mensagem } = podeIniciarExecucao(parada.horarioProgramado);
    if (!pode) {
      toast.error(mensagem);
      return false;
    }

    const atrasado = verificarAtraso(parada.horarioProgramado);
    const novoHistorico = criarHistorico(
      "iniciado",
      parada.status,
      "em_andamento",
      atrasado ? "Execução iniciada com atraso" : undefined,
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      await updateDoc(paradaRef, {
        status: "em_andamento",
        manutentorId: user?.uid,
        manutentorNome: userData?.nome,
        horarioExecucaoInicio: Timestamp.now(),
        atrasado,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      toast.success("Execução iniciada!");
      return true;
    } catch (error) {
      console.error("Erro ao iniciar execução:", error);
      toast.error("Erro ao iniciar execução");
      return false;
    }
  };

  // Finalizar execução (Manutentor) - NÃO conclui automaticamente
  const finalizarExecucao = async (paradaId: string, solucaoAplicada: string) => {
    const parada = paradas.find(p => p.id === paradaId);
    if (!parada) {
      toast.error("Parada não encontrada");
      return false;
    }

    if (!solucaoAplicada.trim()) {
      toast.error("Informe a solução aplicada");
      return false;
    }

    const proximoStatus = getProximoStatusVerificacao(parada.tentativaAtual);
    const novoHistorico = criarHistorico(
      "finalizado",
      parada.status,
      proximoStatus,
      solucaoAplicada,
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      await updateDoc(paradaRef, {
        status: proximoStatus,
        horarioExecucaoFim: Timestamp.now(),
        solucaoAplicada,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      toast.success("Execução finalizada! Aguardando verificação do encarregado.");
      return true;
    } catch (error) {
      console.error("Erro ao finalizar execução:", error);
      toast.error("Erro ao finalizar execução");
      return false;
    }
  };

  // Verificar e aprovar (Encarregado)
  const verificarConcluido = async (paradaId: string, observacao?: string) => {
    const parada = paradas.find(p => p.id === paradaId);
    if (!parada) {
      toast.error("Parada não encontrada");
      return false;
    }

    const statusConcluido = getStatusConcluido(parada.tentativaAtual);
    const novoHistorico = criarHistorico(
      "verificado_ok",
      parada.status,
      statusConcluido,
      observacao || "Manutenção verificada e aprovada",
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      await updateDoc(paradaRef, {
        status: statusConcluido,
        observacaoVerificacao: observacao,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      // Atualizar peça se necessário
      if (parada.pecaId || parada.subPecaId) {
        await atualizarManutencaoPeca(parada, paradaId);
      }

      toast.success("Manutenção verificada e aprovada!");
      return true;
    } catch (error) {
      console.error("Erro ao verificar:", error);
      toast.error("Erro ao verificar manutenção");
      return false;
    }
  };

  // Verificar e reprovar (Encarregado) - volta para manutentor
  const verificarNaoConcluido = async (paradaId: string, observacao: string) => {
    const parada = paradas.find(p => p.id === paradaId);
    if (!parada) {
      toast.error("Parada não encontrada");
      return false;
    }

    if (!observacao.trim()) {
      toast.error("Informe o motivo da reprovação");
      return false;
    }

    const novoHistorico = criarHistorico(
      "verificado_nok",
      parada.status,
      "nao_concluido",
      observacao,
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      await updateDoc(paradaRef, {
        status: "nao_concluido",
        observacaoVerificacao: observacao,
        tentativaAtual: parada.tentativaAtual + 1,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      toast.success("Manutenção retornada para o manutentor.");
      return true;
    } catch (error) {
      console.error("Erro ao reprovar:", error);
      toast.error("Erro ao reprovar manutenção");
      return false;
    }
  };

  // Atualizar manutenção da peça
  const atualizarManutencaoPeca = async (parada: ParadaMaquina, paradaId: string) => {
    try {
      if (!parada.equipamentoId) return;
      
      const equipamentoRef = doc(db, "equipamentos", parada.equipamentoId);
      const equipamentoDoc = await getDoc(equipamentoRef);
      
      if (!equipamentoDoc.exists()) return;
      
      const equipamento = equipamentoDoc.data();
      const sistemas = equipamento.sistemas || [];
      
      const novosSistemas = sistemas.map((sistema: any) => {
        if (sistema.id !== parada.sistemaId) return sistema;
        
        const pecas = (sistema.pecas || []).map((peca: any) => {
          if (peca.id === parada.pecaId) {
            const config = peca.configuracaoManutencao;
            const dataAtual = new Date().toISOString().split('T')[0];
            
            let proximaManutencao = peca.proximaManutencao;
            if (config?.intervaloManutencao) {
              proximaManutencao = calcularProximaManutencao(
                config.intervaloManutencao,
                config.tipoIntervalo || "dias"
              );
            }
            
            return {
              ...peca,
              ultimaManutencao: dataAtual,
              proximaManutencao,
              vidaUtilRestante: peca.vidaUtil || peca.vidaUtilRestante,
              status: "Normal",
              historicoManutencoes: [...(peca.historicoManutencoes || []), paradaId]
            };
          }
          
          if (peca.subPecas && Array.isArray(peca.subPecas)) {
            const subPecas = peca.subPecas.map((subPeca: any) => {
              if (subPeca.id === parada.subPecaId) {
                const config = subPeca.configuracaoManutencao;
                const dataAtual = new Date().toISOString().split('T')[0];
                
                let proximaManutencao = subPeca.proximaManutencao;
                if (config?.intervaloManutencao) {
                  proximaManutencao = calcularProximaManutencao(
                    config.intervaloManutencao,
                    config.tipoIntervalo || "dias"
                  );
                }
                
                return {
                  ...subPeca,
                  ultimaManutencao: dataAtual,
                  proximaManutencao,
                  vidaUtilRestante: subPeca.vidaUtil || subPeca.vidaUtilRestante,
                  status: "Normal",
                  historicoManutencoes: [...(subPeca.historicoManutencoes || []), paradaId]
                };
              }
              return subPeca;
            });
            
            return { ...peca, subPecas };
          }
          
          return peca;
        });
        
        return { ...sistema, pecas };
      });
      
      await updateDoc(equipamentoRef, {
        sistemas: novosSistemas
      });
    } catch (error) {
      console.error("Erro ao atualizar manutenção da peça:", error);
    }
  };

  // Paradas filtradas por papel
  const paradasParaEncarregado = useMemo(() => {
    if (!user) return [];
    
    // Encarregado vê paradas que ele criou e estão aguardando verificação
    return paradas.filter(p => 
      p.criadoPor === user.uid && 
      isStatusAguardandoVerificacao(p.status)
    );
  }, [paradas, user]);

  const paradasParaManutentor = useMemo(() => {
    if (!user) return [];
    
    // Manutentor vê:
    // 1. Paradas aguardando execução
    // 2. Paradas em andamento que ele iniciou
    // 3. Paradas não concluídas que ele iniciou
    return paradas.filter(p => 
      p.status === "aguardando" ||
      (p.status === "em_andamento" && p.manutentorId === user.uid) ||
      (p.status === "nao_concluido" && p.manutentorId === user.uid)
    );
  }, [paradas, user]);

  // Paradas abertas (não concluídas)
  const paradasAbertas = useMemo(() => {
    return paradas.filter(p => !isStatusConcluido(p.status) && p.status !== "cancelado");
  }, [paradas]);

  // Paradas concluídas (histórico)
  const paradasConcluidas = useMemo(() => {
    return paradas.filter(p => isStatusConcluido(p.status));
  }, [paradas]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: paradas.length,
    aguardando: paradas.filter(p => p.status === "aguardando").length,
    emAndamento: paradas.filter(p => p.status === "em_andamento").length,
    aguardandoVerificacao: paradas.filter(p => isStatusAguardandoVerificacao(p.status)).length,
    concluidas: paradas.filter(p => isStatusConcluido(p.status)).length,
    naoConcluidas: paradas.filter(p => p.status === "nao_concluido").length
  }), [paradas]);

  return {
    paradas,
    paradasAbertas,
    paradasConcluidas,
    paradasParaEncarregado,
    paradasParaManutentor,
    loading,
    stats,
    iniciarExecucao,
    finalizarExecucao,
    verificarConcluido,
    verificarNaoConcluido
  };
};
