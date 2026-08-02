import { useState, useEffect } from "react";
import { db } from "@/firebase/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { Reuniao, NovaReuniao } from "@/types/reuniao";
import { useToast } from "@/hooks/use-toast";

export function useReunioes() {
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "reunioes"), orderBy("dataInicio", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reunioesData: Reuniao[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reunioesData.push({
          id: doc.id,
          tema: data.tema,
          detalhes: data.detalhes,
          dataInicio: data.dataInicio.toDate(),
          dataFim: data.dataFim.toDate(),
          participantes: data.participantes,
          criadoPor: data.criadoPor,
          criadoEm: data.criadoEm.toDate(),
        });
      });
      setReunioes(reunioesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const adicionarReuniao = async (novaReuniao: NovaReuniao, usuarioId: string) => {
    try {
      await addDoc(collection(db, "reunioes"), {
        ...novaReuniao,
        criadoPor: usuarioId,
        criadoEm: new Date(),
      });
      toast({
        title: "Reunião criada",
        description: "A reunião foi agendada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao criar reunião:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a reunião.",
        variant: "destructive",
      });
    }
  };

  const atualizarReuniao = async (id: string, reuniaoAtualizada: Partial<Reuniao>) => {
    try {
      await updateDoc(doc(db, "reunioes", id), reuniaoAtualizada);
      toast({
        title: "Reunião atualizada",
        description: "As informações da reunião foram atualizadas.",
      });
    } catch (error) {
      console.error("Erro ao atualizar reunião:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a reunião.",
        variant: "destructive",
      });
    }
  };

  const excluirReuniao = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reunioes", id));
      toast({
        title: "Reunião excluída",
        description: "A reunião foi removida com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir reunião:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a reunião.",
        variant: "destructive",
      });
    }
  };

  return {
    reunioes,
    loading,
    adicionarReuniao,
    atualizarReuniao,
    excluirReuniao,
  };
}