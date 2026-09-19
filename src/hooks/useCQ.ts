import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CQService, computeKPIs, type CQQueryOptions } from "@/services/cq/CQService";
import {
  CQ_COLLECTIONS,
  type CQAcaoCorretiva,
  type CQAgendamento,
  type CQCadastro,
  type CQConfiguracoes,
  type CQExecucao,
  type CQFiltroPeriodo,
  type CQKPIs,
  type CQLote,
  type CQMelhoriaContinua,
  type CQModeloPlanilha,
  type CQNaoConformidade,
  type CQPlanoAmostragem,
} from "@/types/typesCQ";

type WithId<T> = T & { id: string };

/* ------------------------------------------------------------------ */
/* Identidade do usuário atual (para auditoria)                        */
/* ------------------------------------------------------------------ */
export function useCQUsuario() {
  const { user, userData } = useAuth();
  return useMemo(
    () => ({
      uid: user?.uid || "",
      nome: userData?.nome || user?.displayName || user?.email || "Usuário",
      perfil: userData?.perfil || "",
      cargo: userData?.cargo || "",
    }),
    [user, userData],
  );
}

/* ------------------------------------------------------------------ */
/* Hook genérico com assinatura em tempo real + CRUD auditado          */
/* ------------------------------------------------------------------ */
export interface UseCQCollectionResult<T> {
  data: WithId<T>[];
  loading: boolean;
  error: string | null;
  criar: (payload: Partial<T>) => Promise<string>;
  atualizar: (id: string, payload: Partial<T>) => Promise<string>;
  novaVersao: (id: string, payload: Partial<T>) => Promise<string>;
  desativar: (id: string) => Promise<void>;
  atualizarEmLote: (ids: string[], payload: Partial<T>) => Promise<void>;
  recarregar: () => Promise<void>;
}

export function useCQCollection<T>(
  colecao: string,
  options: CQQueryOptions = {},
  opts: { realtime?: boolean; enabled?: boolean } = {},
): UseCQCollectionResult<T> {
  const { realtime = true, enabled = true } = opts;
  const { uid, nome } = useCQUsuario();
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  // Serializa as options para dependência estável
  const optionsKey = JSON.stringify(options, (_k, v) =>
    v instanceof Date ? v.toISOString() : v,
  );
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const carregar = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const items = await CQService.list<T>(colecao, optionsRef.current);
      setData(items);
      setError(null);
    } catch (e) {
      console.error(`[useCQCollection] ${colecao}:`, e);
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [colecao, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!realtime) {
      void carregar();
      return;
    }

    setLoading(true);
    const unsubscribe = CQService.subscribe<T>(
      colecao,
      optionsRef.current,
      (items) => {
        setData(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colecao, optionsKey, realtime, enabled, carregar]);

  const criar = useCallback(
    (payload: Partial<T>) => CQService.createDocument(colecao, payload, uid, nome),
    [colecao, uid, nome],
  );

  const atualizar = useCallback(
    (id: string, payload: Partial<T>) =>
      CQService.updateDocument(colecao, id, payload as Record<string, unknown>, uid, nome),
    [colecao, uid, nome],
  );

  const novaVersao = useCallback(
    (id: string, payload: Partial<T>) =>
      CQService.createNewVersion(colecao, id, payload, uid, nome),
    [colecao, uid, nome],
  );

  const desativar = useCallback(
    (id: string) => CQService.deactivateDocument(colecao, id, uid, nome),
    [colecao, uid, nome],
  );

  const atualizarEmLote = useCallback(
    (ids: string[], payload: Partial<T>) =>
      CQService.batchUpdate(colecao, ids, payload as Record<string, unknown>, uid, nome),
    [colecao, uid, nome],
  );

  return { data, loading, error, criar, atualizar, novaVersao, desativar, atualizarEmLote, recarregar: carregar };
}

/* ------------------------------------------------------------------ */
/* Hooks especializados por coleção                                    */
/* ------------------------------------------------------------------ */
export const useCQCadastros = (options?: CQQueryOptions) =>
  useCQCollection<CQCadastro>(CQ_COLLECTIONS.cadastros, options);

export const useCQModelos = (options?: CQQueryOptions) =>
  useCQCollection<CQModeloPlanilha>(CQ_COLLECTIONS.modelos, options);

export const useCQPlanosAmostragem = (options?: CQQueryOptions) =>
  useCQCollection<CQPlanoAmostragem>(CQ_COLLECTIONS.planosAmostragem, options);

export const useCQAgendamentos = (options?: CQQueryOptions) =>
  useCQCollection<CQAgendamento>(CQ_COLLECTIONS.agendamentos, {
    ordenarPor: "data_prevista",
    direcao: "asc",
    ...options,
  });

export const useCQExecucoes = (options?: CQQueryOptions) =>
  useCQCollection<CQExecucao>(CQ_COLLECTIONS.execucoes, { ordenarPor: "criado_em", ...options });

export const useCQNaoConformidades = (options?: CQQueryOptions) =>
  useCQCollection<CQNaoConformidade>(CQ_COLLECTIONS.naoConformidades, {
    ordenarPor: "criado_em",
    ...options,
  });

export const useCQAcoesCorretivas = (options?: CQQueryOptions) =>
  useCQCollection<CQAcaoCorretiva>(CQ_COLLECTIONS.acoesCorretivas, {
    ordenarPor: "criado_em",
    ...options,
  });

export const useCQMelhoriaContinua = (options?: CQQueryOptions) =>
  useCQCollection<CQMelhoriaContinua>(CQ_COLLECTIONS.melhoriaContinua, options);

export const useCQLotes = (options?: CQQueryOptions) =>
  useCQCollection<CQLote>(CQ_COLLECTIONS.lotes, options);

export const useCQConfiguracoes = (options?: CQQueryOptions) =>
  useCQCollection<CQConfiguracoes>(CQ_COLLECTIONS.configuracoes, options);

/* ------------------------------------------------------------------ */
/* KPIs do módulo (dashboard) — em tempo real                          */
/* ------------------------------------------------------------------ */
export function useCQKPIs(filtro: CQFiltroPeriodo = {}) {
  const filtroKey = JSON.stringify(filtro, (_k, v) => (v instanceof Date ? v.toISOString() : v));

  const baseOptions = useMemo<CQQueryOptions>(
    () => ({
      filtros: {
        setor: filtro.setor,
        turno: filtro.turno,
        responsavel_id: filtro.responsavel_id,
      },
      inicio: filtro.inicio,
      fim: filtro.fim,
      campoData: filtro.inicio || filtro.fim ? "criado_em" : undefined,
      ordenarPor: "criado_em",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtroKey],
  );

  const execucoes = useCQCollection<CQExecucao>(CQ_COLLECTIONS.execucoes, baseOptions);
  const ncs = useCQCollection<CQNaoConformidade>(CQ_COLLECTIONS.naoConformidades, baseOptions);
  const acoes = useCQCollection<CQAcaoCorretiva>(CQ_COLLECTIONS.acoesCorretivas, {
    ordenarPor: "criado_em",
  });
  const agendamentos = useCQCollection<CQAgendamento>(CQ_COLLECTIONS.agendamentos, {
    ordenarPor: "data_prevista",
    direcao: "asc",
  });

  const kpis: CQKPIs = useMemo(
    () =>
      computeKPIs({
        execucoes: execucoes.data,
        ncs: ncs.data,
        acoes: acoes.data,
        agendamentos: agendamentos.data,
      }),
    [execucoes.data, ncs.data, acoes.data, agendamentos.data],
  );

  return {
    kpis,
    execucoes: execucoes.data,
    ncs: ncs.data,
    acoes: acoes.data,
    agendamentos: agendamentos.data,
    loading: execucoes.loading || ncs.loading || acoes.loading || agendamentos.loading,
    error: execucoes.error || ncs.error || acoes.error || agendamentos.error,
  };
}

/* ------------------------------------------------------------------ */
/* Documento único + trilha de auditoria                               */
/* ------------------------------------------------------------------ */
export function useCQDocumento<T>(colecao: string, id?: string) {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setData(await CQService.getById<T>(colecao, id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar documento");
    } finally {
      setLoading(false);
    }
  }, [colecao, id]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { data, loading, error, recarregar: carregar };
}

export function useCQAuditoria(entidadeId?: string, limite = 50) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(!!entidadeId);

  useEffect(() => {
    let ativo = true;
    if (!entidadeId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    CQService.getAuditTrail(entidadeId, limite)
      .then((items) => ativo && setData(items as Record<string, unknown>[]))
      .catch((e) => console.error("[useCQAuditoria]", e))
      .finally(() => ativo && setLoading(false));
    return () => {
      ativo = false;
    };
  }, [entidadeId, limite]);

  return { data, loading };
}
