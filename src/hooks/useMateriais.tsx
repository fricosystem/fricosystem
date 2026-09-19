import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Material } from "./usePlanejamento";

interface MaterialFirestore {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
}

export const useMateriais = () => {
  const getMateriais = async (): Promise<MaterialFirestore[]> => {
    try {
      const col = collection(db, "materiais");
      const querySnapshot = await getDocs(col);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MaterialFirestore));
    } catch (error) {
      console.error("Erro ao buscar materiais:", error);
      throw error;
    }
  };

  return useQuery({
    queryKey: ["materiais"],
    queryFn: getMateriais
  });
};

export const verificarDisponibilidadeMaterial = (
  materiais: MaterialFirestore[] | undefined,
  materialNecessario: { nome: string; quantidade: number }
) => {
  if (!materiais || materiais.length === 0) return false;
  
  const materialEstoque = materiais.find(m => m.nome.toLowerCase() === materialNecessario.nome.toLowerCase());
  return materialEstoque ? materialEstoque.quantidade >= materialNecessario.quantidade : false;
};

export const gerarMateriaisNecessarios = (materiais: MaterialFirestore[] | undefined): Material[] => {
  if (!materiais || materiais.length === 0) {
    return [
      { id: 'default-1', nome: 'Leite', quantidade: 2, unidade: 'L', disponivel: true },
      { id: 'default-2', nome: 'Fermento', quantidade: 50, unidade: 'g', disponivel: false }
    ];
  }
  
  // Usar materiais reais do Firestore
  return materiais.slice(0, 3).map(m => ({
    id: m.id,
    nome: m.nome,
    quantidade: Math.floor(Math.random() * 10) + 1,
    unidade: m.unidade,
    disponivel: Math.random() > 0.3
  }));
};
