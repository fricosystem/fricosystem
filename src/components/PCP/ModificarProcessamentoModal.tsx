import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  SearchIcon, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CalendarIcon,
  Check,
  ChevronLeft
} from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProdutoPCP {
  id: string;
  codigo: string;
  descricao_produto: string;
  batch_receita_kg?: number;
  classificacao?: string;
}

interface ProdutoProcessamento {
  codigo: string;
  kg: number;
  cx: number;
  planejamento: number;
  texto_breve?: string;
  descricao?: string;
  nome?: string;
  produto?: string;
  timestamp?: Date;
  date?: string;
  descricao_produto?: string;
  id?: string;
}

interface ProcessamentoData {
  id?: string;
  documentId?: string;
  ctp1: number;
  ctp2: number;
  planoDiario: number;
  batchReceita: number;
  kgTotal: number;
  cxTotal: number;
  diferencaPR: number;
  ctptd: number;
  timestamp: Date;
  turnosProcessados: string[];
  dataProcessamento: string;
  kgTurno1?: number;
  kgTurno2?: number;
  planejadoTurno1?: number;
  planejadoTurno2?: number;
}

interface ModificarProcessamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProcessamento: ProcessamentoData | null;
  originalProcessamentoDate: string;
  onProcessamentoUpdated: () => void;
  recalcularProcessamento: (date: string) => Promise<void>;
  documentCache: Record<string, any>;
  setDocumentCache: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const ModificarProcessamentoModal: React.FC<ModificarProcessamentoModalProps> = ({
  isOpen,
  onClose,
  editingProcessamento,
  originalProcessamentoDate,
  onProcessamentoUpdated,
  recalcularProcessamento,
  documentCache,
  setDocumentCache
}) => {
  const [editedTurno1Data, setEditedTurno1Data] = useState<ProdutoProcessamento[]>([]);
  const [editedTurno2Data, setEditedTurno2Data] = useState<ProdutoProcessamento[]>([]);
  const [produtosPCP, setProdutosPCP] = useState<ProdutoPCP[]>([]);
  const [activeEditTab, setActiveEditTab] = useState<'1' | '2'>('1');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTurno1, setSearchTurno1] = useState('');
  const [searchTurno2, setSearchTurno2] = useState('');
  const [editSelectedDate, setEditSelectedDate] = useState<Date>(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showMergeButton, setShowMergeButton] = useState(false);
  const [existingDataForMerge, setExistingDataForMerge] = useState<any>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [pendingNewDate, setPendingNewDate] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState<'date-selection' | 'data-verification'>('date-selection');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [selectedTurnosToTransfer, setSelectedTurnosToTransfer] = useState<string[]>(['1', '2']);
  const [showTurnoSelectionDialog, setShowTurnoSelectionDialog] = useState(false);
  const [transferMode, setTransferMode] = useState<'merge' | 'replace'>('merge');
  const [mergeReplaceModalOpen, setMergeReplaceModalOpen] = useState(false);
  const [mergeSelectedDate, setMergeSelectedDate] = useState<Date | null>(null);
  const [mergeStep, setMergeStep] = useState<'selection' | 'turno-selection'>('selection');
  const [mergeSelectedTurnos, setMergeSelectedTurnos] = useState<{turno1: boolean, turno2: boolean}>({turno1: false, turno2: false});
  const [datesWithData, setDatesWithData] = useState<Set<string>>(new Set());
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());

  const { toast } = useToast();

  // Função para verificar datas que já possuem dados na coleção PCP
  const fetchDatesWithData = async () => {
    try {
      console.log("🔍 Carregando datas com dados da coleção PCP...");
      const querySnapshot = await getDocs(collection(db, "PCP"));
      const dates = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Verifica se há dados nos turnos para esta data
        if (data["1_turno"] && Array.isArray(data["1_turno"]) && data["1_turno"].length > 0) {
          dates.add(doc.id); // O ID do documento é a data no formato YYYY-MM-DD
        }
        if (data["2_turno"] && Array.isArray(data["2_turno"]) && data["2_turno"].length > 0) {
          dates.add(doc.id);
        }
      });
      
      console.log("📅 Datas com dados encontradas:", Array.from(dates));
      setDatesWithData(dates);
    } catch (error) {
      console.error("Erro ao verificar datas com dados:", error);
    }
  };

  // Função para buscar produtos da coleção PCP_produtos
  const fetchProdutosPCP = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP_produtos"));
      const produtosData: ProdutoPCP[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.codigo) {
          produtosData.push({
            id: doc.id,
            ...data
          } as ProdutoPCP);
        }
      });
      return produtosData;
    } catch (error) {
      console.error("Error fetching produtos PCP:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos do sistema",
        variant: "destructive"
      });
      return [];
    }
  };

  // Função para mesclar dados do processamento com produtos PCP
  const mergeProcessamentoWithPCPProducts = (
    processamentoData: any[], 
    pcpProducts: ProdutoPCP[]
  ): ProdutoProcessamento[] => {
    return pcpProducts.map(pcpProduto => {
      const processamentoItem = processamentoData.find(item => item.codigo === pcpProduto.codigo);
      return {
        codigo: pcpProduto.codigo,
        kg: processamentoItem?.kg || 0,
        cx: processamentoItem?.cx || 0,
        planejamento: processamentoItem?.planejamento || 0,
        texto_breve: pcpProduto.descricao_produto || "",
        descricao_produto: pcpProduto.descricao_produto,
        id: pcpProduto.id,
        timestamp: processamentoItem?.timestamp || new Date(),
        date: processamentoItem?.date || ""
      };
    });
  };

  // UseEffect para carregar dados quando editingProcessamento muda
  useEffect(() => {
    const loadEditingData = async () => {
      if (!editingProcessamento) {
        setEditedTurno1Data([]);
        setEditedTurno2Data([]);
        setProdutosPCP([]);
        return;
      }

      // Carregar produtos PCP
      const pcpProducts = await fetchProdutosPCP();
      setProdutosPCP(pcpProducts);

      const possibleIds = [
        editingProcessamento.dataProcessamento, 
        editingProcessamento.documentId, 
        editingProcessamento.id, 
        editingProcessamento.dataProcessamento?.split('T')[0]
      ].filter(Boolean);
      
      let documentFound = false;
      let docData = null;
      
      for (const documentId of possibleIds) {
        try {
          const docRef = doc(db, "PCP", documentId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            docData = docSnap.data();
            documentFound = true;
            break;
          }
        } catch (error) {
          console.error("❌ Erro ao buscar documento:", documentId, error);
        }
      }
      
      if (documentFound && docData) {
        const turno1Data = docData["1_turno"] || [];
        const turno2Data = docData["2_turno"] || [];
        
        // Mesclar com produtos PCP
        const mergedTurno1Data = mergeProcessamentoWithPCPProducts(turno1Data, pcpProducts);
        const mergedTurno2Data = mergeProcessamentoWithPCPProducts(turno2Data, pcpProducts);
        
        setEditedTurno1Data(mergedTurno1Data);
        setEditedTurno2Data(mergedTurno2Data);
      } else {
        console.error("❌ Nenhum documento encontrado para IDs:", possibleIds);
        // Se não encontrou documento, criar lista com produtos PCP zerados
        const emptyTurno1Data = mergeProcessamentoWithPCPProducts([], pcpProducts);
        const emptyTurno2Data = mergeProcessamentoWithPCPProducts([], pcpProducts);
        
        setEditedTurno1Data(emptyTurno1Data);
        setEditedTurno2Data(emptyTurno2Data);
      }
    };
    
    loadEditingData();
    fetchDatesWithData(); // Carregar datas com dados existentes
  }, [editingProcessamento]);

  // Configurar data selecionada quando o modal abrir
  useEffect(() => {
    if (isOpen && editingProcessamento) {
      setEditSelectedDate(new Date(editingProcessamento.dataProcessamento + 'T12:00:00'));
    }
  }, [isOpen, editingProcessamento]);

  const updateTurnoField = (turno: '1' | '2', index: number, field: 'kg' | 'cx' | 'planejamento', value: string) => {
    if (turno === '1') {
      const newData = [...editedTurno1Data];
      newData[index] = {
        ...newData[index],
        [field]: value
      };
      setEditedTurno1Data(newData);
    } else {
      const newData = [...editedTurno2Data];
      newData[index] = {
        ...newData[index],
        [field]: value
      };
      setEditedTurno2Data(newData);
    }
  };

  const handleDeleteTurno = async (turno: '1' | '2') => {
    if (!editingProcessamento) return;
    
    try {
      const docRef = doc(db, "PCP", editingProcessamento.dataProcessamento);
      const updateData = turno === '1' 
        ? { "1_turno": [] } 
        : { "2_turno": [] };
      
      await updateDoc(docRef, updateData);
      
      if (turno === '1') {
        setEditedTurno1Data([]);
      } else {
        setEditedTurno2Data([]);
      }
      
      toast({
        title: "Sucesso",
        description: `${turno}° Turno excluído com sucesso!`,
        variant: "default"
      });
      
      await recalcularProcessamento(editingProcessamento.dataProcessamento);
      onProcessamentoUpdated();
    } catch (error) {
      console.error("Erro ao excluir turno:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir turno",
        variant: "destructive"
      });
    }
  };

  const checkDateExistsAndMerge = async (newDate: string) => {
    try {
      const docRef = doc(db, "PCP", newDate);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const turno1Data = data["1_turno"] || [];
        const turno2Data = data["2_turno"] || [];
        
        if (turno1Data.length > 0 || turno2Data.length > 0) {
          setExistingDataForMerge(data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar data:", error);
      return false;
    }
  };

  const handleDateChange = async (date: Date) => {
    if (!date || !editingProcessamento) return;
    
    setEditSelectedDate(date);
    setShowEditDatePicker(false);
    setCurrentStep('data-verification');

    setShowMergeButton(false);
    setPendingNewDate(null);
    setExistingDataForMerge(null);
    setVerificationData(null);

    const originalDate = originalProcessamentoDate || editingProcessamento.dataProcessamento;
    const newDate = format(date, 'yyyy-MM-dd');
    
    if (originalDate !== newDate) {
      
      try {
        const docRef = doc(db, "PCP", newDate);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const turno1Data = data["1_turno"] || [];
          const turno2Data = data["2_turno"] || [];
          
          if (turno1Data.length > 0 || turno2Data.length > 0) {
            setVerificationData({
              turno1Count: turno1Data.length,
              turno2Count: turno2Data.length,
              processamento: data.Processamento || null,
              fullData: data,
              hasExistingData: true
            });
            setExistingDataForMerge(data);
          } else {
            setVerificationData({
              turno1Count: 0,
              turno2Count: 0,
              processamento: null,
              fullData: null,
              hasExistingData: false
            });
            setExistingDataForMerge(null);
          }
        } else {
          setVerificationData({
            turno1Count: 0,
            turno2Count: 0,
            processamento: null,
            fullData: null,
            hasExistingData: false
          });
          setExistingDataForMerge(null);
        }
        
        setShowMergeButton(true);
        setPendingNewDate(date);
      } catch (error) {
        console.error("❌ Erro ao verificar dados existentes:", error);
        setVerificationData({
          turno1Count: 0,
          turno2Count: 0,
          processamento: null,
          fullData: null,
          hasExistingData: false
        });
        setExistingDataForMerge(null);
        setShowMergeButton(true);
        setPendingNewDate(date);
      }
    } else {
      setVerificationData({
        turno1Count: 0,
        turno2Count: 0,
        processamento: null,
        fullData: null,
        hasExistingData: false
      });
      setExistingDataForMerge(null);
      setShowMergeButton(true);
      setPendingNewDate(date);
    }
  };

  const handleOpenMergeDialog = async () => {
    setCurrentStep('date-selection');
    setVerificationData(null);
    setExistingDataForMerge(null);
    setShowMergeButton(false);
    setPendingNewDate(null);
    setSelectedTurnosToTransfer(['1', '2']);
    
    // Carregar datas com dados sempre que abrir o modal
    console.log("🔄 Abrindo modal de transferência, carregando datas...");
    await fetchDatesWithData();
    
    setMergeReplaceModalOpen(true);
    setMergeStep('selection');
    setMergeSelectedDate(null);
    setMergeSelectedTurnos({turno1: false, turno2: false});
  };

  const handleSaveChanges = async () => {
    if (!editingProcessamento) return;

    setIsSaving(true);
    
    try {
      const originalDate = originalProcessamentoDate || editingProcessamento.dataProcessamento;
      const newDate = format(editSelectedDate, 'yyyy-MM-dd');

      if (originalDate !== newDate) {
        const dateExists = await checkDateExistsAndMerge(newDate);
        
        if (dateExists) {
          setShowMergeButton(true);
          setPendingNewDate(editSelectedDate);
          setIsSaving(false);
          return;
        }
        
        const originalDocRef = doc(db, "PCP", originalDate);
        const originalDoc = await getDoc(originalDocRef);
        
        if (originalDoc.exists()) {
          const originalData = originalDoc.data();

          const newTimestamp = new Date(editSelectedDate);
          newTimestamp.setHours(0, 0, 0, 0);

          // Filtrar apenas produtos com quantidades > 0
          const filteredTurno1Data = editedTurno1Data.filter(produto => 
            produto.kg > 0 || produto.cx > 0 || produto.planejamento > 0
          );
          const filteredTurno2Data = editedTurno2Data.filter(produto => 
            produto.kg > 0 || produto.cx > 0 || produto.planejamento > 0
          );
          
          const updatedTurno1Data = filteredTurno1Data.map(item => ({
            ...item,
            timestamp: newTimestamp,
            date: newDate
          }));
          const updatedTurno2Data = filteredTurno2Data.map(item => ({
            ...item,
            timestamp: newTimestamp,
            date: newDate
          }));
          
          const newDocRef = doc(db, "PCP", newDate);
          await setDoc(newDocRef, {
            ...originalData,
            "1_turno": updatedTurno1Data,
            "2_turno": updatedTurno2Data,
            date: newDate,
            timestamp: newTimestamp,
            processado: "sim",
            updatedAt: new Date()
          });
          
          await deleteDoc(originalDocRef);
          
          setDocumentCache(prev => {
            const newCache = { ...prev };
            delete newCache[originalDate];
            delete newCache[newDate];
            return newCache;
          });
          
          toast({
            title: "Sucesso",
            description: `Processamento movido para ${format(editSelectedDate, 'dd/MM/yyyy')} com sucesso!`,
            variant: "default"
          });
        }
      } else {
        const docRef = doc(db, "PCP", editingProcessamento.dataProcessamento);
        
        // Filtrar apenas produtos com quantidades > 0
        const filteredTurno1Data = editedTurno1Data.filter(produto => 
          produto.kg > 0 || produto.cx > 0 || produto.planejamento > 0
        );
        const filteredTurno2Data = editedTurno2Data.filter(produto => 
          produto.kg > 0 || produto.cx > 0 || produto.planejamento > 0
        );
        
        await updateDoc(docRef, {
          "1_turno": filteredTurno1Data,
          "2_turno": filteredTurno2Data,
          updatedAt: new Date()
        });
        
        setDocumentCache(prev => {
          const newCache = { ...prev };
          delete newCache[editingProcessamento.dataProcessamento];
          return newCache;
        });
        
        toast({
          title: "Sucesso",
          description: "Alterações salvas com sucesso!",
          variant: "default"
        });
      }
      
      await recalcularProcessamento(newDate);
      handleCloseModal();
      onProcessamentoUpdated();
    } catch (error) {
      console.error("❌ Erro ao salvar alterações:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar alterações",
        variant: "destructive"
      });
      handleCloseModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditedTurno1Data([]);
    setEditedTurno2Data([]);
    setShowMergeButton(false);
    setPendingNewDate(null);
    setShowEditDatePicker(false);
    setShowMergeDialog(false);
    setExistingDataForMerge(null);
    setVerificationData(null);
    setSearchTurno1('');
    setSearchTurno2('');
    setMergeReplaceModalOpen(false);
    setMergeStep('selection');
    setMergeSelectedDate(null);
    setMergeSelectedTurnos({turno1: true, turno2: true});
    onClose();
  };

  const handleMergeTransfer = async () => {
    if (!mergeSelectedDate || !editingProcessamento) return;
    
    setIsSaving(true);
    
    try {
      const newDate = format(mergeSelectedDate, 'yyyy-MM-dd');
      const originalDate = originalProcessamentoDate || editingProcessamento.dataProcessamento;
      
      // Buscar dados existentes na data de destino
      const targetDocRef = doc(db, "PCP", newDate);
      const targetDocSnap = await getDoc(targetDocRef);
      let targetData = targetDocSnap.exists() ? targetDocSnap.data() : {};
      
      // Preparar dados para transferência
      const dataToTransfer: any = {};
      const newTimestamp = new Date(mergeSelectedDate);
      newTimestamp.setHours(0, 0, 0, 0);
      
      if (mergeSelectedTurnos.turno1) {
        // Filtrar apenas produtos com quantidades > 0
        const filteredTurno1Data = editedTurno1Data.filter(produto => 
          produto.kg > 0 || produto.cx > 0 || produto.planejamento > 0
        );
        if (filteredTurno1Data.length > 0) {
          dataToTransfer["1_turno"] = filteredTurno1Data.map(item => ({
            ...item,
            timestamp: newTimestamp,
            date: newDate
          }));
        }
      }
      
      if (mergeSelectedTurnos.turno2) {
        // Filtrar apenas produtos com quantidades > 0
        const filteredTurno2Data = editedTurno2Data.filter(produto => 
          produto.kg > 0 || produto.cx > 0 || produto.planejamento > 0
        );
        if (filteredTurno2Data.length > 0) {
          dataToTransfer["2_turno"] = filteredTurno2Data.map(item => ({
            ...item,
            timestamp: newTimestamp,
            date: newDate
          }));
        }
      }
      
      // Aplicar modo de transferência (merge ou replace)
      if (transferMode === 'merge') {
        // Mesclar dados mantendo os existentes e adicionando os novos
        const mergedData = {
          ...targetData,
          ...dataToTransfer,
          // Para arrays, concatenar em vez de substituir
          "1_turno": [
            ...(targetData["1_turno"] || []),
            ...(dataToTransfer["1_turno"] || [])
          ],
          "2_turno": [
            ...(targetData["2_turno"] || []),
            ...(dataToTransfer["2_turno"] || [])
          ],
          date: newDate,
          timestamp: newTimestamp,
          updatedAt: new Date(),
          // Marcar como "não" processado quando mesclado
          processado: "não"
        };
        
        await setDoc(targetDocRef, mergedData);
      } else {
        // Substituir dados (manter apenas os transferidos)
        const replacedData = {
          ...targetData,
          ...dataToTransfer,
          date: newDate,
          timestamp: newTimestamp,
          updatedAt: new Date(),
          // Marcar como "não" processado quando substituído
          processado: "não"
        };
        
        await setDoc(targetDocRef, replacedData);
      }
      
      // Determinar se todos os turnos foram transferidos
      const allTurnosTransferred = 
        (mergeSelectedTurnos.turno1 || editedTurno1Data.length === 0) && 
        (mergeSelectedTurnos.turno2 || editedTurno2Data.length === 0);
      
      // Remover dados da data original se todos os turnos foram transferidos
      if (allTurnosTransferred) {
        const originalDocRef = doc(db, "PCP", originalDate);
        await deleteDoc(originalDocRef);
      } else {
        // Atualizar dados originais removendo os turnos transferidos
        const originalDocRef = doc(db, "PCP", originalDate);
        const updateData: any = {};
        
        if (mergeSelectedTurnos.turno1) {
          updateData["1_turno"] = [];
        }
        
        if (mergeSelectedTurnos.turno2) {
          updateData["2_turno"] = [];
        }
        
        // Marcar como "não" processado quando apenas alguns turnos foram transferidos
        updateData["processado"] = "não";
        updateData["updatedAt"] = new Date();
        
        await updateDoc(originalDocRef, updateData);
      }
      
      // Limpar cache
      setDocumentCache(prev => {
        const newCache = { ...prev };
        delete newCache[originalDate];
        delete newCache[newDate];
        return newCache;
      });
      
      toast({
        title: "Sucesso",
        description: `Dados ${transferMode === 'merge' ? 'mesclados' : 'substituídos'} com sucesso para ${format(mergeSelectedDate, 'dd/MM/yyyy')}!`,
        variant: "default"
      });
      
      await recalcularProcessamento(newDate);
      if (!allTurnosTransferred) {
        await recalcularProcessamento(originalDate);
      }
      
      // Fechar o modal de mesclagem após sucesso
      setMergeReplaceModalOpen(false);
      onProcessamentoUpdated();
    } catch (error) {
      console.error("❌ Erro ao transferir dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao transferir dados",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !editingProcessamento) return null;

  return (
    <>
      {/* Modal de Edição de Processamento - Lado Direito */}
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 animate-fade-in" 
          onClick={handleCloseModal}
        />
        
        {/* Modal Content */}
        <div className="relative ml-auto h-full w-1/2 min-w-[600px] bg-background shadow-xl animate-slide-in-right border-l-2 border-border">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-6">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Modificar Processamento</h2>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex">
                <Button 
                  variant={activeEditTab === '1' ? 'default' : 'ghost'} 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground" 
                  onClick={() => setActiveEditTab('1')}
                >
                  1° Turno ({editedTurno1Data.length} produtos)
                </Button>
                <Button 
                  variant={activeEditTab === '2' ? 'default' : 'ghost'} 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground" 
                  onClick={() => setActiveEditTab('2')}
                >
                  2° Turno ({editedTurno2Data.length} produtos)
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeEditTab === '1' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-medium">Produtos do 1° Turno</h3>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteTurno('1')} 
                      disabled={editedTurno1Data.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Turno
                    </Button>
                  </div>

                  {/* Barra de pesquisa para o 1° Turno */}
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      placeholder="Buscar por descrição ou código..." 
                      value={searchTurno1} 
                      onChange={(e) => setSearchTurno1(e.target.value)} 
                      className="pl-10" 
                    />
                  </div>
                  
                   {editedTurno1Data.length === 0 ? (
                     <p className="text-center text-muted-foreground py-8">
                       Nenhum produto encontrado no 1° Turno
                     </p>
                   ) : (
                     <div className="space-y-3">
                        {editedTurno1Data.map((produto, originalIndex) => {
                          const searchLower = searchTurno1.toLowerCase();
                          const descricao = (produto.texto_breve || produto.descricao || produto.nome || produto.produto || produto.descricao_produto || '').toLowerCase();
                          const codigo = (produto.codigo || '').toLowerCase();
                          // Busca exata por código ou busca por substring na descrição
                          const shouldShow = searchLower === '' || codigo === searchLower || descricao.includes(searchLower);
                         
                         if (!shouldShow) return null;
                         
                         return (
                           <div key={originalIndex} className="border rounded-lg p-4">
                             <div className="mb-3">
                               <div className="text-base font-medium text-foreground">
                                 Descrição: {produto.texto_breve || produto.descricao || produto.nome || produto.produto || produto.descricao_produto || 'Sem descrição'}
                               </div>
                               <div className="text-sm text-muted-foreground">
                                 Código: {produto.codigo}
                               </div>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-4">
                               <div>
                                 <label className="text-sm font-medium">KG:</label>
                                 <Input 
                                   type="number" 
                                   value={produto.kg || '0'} 
                                   onChange={(e) => updateTurnoField('1', originalIndex, 'kg', e.target.value)} 
                                   className="mt-1" 
                                   step="0.01"
                                 />
                               </div>
                               <div>
                                 <label className="text-sm font-medium">CX:</label>
                                 <Input 
                                   type="number" 
                                   value={produto.cx || '0'} 
                                   onChange={(e) => updateTurnoField('1', originalIndex, 'cx', e.target.value)} 
                                   className="mt-1" 
                                   step="0.01"
                                 />
                               </div>
                               <div>
                                 <label className="text-sm font-medium">Planejado:</label>
                                 <Input 
                                   type="number" 
                                   value={produto.planejamento || '0'} 
                                   onChange={(e) => updateTurnoField('1', originalIndex, 'planejamento', e.target.value)} 
                                   className="mt-1" 
                                   step="0.01"
                                 />
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
              )}

              {activeEditTab === '2' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-md font-medium">Produtos do 2° Turno</h3>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteTurno('2')} 
                      disabled={editedTurno2Data.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Turno
                    </Button>
                  </div>

                  {/* Barra de pesquisa para o 2° Turno */}
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      placeholder="Buscar por descrição ou código..." 
                      value={searchTurno2} 
                      onChange={(e) => setSearchTurno2(e.target.value)} 
                      className="pl-10" 
                    />
                  </div>
                  
                   {editedTurno2Data.length === 0 ? (
                     <p className="text-center text-muted-foreground py-8">
                       Nenhum produto encontrado no 2° Turno
                     </p>
                   ) : (
                     <div className="space-y-3">
                        {editedTurno2Data.map((produto, originalIndex) => {
                          const searchLower = searchTurno2.toLowerCase();
                          const descricao = (produto.texto_breve || produto.descricao || produto.nome || produto.produto || produto.descricao_produto || '').toLowerCase();
                          const codigo = (produto.codigo || '').toLowerCase();
                          // Busca exata por código ou busca por substring na descrição
                          const shouldShow = searchLower === '' || codigo === searchLower || descricao.includes(searchLower);
                         
                         if (!shouldShow) return null;
                         
                         return (
                           <div key={originalIndex} className="border rounded-lg p-4">
                             <div className="mb-3">
                               <div className="text-base font-medium text-foreground">
                                 Descrição: {produto.texto_breve || produto.descricao || produto.nome || produto.produto || produto.descricao_produto || 'Sem descrição'}
                               </div>
                               <div className="text-sm text-muted-foreground">
                                 Código: {produto.codigo}
                               </div>
                             </div>
                             
                             <div className="grid grid-cols-3 gap-4">
                               <div>
                                 <label className="text-sm font-medium">KG:</label>
                                 <Input 
                                   type="number" 
                                   value={produto.kg || '0'} 
                                   onChange={(e) => updateTurnoField('2', originalIndex, 'kg', e.target.value)} 
                                   className="mt-1" 
                                   step="0.01"
                                 />
                               </div>
                               <div>
                                 <label className="text-sm font-medium">CX:</label>
                                 <Input 
                                   type="number" 
                                   value={produto.cx || '0'} 
                                   onChange={(e) => updateTurnoField('2', originalIndex, 'cx', e.target.value)} 
                                   className="mt-1" 
                                   step="0.01"
                                 />
                               </div>
                               <div>
                                 <label className="text-sm font-medium">Planejado:</label>
                                 <Input 
                                   type="number" 
                                   value={produto.planejamento || '0'} 
                                   onChange={(e) => updateTurnoField('2', originalIndex, 'planejamento', e.target.value)} 
                                   className="mt-1" 
                                   step="0.01"
                                 />
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6">
              <div className="flex gap-2 justify-between">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleOpenMergeDialog} 
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Transferir / Substituir
                </Button>
                
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Mesclar ou Substituir Processamento */}
      {mergeReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMergeReplaceModalOpen(false)} />
          <div className="relative bg-background rounded-lg p-6 w-full max-w-4xl mx-4 border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {mergeStep === 'selection' ? 'Transferir data ou Substituir data de Processamento' : 'Selecionar Turnos'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setMergeReplaceModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {mergeStep === 'selection' ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Calendário Customizado */}
                  <div className="space-y-4">
                    <Label>Selecione uma data</Label>
                    <div className="rounded-md border bg-card p-4">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => {
                            const prevMonth = new Date(calendarViewDate);
                            prevMonth.setMonth(prevMonth.getMonth() - 1);
                            setCalendarViewDate(prevMonth);
                          }}
                          className="p-2 hover:bg-accent rounded-md"
                        >
                          ←
                        </button>
                        <h3 className="font-semibold">
                          {format(calendarViewDate, "MMMM yyyy", { locale: ptBR })}
                        </h3>
                        <button
                          onClick={() => {
                            const nextMonth = new Date(calendarViewDate);
                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                            setCalendarViewDate(nextMonth);
                          }}
                          className="p-2 hover:bg-accent rounded-md"
                        >
                          →
                        </button>
                      </div>
                      
                      {/* Cabeçalho dos dias da semana */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Grade de dias */}
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const year = calendarViewDate.getFullYear();
                          const month = calendarViewDate.getMonth();
                          const firstDay = new Date(year, month, 1);
                          const lastDay = new Date(year, month + 1, 0);
                          const startDate = new Date(firstDay);
                          startDate.setDate(startDate.getDate() - firstDay.getDay());
                          
                          const days = [];
                          for (let i = 0; i < 42; i++) {
                            const currentDate = new Date(startDate);
                            currentDate.setDate(startDate.getDate() + i);
                            
                            const dateString = currentDate.toISOString().split('T')[0];
                            const isCurrentMonth = currentDate.getMonth() === month;
                            const isToday = dateString === new Date().toISOString().split('T')[0];
                            const isSelected = mergeSelectedDate && dateString === mergeSelectedDate.toISOString().split('T')[0];
                            const hasData = datesWithData.has(dateString);
                            
                            days.push(
                              <button
                                key={i}
                                onClick={() => {
                                  if (hasData) {
                                    console.log("⛔ Data bloqueada por ter dados existentes");
                                    toast({
                                      title: "Data não disponível",
                                      description: "Já existem dados nesta data. Escolha outra data para evitar conflitos nos dados.",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  console.log("✅ Data aprovada para seleção");
                                  setMergeSelectedDate(currentDate);
                                }}
                                disabled={hasData}
                                className={cn(
                                  "h-9 w-9 text-sm rounded-md transition-all duration-200",
                                  !isCurrentMonth && "text-muted-foreground/40",
                                  isCurrentMonth && !hasData && "hover:bg-accent hover:text-accent-foreground",
                                  isToday && !hasData && "bg-accent text-accent-foreground font-semibold",
                                  isSelected && !hasData && "bg-primary text-primary-foreground",
                                  hasData && "bg-red-500 text-white font-bold cursor-not-allowed hover:bg-red-500",
                                  !hasData && isCurrentMonth && "text-foreground"
                                )}
                              >
                                {currentDate.getDate()}
                              </button>
                            );
                          }
                          return days;
                        })()}
                      </div>
                      
                      {/* Legenda */}
                      <div className="mt-4 text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>Dias com dados existentes (não selecionáveis)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-primary rounded"></div>
                          <span>Data selecionada</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informações da data selecionada e modo de processamento */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Data Selecionada</h4>
                      <div className="p-4 bg-primary/10 rounded-lg border">
                        <p className="text-lg font-medium">
                          {mergeSelectedDate 
                            ? format(mergeSelectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            : "Nenhuma data selecionada"
                          }
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Esta será a data de destino para a transferência/substituição
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Selecione o modo de processamento</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={transferMode === 'merge' ? 'default' : 'outline'}
                          onClick={() => setTransferMode('merge')}
                          className="w-full justify-start text-left"
                        >
                          <div>
                            <div className="font-medium">Transferir</div>
                            <div className="text-xs text-muted-foreground">
                              Mescla os dados com os existentes na data de destino
                            </div>
                          </div>
                        </Button>
                        <Button
                          variant={transferMode === 'replace' ? 'default' : 'outline'}
                          onClick={() => setTransferMode('replace')}
                          className="w-full justify-start text-left"
                        >
                          <div>
                            <div className="font-medium">Substituir</div>
                            <div className="text-xs text-muted-foreground">
                              Substitui completamente os dados na data de destino
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded">
                      <p className="text-orange-700 dark:text-orange-300 font-medium">⚠️ Importante:</p>
                      <ul className="text-orange-600 dark:text-orange-400 text-xs space-y-1">
                        <li>• Datas em vermelho já possuem dados e não podem ser selecionadas</li>
                        <li>• <strong>Transferir</strong>: adiciona aos dados existentes</li>
                        <li>• <strong>Substituir</strong>: remove dados existentes e adiciona os novos</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMergeReplaceModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => setMergeStep('turno-selection')} 
                    disabled={!mergeSelectedDate}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setMergeStep('selection')}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span>
                      Data selecionada: {mergeSelectedDate ? format(mergeSelectedDate, 'dd/MM/yyyy') : 'Nenhuma'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Label>Selecione os turnos para transferir:</Label>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                      <Checkbox
                        id="turno1"
                        checked={mergeSelectedTurnos.turno1}
                        onCheckedChange={(checked) => 
                          setMergeSelectedTurnos({...mergeSelectedTurnos, turno1: checked === true})
                        }
                      />
                      <Label htmlFor="turno1" className="flex-1 cursor-pointer">
                        1° Turno ({editedTurno1Data.length} produtos)
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 border rounded-md">
                      <Checkbox
                        id="turno2"
                        checked={mergeSelectedTurnos.turno2}
                        onCheckedChange={(checked) => 
                          setMergeSelectedTurnos({...mergeSelectedTurnos, turno2: checked === true})
                        }
                      />
                      <Label htmlFor="turno2" className="flex-1 cursor-pointer">
                        2° Turno ({editedTurno2Data.length} produtos)
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMergeStep('selection')}>
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleMergeTransfer}
                    disabled={!mergeSelectedDate || (!mergeSelectedTurnos.turno1 && !mergeSelectedTurnos.turno2)}
                  >
                    {transferMode === 'merge' ? 'Transferir' : 'Substituir'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ModificarProcessamentoModal;