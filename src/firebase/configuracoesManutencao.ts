import { 
  collection, 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  ConfiguracaoEmpresa, 
  TipoManutencaoCustom, 
  PeriodoCustomizado,
  CategoriaEquipamento,
  ChecklistPadrao,
  TIPOS_MANUTENCAO_PADRAO,
  PERIODOS_DIAS
} from "@/types/typesManutencaoPreventiva";

const CONFIG_DOC_ID = "empresa_config";

// Configuração padrão inicial
const configuracaoPadrao: Omit<ConfiguracaoEmpresa, "id" | "criadoEm" | "atualizadoEm"> = {
  tiposManutencao: TIPOS_MANUTENCAO_PADRAO.map((tipo, index) => ({
    id: `tipo_${index}`,
    nome: tipo,
    cor: getCorPadrao(tipo),
    ativo: true
  })),
  periodosCustomizados: Object.entries(PERIODOS_DIAS).map(([nome, dias], index) => ({
    id: `periodo_${index}`,
    nome,
    dias,
    ativo: true
  })),
  categoriasEquipamento: [
    { id: "cat_1", nome: "Produção", cor: "hsl(var(--primary))", ativo: true },
    { id: "cat_2", nome: "Utilidades", cor: "hsl(var(--secondary))", ativo: true },
    { id: "cat_3", nome: "Auxiliar", cor: "hsl(var(--accent))", ativo: true }
  ],
  checklistsPadrao: []
};

function getCorPadrao(tipo: string): string {
  const cores: { [key: string]: string } = {
    "Elétrica": "#fbbf24",
    "Mecânica": "#3b82f6",
    "Hidráulica": "#06b6d4",
    "Pneumática": "#8b5cf6",
    "Lubrificação": "#10b981",
    "Calibração": "#f59e0b",
    "Inspeção": "#6366f1"
  };
  return cores[tipo] || "#6b7280";
}

export const getConfiguracaoEmpresa = async (): Promise<ConfiguracaoEmpresa> => {
  try {
    const docRef = doc(db, "configuracoes_manutencao", CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ConfiguracaoEmpresa;
    }
    
    // Se não existe, criar configuração padrão
    await setDoc(docRef, {
      ...configuracaoPadrao,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
    
    const novoDocSnap = await getDoc(docRef);
    return { id: novoDocSnap.id, ...novoDocSnap.data() } as ConfiguracaoEmpresa;
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
    throw error;
  }
};

export const atualizarTiposManutencao = async (tipos: TipoManutencaoCustom[]) => {
  try {
    const docRef = doc(db, "configuracoes_manutencao", CONFIG_DOC_ID);
    await updateDoc(docRef, {
      tiposManutencao: tipos,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar tipos:", error);
    throw error;
  }
};

export const atualizarPeriodosCustomizados = async (periodos: PeriodoCustomizado[]) => {
  try {
    const docRef = doc(db, "configuracoes_manutencao", CONFIG_DOC_ID);
    await updateDoc(docRef, {
      periodosCustomizados: periodos,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar períodos:", error);
    throw error;
  }
};

export const atualizarCategoriasEquipamento = async (categorias: CategoriaEquipamento[]) => {
  try {
    const docRef = doc(db, "configuracoes_manutencao", CONFIG_DOC_ID);
    await updateDoc(docRef, {
      categoriasEquipamento: categorias,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar categorias:", error);
    throw error;
  }
};

export const atualizarChecklistsPadrao = async (checklists: ChecklistPadrao[]) => {
  try {
    const docRef = doc(db, "configuracoes_manutencao", CONFIG_DOC_ID);
    await updateDoc(docRef, {
      checklistsPadrao: checklists,
      atualizadoEm: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar checklists:", error);
    throw error;
  }
};
