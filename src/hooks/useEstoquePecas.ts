import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";

export interface EstoqueItem {
  quantidade: number;
  quantidadeMinima: number;
  nome: string;
}

const normalizar = (valor?: string) =>
  (valor || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Indexa a coleção real `produtos` por código de estoque, código de material e nome,
 * permitindo cruzar o estoque do almoxarifado com as peças/sub-peças cadastradas
 * nos equipamentos. Tolerante a falha: quando não há correspondência, o consumidor
 * usa o `emEstoque` do próprio cadastro da peça.
 */
export const useEstoquePecas = () => {
  const [indice, setIndice] = useState<Map<string, EstoqueItem>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        const snapshot = await getDocs(collection(db, "produtos"));
        const mapa = new Map<string, EstoqueItem>();
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const item: EstoqueItem = {
            quantidade: Number(data.quantidade) || 0,
            quantidadeMinima: Number(data.quantidade_minima) || 0,
            nome: (data.nome as string) || "",
          };
          [data.codigo_estoque, data.codigo_material, data.nome].forEach((chave) => {
            const key = normalizar(chave as string);
            if (key && !mapa.has(key)) mapa.set(key, item);
          });
        });
        if (ativo) setIndice(mapa);
      } catch (error) {
        console.error("Erro ao carregar estoque de peças:", error);
      } finally {
        if (ativo) setLoading(false);
      }
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const buscarEstoque = useMemo(
    () =>
      (codigo?: string, nome?: string): EstoqueItem | null => {
        const porCodigo = indice.get(normalizar(codigo));
        if (porCodigo) return porCodigo;
        const porNome = indice.get(normalizar(nome));
        return porNome || null;
      },
    [indice]
  );

  return { buscarEstoque, loading, totalIndexado: indice.size };
};