import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { AlertaManutencao } from "@/types/typesAlertasManutencao";

interface ManutencaoAlertsContextType {
  alertas: AlertaManutencao[];
  alertasNaoLidos: number;
  alertasCriticos: AlertaManutencao[];
  carregando: boolean;
  marcarComoLido: (alertaId: string) => Promise<void>;
  marcarTodosComoLidos: () => Promise<void>;
}

const ManutencaoAlertsContext = createContext<ManutencaoAlertsContextType | undefined>(undefined);

export const ManutencaoAlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alertas, setAlertas] = useState<AlertaManutencao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Listener para alertas em tempo real
    const alertasRef = collection(db, "alertas_manutencao");
    const q = query(
      alertasRef,
      where("lido", "==", false),
      orderBy("urgencia", "desc"),
      orderBy("diasRestantes", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const novosAlertas: AlertaManutencao[] = [];
        snapshot.forEach((doc) => {
          novosAlertas.push({
            id: doc.id,
            ...doc.data(),
          } as AlertaManutencao);
        });
        setAlertas(novosAlertas);
        setCarregando(false);
      },
      (error) => {
        console.error("Erro ao carregar alertas:", error);
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const alertasNaoLidos = alertas.filter((a) => !a.lido).length;
  const alertasCriticos = alertas.filter((a) => a.urgencia === "critico");

  const marcarComoLido = async (alertaId: string) => {
    const { updateDoc, doc } = await import("firebase/firestore");
    await updateDoc(doc(db, "alertas_manutencao", alertaId), {
      lido: true,
      atualizadoEm: Timestamp.now(),
    });
  };

  const marcarTodosComoLidos = async () => {
    const { writeBatch, doc } = await import("firebase/firestore");
    const batch = writeBatch(db);
    alertas.forEach((alerta) => {
      if (!alerta.lido) {
        batch.update(doc(db, "alertas_manutencao", alerta.id), {
          lido: true,
          atualizadoEm: Timestamp.now(),
        });
      }
    });
    await batch.commit();
  };

  return (
    <ManutencaoAlertsContext.Provider
      value={{
        alertas,
        alertasNaoLidos,
        alertasCriticos,
        carregando,
        marcarComoLido,
        marcarTodosComoLidos,
      }}
    >
      {children}
    </ManutencaoAlertsContext.Provider>
  );
};

export const useManutencaoAlerts = () => {
  const context = useContext(ManutencaoAlertsContext);
  if (!context) {
    throw new Error("useManutencaoAlerts deve ser usado dentro de ManutencaoAlertsProvider");
  }
  return context;
};
