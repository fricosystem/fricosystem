import { useMemo } from "react";
import {
  avaliarComponente,
  riscoMaisCritico,
  type AvaliacaoComponente,
  type NivelRisco,
} from "@/utils/vidaUtilPeca";
import type { EstoqueItem } from "./useEstoquePecas";

export type TipoNo = "sistema" | "peca" | "subpeca";

export interface NoArvore {
  id: string;
  tipo: TipoNo;
  nome: string;
  codigo?: string;
  categoria?: string;
  avaliacao: AvaliacaoComponente;
  riscoAgregado: NivelRisco;
  emEstoque: number | null;
  estoqueMinimo: number | null;
  estoqueDoAlmoxarifado: boolean;
  filhos: NoArvore[];
  /** Referência ao objeto original para reutilizar os handlers existentes. */
  origem: any;
  /** Id do sistema ao qual o nó pertence. */
  sistemaId: string;
  /** Id da peça pai, quando for sub-peça. */
  pecaPaiId?: string;
}

export interface ResumoArvore {
  totalSistemas: number;
  totalPecas: number;
  totalSubPecas: number;
  criticos: number;
  semEstoque: number;
  preventivasProximas: number;
  riscoDeParada: number;
}

type BuscarEstoque = (codigo?: string, nome?: string) => EstoqueItem | null;

const resolverEstoque = (
  item: { codigo?: string; nome?: string; emEstoque?: number; estoqueMinimo?: number },
  buscarEstoque?: BuscarEstoque
) => {
  const doAlmoxarifado = buscarEstoque?.(item.codigo, item.nome) || null;
  const emEstoque = doAlmoxarifado
    ? doAlmoxarifado.quantidade
    : Number.isFinite(Number(item.emEstoque))
    ? Number(item.emEstoque)
    : null;
  const estoqueMinimo = Number.isFinite(Number(item.estoqueMinimo))
    ? Number(item.estoqueMinimo)
    : doAlmoxarifado?.quantidadeMinima ?? null;
  return { emEstoque, estoqueMinimo, estoqueDoAlmoxarifado: !!doAlmoxarifado };
};

/**
 * Monta a árvore Sistema → Peça → Sub-peça de uma máquina a partir dos dados
 * reais do documento `equipamentos`, cruzando o estoque com a coleção `produtos`
 * e propagando o risco do filho mais crítico para o nó pai.
 */
export const construirArvore = (
  sistemas: any[],
  buscarEstoque?: BuscarEstoque
): NoArvore[] =>
  (sistemas || []).map((sistema) => {
    const pecas: NoArvore[] = (sistema.pecas || []).map((peca: any) => {
      const subPecas: NoArvore[] = (peca.subPecas || []).map((sub: any) => {
        const estoque = resolverEstoque(sub, buscarEstoque);
        const avaliacao = avaliarComponente({
          vidaUtil: sub.vidaUtil,
          vidaUtilRestante: sub.vidaUtilRestante,
          proximaManutencao: sub.proximaManutencao,
          emEstoque: estoque.emEstoque ?? undefined,
          estoqueMinimo: estoque.estoqueMinimo ?? undefined,
          status: sub.status,
        });
        return {
          id: sub.id,
          tipo: "subpeca" as const,
          nome: sub.nome || "Sub-peça",
          codigo: sub.codigo,
          avaliacao,
          riscoAgregado: avaliacao.risco,
          emEstoque: estoque.emEstoque,
          estoqueMinimo: estoque.estoqueMinimo,
          estoqueDoAlmoxarifado: estoque.estoqueDoAlmoxarifado,
          filhos: [],
          origem: sub,
          sistemaId: sistema.id,
          pecaPaiId: peca.id,
        };
      });

      const estoque = resolverEstoque(peca, buscarEstoque);
      const avaliacao = avaliarComponente({
        vidaUtil: peca.vidaUtil,
        vidaUtilRestante: peca.vidaUtilRestante,
        proximaManutencao: peca.proximaManutencao,
        emEstoque: estoque.emEstoque ?? undefined,
        estoqueMinimo: estoque.estoqueMinimo ?? undefined,
        status: peca.status,
      });

      return {
        id: peca.id,
        tipo: "peca" as const,
        nome: peca.nome || "Peça",
        codigo: peca.codigo,
        categoria: peca.categoria,
        avaliacao,
        riscoAgregado: riscoMaisCritico([
          avaliacao.risco,
          ...subPecas.map((s) => s.riscoAgregado),
        ]),
        emEstoque: estoque.emEstoque,
        estoqueMinimo: estoque.estoqueMinimo,
        estoqueDoAlmoxarifado: estoque.estoqueDoAlmoxarifado,
        filhos: subPecas,
        origem: peca,
        sistemaId: sistema.id,
      };
    });

    const avaliacaoSistema = avaliarComponente({ status: sistema.status });

    return {
      id: sistema.id,
      tipo: "sistema" as const,
      nome: sistema.nome || "Sistema",
      codigo: sistema.tipo,
      avaliacao: avaliacaoSistema,
      riscoAgregado: riscoMaisCritico([
        avaliacaoSistema.risco,
        ...pecas.map((p) => p.riscoAgregado),
      ]),
      emEstoque: null,
      estoqueMinimo: null,
      estoqueDoAlmoxarifado: false,
      filhos: pecas,
      origem: sistema,
      sistemaId: sistema.id,
    };
  });

export const resumirArvore = (nos: NoArvore[]): ResumoArvore => {
  const resumo: ResumoArvore = {
    totalSistemas: nos.length,
    totalPecas: 0,
    totalSubPecas: 0,
    criticos: 0,
    semEstoque: 0,
    preventivasProximas: 0,
    riscoDeParada: 0,
  };

  const percorrer = (lista: NoArvore[]) => {
    lista.forEach((no) => {
      if (no.tipo === "peca") resumo.totalPecas++;
      if (no.tipo === "subpeca") resumo.totalSubPecas++;
      if (no.tipo !== "sistema") {
        if (no.avaliacao.risco === "Crítico") resumo.criticos++;
        if (no.avaliacao.semEstoque) resumo.semEstoque++;
        if (no.avaliacao.manutencaoProxima || no.avaliacao.manutencaoVencida)
          resumo.preventivasProximas++;
        if (no.avaliacao.riscoDeParada) resumo.riscoDeParada++;
      }
      percorrer(no.filhos);
    });
  };
  percorrer(nos);
  return resumo;
};

/** Filtra a árvore por texto (nome ou código), mantendo os pais dos nós encontrados. */
export const filtrarArvore = (nos: NoArvore[], termo: string): NoArvore[] => {
  const busca = termo.trim().toLowerCase();
  if (!busca) return nos;
  const corresponde = (no: NoArvore) =>
    no.nome.toLowerCase().includes(busca) || (no.codigo || "").toLowerCase().includes(busca);

  const filtrar = (lista: NoArvore[]): NoArvore[] =>
    lista
      .map((no) => {
        const filhos = filtrar(no.filhos);
        if (corresponde(no) || filhos.length > 0) return { ...no, filhos };
        return null;
      })
      .filter(Boolean) as NoArvore[];

  return filtrar(nos);
};

export const useArvoreSetor = (sistemas: any[], buscarEstoque?: BuscarEstoque) => {
  const arvore = useMemo(() => construirArvore(sistemas, buscarEstoque), [sistemas, buscarEstoque]);
  const resumo = useMemo(() => resumirArvore(arvore), [arvore]);
  return { arvore, resumo };
};