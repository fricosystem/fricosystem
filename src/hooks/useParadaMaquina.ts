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
  isStatusAguardandoVerificacao,
  isStatusFinalizado
} from "@/types/typesParadaMaquina";
import { calcularProximaManutencao } from "@/utils/manutencaoUtils";
import { v4 as uuidv4 } from "uuid";
import { cacheBatchData, getCachedCollection, addPendingAction } from "@/lib/offlineDB";

export const useParadaMaquina = () => {
  const { user, userData } = useAuth();
  const [paradas, setParadas] = useState<ParadaMaquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Detectar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar dados do cache quando offline
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedParadas = await getCachedCollection('paradas_maquina');
        if (cachedParadas.length > 0) {
          setParadas(cachedParadas as ParadaMaquina[]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar cache:', error);
        setLoading(false);
      }
    };

    if (isOffline) {
      loadCachedData();
    }
  }, [isOffline]);

  // Buscar paradas em tempo real
  useEffect(() => {
    if (isOffline) return;

    const q = query(
      collection(db, "paradas_maquina"),
      orderBy("criadoEm", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ParadaMaquina));
      
      setParadas(data);
      setLoading(false);

      // Salvar no cache para uso offline
      try {
        await cacheBatchData(
          'paradas_maquina',
          data.map(p => ({ id: p.id, data: p }))
        );
      } catch (error) {
        console.error('Erro ao cachear paradas:', error);
      }
    }, (error) => {
      console.error("Erro ao buscar paradas:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOffline]);

  // Verificar paradas expiradas automaticamente
  useEffect(() => {
    const verificarParadasExpiradas = async () => {
      const agora = new Date();
      const dataAtualStr = agora.toISOString().split('T')[0]; // YYYY-MM-DD
      const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
      
      for (const parada of paradas) {
        // Só verifica paradas aguardando
        if (parada.status !== "aguardando") continue;
        
        const hrFinal = parada.hrFinal;
        if (!hrFinal) continue;
        
        // Verifica se a parada expirou considerando a data programada
        let expirada = false;
        
        if (parada.dataProgramada) {
          // Se tem data programada, compara data + hora
          if (parada.dataProgramada < dataAtualStr) {
            // Data programada já passou
            expirada = true;
          } else if (parada.dataProgramada === dataAtualStr && horaAtual >= hrFinal) {
            // É hoje e a hora já passou
            expirada = true;
          }
        } else {
          // Sem data programada, considera apenas a hora do dia atual
          if (horaAtual >= hrFinal) {
            expirada = true;
          }
        }
        
        if (expirada) {
          try {
            const paradaRef = doc(db, "paradas_maquina", parada.id);
            const novoHistorico: HistoricoAcao = {
              id: uuidv4(),
              acao: "cancelado",
              userId: "sistema",
              userName: "Sistema Automático",
              timestamp: Timestamp.now(),
              observacao: "Parada não foi iniciada dentro do horário previsto",
              statusAnterior: parada.status,
              statusNovo: "nao_executada"
            };
            
            await updateDoc(paradaRef, {
              status: "nao_executada",
              historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
            });
          } catch (error) {
            console.error("Erro ao marcar parada como não executada:", error);
          }
        }
      }
    };

    // Verificar a cada minuto
    const interval = setInterval(verificarParadasExpiradas, 60000);
    // Verificar imediatamente ao carregar
    if (paradas.length > 0) {
      verificarParadasExpiradas();
    }
    
    return () => clearInterval(interval);
  }, [paradas]);

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

    // Verificar regra dos 5 minutos - suporta hrInicial e horarioProgramado
    const { pode, mensagem } = podeIniciarExecucao(
      parada.horarioProgramado,
      parada.hrInicial,
      parada.dataProgramada
    );
    if (!pode) {
      toast.info(mensagem); // Mensagem informativa, não de erro
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
      
      // Filtrar campos undefined para evitar erro do Firestore
      const updateData: Record<string, any> = {
        status: "em_andamento",
        horarioExecucaoInicio: Timestamp.now(),
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      };
      
      if (user?.uid) updateData.manutentorId = user.uid;
      if (userData?.nome) updateData.manutentorNome = userData.nome;
      if (atrasado !== undefined) updateData.atrasado = atrasado;
      
      await updateDoc(paradaRef, updateData);

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

    // Calcular tempo total decorrido em segundos
    let tempoTotalDecorrido: number | undefined;
    if (parada.horarioExecucaoInicio) {
      const inicio = parada.horarioExecucaoInicio.toDate();
      const fim = new Date();
      tempoTotalDecorrido = Math.floor((fim.getTime() - inicio.getTime()) / 1000);
    }

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      const updateData: Record<string, any> = {
        status: proximoStatus,
        horarioExecucaoFim: Timestamp.now(),
        solucaoAplicada,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      };

      if (tempoTotalDecorrido !== undefined) {
        updateData.tempoTotalDecorrido = tempoTotalDecorrido;
      }

      await updateDoc(paradaRef, updateData);

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
    // 4. Paradas aguardando verificação que ele iniciou (para marcar corrigido/não corrigido)
    return paradas.filter(p => 
      p.status === "aguardando" ||
      (p.status === "em_andamento" && p.manutentorId === user.uid) ||
      (p.status === "nao_concluido" && p.manutentorId === user.uid) ||
      (isStatusAguardandoVerificacao(p.status) && p.manutentorId === user.uid)
    );
  }, [paradas, user]);

  // Paradas abertas (não finalizadas - exclui concluídas, canceladas e não executadas)
  const paradasAbertas = useMemo(() => {
    return paradas.filter(p => !isStatusFinalizado(p.status));
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

  // Manutentor marca como corrigido (vai para concluído)
  const marcarCorrigido = async (paradaId: string) => {
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
      "Manutentor confirmou correção",
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      await updateDoc(paradaRef, {
        status: statusConcluido,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      // Atualizar peça se necessário
      if (parada.pecaId || parada.subPecaId) {
        await atualizarManutencaoPeca(parada, paradaId);
      }

      toast.success("Parada marcada como corrigida e concluída!");
      return true;
    } catch (error) {
      console.error("Erro ao marcar como corrigido:", error);
      toast.error("Erro ao marcar como corrigido");
      return false;
    }
  };

  // Manutentor marca como não corrigido (incrementa tentativa e continua)
  const marcarNaoCorrigido = async (paradaId: string) => {
    const parada = paradas.find(p => p.id === paradaId);
    if (!parada) {
      toast.error("Parada não encontrada");
      return false;
    }

    const novaTentativa = (parada.tentativaAtual || 1) + 1;
    const novoHistorico = criarHistorico(
      "reaberto",
      parada.status,
      "em_andamento",
      `Não corrigido na tentativa ${parada.tentativaAtual}. Iniciando tentativa ${novaTentativa}`,
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      
      // Mantém o horarioExecucaoInicio original para continuar contando o tempo
      await updateDoc(paradaRef, {
        status: "em_andamento",
        tentativaAtual: novaTentativa,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      toast.success(`Iniciando tentativa ${novaTentativa}. Continue a execução.`);
      return true;
    } catch (error) {
      console.error("Erro ao marcar como não corrigido:", error);
      toast.error("Erro ao marcar como não corrigido");
      return false;
    }
  };

  // Cancelar parada (Encarregado - antes da execução | Manutentor - durante execução)
  const cancelarParada = async (paradaId: string, motivo: string, canceladoPor: "encarregado" | "manutentor") => {
    const parada = paradas.find(p => p.id === paradaId);
    if (!parada) {
      toast.error("Parada não encontrada");
      return false;
    }

    // Validar se pode cancelar baseado no status e quem está cancelando
    if (canceladoPor === "encarregado" && parada.status !== "aguardando") {
      toast.error("Só é possível cancelar paradas que ainda não foram iniciadas");
      return false;
    }

    if (canceladoPor === "manutentor" && parada.status !== "em_andamento") {
      toast.error("Só é possível cancelar paradas em andamento");
      return false;
    }

    const novoHistorico = criarHistorico(
      "cancelado",
      parada.status,
      "cancelado",
      `Cancelado por ${canceladoPor}: ${motivo}`,
      parada.tentativaAtual
    );

    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      await updateDoc(paradaRef, {
        status: "cancelado",
        observacaoVerificacao: motivo,
        historicoAcoes: [...(parada.historicoAcoes || []), novoHistorico]
      });

      toast.success("Parada cancelada com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao cancelar parada:", error);
      toast.error("Erro ao cancelar parada");
      return false;
    }
  };

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
    verificarNaoConcluido,
    marcarCorrigido,
    marcarNaoCorrigido,
    cancelarParada
  };
};
