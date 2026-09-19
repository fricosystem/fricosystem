import { useEffect, useMemo, useState, useCallback } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useManutencaoAlerts } from "@/contexts/ManutencaoAlertsContext";

export type CategoriaNotificacao =
  | "estoque"
  | "manutencao"
  | "ordens"
  | "paradas"
  | "requisicoes";

export type NivelNotificacao = "critico" | "alerta" | "info";

export interface NotificacaoSistema {
  id: string;
  categoria: CategoriaNotificacao;
  nivel: NivelNotificacao;
  titulo: string;
  descricao: string;
  data: Date | null;
  rota: string;
}

export const CATEGORIAS: { valor: CategoriaNotificacao | "todas"; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "estoque", label: "Estoque" },
  { valor: "manutencao", label: "Manutenção" },
  { valor: "ordens", label: "Ordens de Serviço" },
  { valor: "paradas", label: "Paradas" },
  { valor: "requisicoes", label: "Requisições" },
];

const toDate = (valor: any): Date | null => {
  if (!valor) return null;
  if (typeof valor?.toDate === "function") return valor.toDate();
  if (valor instanceof Date) return valor;
  const parsed = new Date(valor);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const chaveLidas = (uid?: string) => `apex_notificacoes_lidas_${uid ?? "anon"}`;

export const useNotificacoesSistema = () => {
  const { user } = useAuth();
  const { alertas } = useManutencaoAlerts();

  const [estoque, setEstoque] = useState<NotificacaoSistema[]>([]);
  const [ordens, setOrdens] = useState<NotificacaoSistema[]>([]);
  const [paradas, setParadas] = useState<NotificacaoSistema[]>([]);
  const [requisicoes, setRequisicoes] = useState<NotificacaoSistema[]>([]);
  const [lidas, setLidas] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estado de leitura persistido por usuário
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(chaveLidas(user?.uid));
      setLidas(bruto ? JSON.parse(bruto) : []);
    } catch {
      setLidas([]);
    }
  }, [user?.uid]);

  const persistirLidas = useCallback(
    (ids: string[]) => {
      setLidas(ids);
      try {
        localStorage.setItem(chaveLidas(user?.uid), JSON.stringify(ids.slice(-500)));
      } catch {
        /* ignore */
      }
    },
    [user?.uid]
  );

  // Produtos abaixo do estoque mínimo
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "produtos"),
      (snap) => {
        const itens: NotificacaoSistema[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as any;
          const quantidade = Number(d.quantidade ?? 0);
          const minima = Number(d.quantidade_minima ?? 0);
          if (minima > 0 && quantidade <= minima) {
            itens.push({
              id: `estoque-${docSnap.id}-${quantidade}`,
              categoria: "estoque",
              nivel: quantidade === 0 ? "critico" : "alerta",
              titulo:
                quantidade === 0
                  ? `${d.nome ?? "Produto"} sem estoque`
                  : `${d.nome ?? "Produto"} abaixo do mínimo`,
              descricao: `Saldo ${quantidade} ${d.unidade_de_medida ?? ""} • mínimo ${minima}`,
              data: toDate(d.data_atualizacao ?? d.data_criacao),
              rota: "/produtos",
            });
          }
        });
        setEstoque(itens);
        setCarregando(false);
      },
      () => setCarregando(false)
    );
    return () => unsub();
  }, [user]);

  // Ordens de serviço recentes
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "ordens_servicos"), orderBy("criadoEm", "desc"), limit(20)),
      (snap) => {
        const itens: NotificacaoSistema[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          const status = String(d.status ?? "aberta");
          return {
            id: `os-${docSnap.id}-${status}`,
            categoria: "ordens" as const,
            nivel: status.toLowerCase().includes("conclu") ? "info" : "alerta",
            titulo: `OS ${d.equipamento ?? "equipamento"} • ${status}`,
            descricao: d.descricaoMotivo || d.setor || "Ordem de serviço atualizada",
            data: toDate(d.criadoEm),
            rota: "/ordens-servico",
          };
        });
        setOrdens(itens);
      },
      () => setOrdens([])
    );
    return () => unsub();
  }, [user]);

  // Paradas de máquina recentes
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "paradas_maquina"), orderBy("criadoEm", "desc"), limit(20)),
      (snap) => {
        const itens: NotificacaoSistema[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          const status = String(d.status ?? "aguardando");
          const emAberto = !status.startsWith("concluido") && status !== "cancelado";
          return {
            id: `parada-${docSnap.id}-${status}`,
            categoria: "paradas" as const,
            nivel: emAberto ? "critico" : "info",
            titulo: `Parada ${d.equipamento ?? ""} • ${status.replace(/_/g, " ")}`,
            descricao: d.descricaoMotivo || d.setor || "Parada de máquina atualizada",
            data: toDate(d.criadoEm),
            rota: "/parada-maquina",
          };
        });
        setParadas(itens);
      },
      () => setParadas([])
    );
    return () => unsub();
  }, [user]);

  // Requisições recentes
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "requisicoes"), orderBy("data_criacao", "desc"), limit(20)),
      (snap) => {
        const itens: NotificacaoSistema[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          const status = String(d.status ?? "pendente");
          return {
            id: `req-${docSnap.id}-${status}`,
            categoria: "requisicoes" as const,
            nivel: status.toLowerCase() === "pendente" ? "alerta" : "info",
            titulo: `Requisição ${d.requisicao_id ?? docSnap.id.slice(0, 6)} • ${status}`,
            descricao: `${d.itens?.length ?? 0} item(ns) • R$ ${Number(d.valor_total ?? 0).toFixed(2)}`,
            data: toDate(d.data_criacao),
            rota: "/requisicoes",
          };
        });
        setRequisicoes(itens);
      },
      () => setRequisicoes([])
    );
    return () => unsub();
  }, [user]);

  const notificacoes = useMemo(() => {
    const manutencao: NotificacaoSistema[] = alertas.map((a) => ({
      id: `manut-${a.id}`,
      categoria: "manutencao",
      nivel: a.urgencia === "critico" ? "critico" : a.urgencia === "baixo" ? "info" : "alerta",
      titulo: `${a.tarefaNome} • ${a.maquinaNome}`,
      descricao:
        a.diasRestantes === 0
          ? "Preventiva vence hoje"
          : a.diasRestantes < 0
          ? `Preventiva atrasada em ${Math.abs(a.diasRestantes)} dia(s)`
          : `Preventiva em ${a.diasRestantes} dia(s)`,
      data: toDate(a.criadoEm),
      rota: "/manutencao-preventiva",
    }));

    return [...manutencao, ...estoque, ...ordens, ...paradas, ...requisicoes].sort(
      (a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0)
    );
  }, [alertas, estoque, ordens, paradas, requisicoes]);

  const naoLidas = useMemo(
    () => notificacoes.filter((n) => !lidas.includes(n.id)),
    [notificacoes, lidas]
  );

  const marcarComoLida = useCallback(
    (id: string) => {
      if (lidas.includes(id)) return;
      persistirLidas([...lidas, id]);
    },
    [lidas, persistirLidas]
  );

  const marcarTodasComoLidas = useCallback(() => {
    persistirLidas(Array.from(new Set([...lidas, ...notificacoes.map((n) => n.id)])));
  }, [lidas, notificacoes, persistirLidas]);

  const estaLida = useCallback((id: string) => lidas.includes(id), [lidas]);

  return {
    notificacoes,
    naoLidas,
    totalNaoLidas: naoLidas.length,
    carregando,
    marcarComoLida,
    marcarTodasComoLidas,
    estaLida,
  };
};
