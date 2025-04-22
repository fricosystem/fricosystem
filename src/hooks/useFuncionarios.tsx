import { useQuery } from "@tanstack/react-query";
import { db } from "@/firebase/firebase";
import { collection, getDocs } from "firebase/firestore";

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  ativo: string;
  perfil: string;
  senha: string;
  tema: string;
  createdAt: { seconds: number, nanoseconds: number };
}

const getFuncionarios = async (): Promise<Funcionario[]> => {
  const col = collection(db, "usuarios");
  const querySnapshot = await getDocs(col);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Funcionario[];
};

export function useFuncionarios() {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: getFuncionarios
  });
}
