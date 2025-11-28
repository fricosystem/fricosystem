import { useQuery } from "@tanstack/react-query";
import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { TipoManutencao } from "@/types/typesManutencaoPreventiva";

export interface Manutentor {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  funcao: TipoManutencao;
  ativo: boolean;
}

const getManutentores = async (): Promise<Manutentor[]> => {
  const col = collection(db, "manutentores");
  const querySnapshot = await getDocs(col);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Manutentor[];
};

export function useManutentores() {
  return useQuery({
    queryKey: ["manutentores"],
    queryFn: getManutentores
  });
}
