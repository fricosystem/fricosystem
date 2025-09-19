import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon, RefreshCw, Info, Settings, Edit, Trash2, Save, X } from "lucide-react";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, where, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ModalProcessarDatasAnteriores } from "@/components/PCP/ModalProcessarDatasAnteriores";
import ModificarProcessamentoModal from "@/components/PCP/ModificarProcessamentoModal";
import { format } from 'date-fns';

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
interface OrdemProducao {
  id: string;
  ordem_id: string;
  produto: string;
  quantidade: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  turno: string;
  dataProcessamento: string;
  processamentoId: string;
}
interface DataNaoProcessada {
  id: string;
  date: string;
  turnos: string[];
}
const Processamento: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processamentoData, setProcessamentoData] = useState<ProcessamentoData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<'1 Turno' | '2 Turno' | null>(null);
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [processamentos, setProcessamentos] = useState<ProcessamentoData[]>([]);
  const [selectedProcessamento, setSelectedProcessamento] = useState<ProcessamentoData | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showModalDatasNaoProcessadas, setShowModalDatasNaoProcessadas] = useState(false);
  const [datasNaoProcessadas, setDatasNaoProcessadas] = useState<DataNaoProcessada[]>([]);
  const [isProcessingDatas, setIsProcessingDatas] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProcessamento, setEditingProcessamento] = useState<ProcessamentoData | null>(null);
  const [originalProcessamentoDate, setOriginalProcessamentoDate] = useState<string>('');
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [processamentoToDelete, setProcessamentoToDelete] = useState<ProcessamentoData | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0
  });
  const [selectedProcessamentoForMenu, setSelectedProcessamentoForMenu] = useState<ProcessamentoData | null>(null);
  const {
    toast
  } = useToast();

  // Cache para documentos PCP para evitar múltiplas requisições
  const [documentCache, setDocumentCache] = useState<Record<string, any>>({});

  // Cache para documentos PCP para evitar múltiplas requisições

  // Debounce para evitar saves excessivos
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "concluído":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "em andamento":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "planejado":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "cancelado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };
  const filteredOrdens = ordens.filter(ordem => ordem.ordem_id.toLowerCase().includes(searchTerm.toLowerCase()) || ordem.produto.toLowerCase().includes(searchTerm.toLowerCase()));
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const formatDate = (dateInput: string | Date | any) => {
    if (!dateInput) return "N/A";
    let date: Date;
    try {
      // Se já for uma instância de Date válida
      if (dateInput instanceof Date) {
        date = dateInput;
      }
      // Se for um objeto Firestore Timestamp
      else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      }
      // Se for um número (timestamp em ms)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      // Se for string
      else if (typeof dateInput === 'string') {
        // Se for formato YYYY-MM-DD (apenas data), adicionar horário meio-dia para evitar timezone
        if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateInput + 'T12:00:00');
        }
        // Se for formato DD-MM-YYYY, converter para YYYY-MM-DD
        else if (dateInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [day, month, year] = dateInput.split('-');
          date = new Date(`${year}-${month}-${day}T12:00:00`);
        }
        // Para outros formatos de string
        else {
          date = new Date(dateInput);
        }
      }
      // Para outros tipos, tentar converter diretamente
      else {
        date = new Date(dateInput);
      }

      // Verificar se a data é válida
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateInput);
      return "N/A";
    }
  };
  const formatShortDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      // Se for string no formato DD-MM-YYYY ou YYYY-MM-DD, tratar adequadamente
      if (typeof dateInput === 'string') {
        // Se for formato YYYY-MM-DD, adicionar horário para evitar problema de timezone
        if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateInput + 'T12:00:00');
        }
        // Se for formato DD-MM-YYYY, converter para YYYY-MM-DD
        else if (dateInput.match(/^\d{2}-\d{2}-\d{4}$/)) {
          const [day, month, year] = dateInput.split('-');
          date = new Date(`${year}-${month}-${day}T12:00:00`);
        }
        // Outros formatos
        else {
          date = new Date(dateInput);
        }
      } else {
        date = new Date(dateInput);
      }
    }
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const saveToLocalStorage = (data: ProcessamentoData) => {
    const today = getTodayDate();
    const key = `processamento_${today}`;
    localStorage.setItem(key, JSON.stringify(data));
  };
  const loadFromLocalStorage = () => {
    const today = getTodayDate();
    const key = `processamento_${today}`;
    const savedData = localStorage.getItem(key);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Reconstituir o timestamp como Date se estiver como string
      if (parsed.timestamp && typeof parsed.timestamp === 'string') {
        parsed.timestamp = new Date(parsed.timestamp);
      }
      return parsed;
    }
    return null;
  };

  // Função otimizada para carregar documento com cache
  const getDocumentWithCache = useCallback(async (docId: string) => {
    if (documentCache[docId]) {
      return documentCache[docId];
    }
    try {
      const docRef = doc(db, "PCP", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDocumentCache(prev => ({
          ...prev,
          [docId]: data
        }));
        return data;
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar documento ${docId}:`, error);
    }
    return null;
  }, [documentCache]);
  const calcularComUmTurno = useCallback(async (turno: string) => {
    setIsLoading(true);
    try {
      const today = getTodayDate();
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }
      const data = docSnap.data();
      const turnoKey = turno === '1 Turno' ? '1_turno' : '2_turno';
      const turnoData = data[turnoKey] || [];
      if (turnoData.length === 0) {
        throw new Error(`Dados do ${turno} não encontrados`);
      }

      // Calcular métricas apenas com um turno
      const kgTotal = turnoData.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0);
      const cxTotal = turnoData.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0);
      const planoDiario = turnoData.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0);
      const batchReceita = kgTotal > 0 ? planoDiario / kgTotal : 0;
      const diferencaPR = kgTotal - planoDiario;
      const ctptd = planoDiario > 0 ? kgTotal / planoDiario * 100 : 0;
      const processamentoResult: ProcessamentoData = {
        ctp1: turno === '1 Turno' ? parseFloat(ctptd.toFixed(1)) : 0,
        ctp2: turno === '2 Turno' ? parseFloat(ctptd.toFixed(1)) : 0,
        planoDiario: parseFloat(planoDiario.toFixed(2)),
        batchReceita: parseFloat(batchReceita.toFixed(2)),
        kgTotal: parseFloat(kgTotal.toFixed(2)),
        cxTotal: parseFloat(cxTotal.toFixed(2)),
        diferencaPR: parseFloat(diferencaPR.toFixed(2)),
        ctptd: parseFloat(ctptd.toFixed(1)),
        timestamp: new Date(),
        turnosProcessados: [turno],
        dataProcessamento: today,
        kgTurno1: turno === '1 Turno' ? kgTotal : 0,
        kgTurno2: turno === '2 Turno' ? kgTotal : 0,
        planejadoTurno1: turno === '1 Turno' ? planoDiario : 0,
        planejadoTurno2: turno === '2 Turno' ? planoDiario : 0
      };

      // Salvar no Firestore
      await setDoc(docRef, {
        Processamento: processamentoResult,
        processado: "sim"
      }, {
        merge: true
      });

      // Salvar no localStorage
      saveToLocalStorage(processamentoResult);
      setProcessamentoData(processamentoResult);
      toast({
        title: "Processamento concluído",
        description: `Os dados foram calculados com base apenas no ${turno}`,
        variant: "default"
      });

      // Atualizar lista de processamentos  
      await loadProcessamentos();
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getDocumentWithCache, toast]);
  const calcularComDoisTurnos = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = getTodayDate();

      // Criar referência do documento
      const docRef = doc(db, "PCP", today);

      // Usar cache para documento
      const data = await getDocumentWithCache(today);
      if (!data) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }
      const turno1 = data["1_turno"] || [];
      const turno2 = data["2_turno"] || [];
      if (turno1.length === 0 || turno2.length === 0) {
        throw new Error("Dados incompletos dos turnos");
      }

      // Calcular métricas
      const kgTurno1 = turno1.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0);
      const kgTurno2 = turno2.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0);
      const cxTurno1 = turno1.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0);
      const cxTurno2 = turno2.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0);
      const planejadoTurno1 = turno1.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0);
      const planejadoTurno2 = turno2.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0);

      // Cálculos
      const ctp1 = planejadoTurno1 > 0 ? kgTurno1 / planejadoTurno1 * 100 : 0;
      const ctp2 = planejadoTurno2 > 0 ? kgTurno2 / planejadoTurno2 * 100 : 0;
      const kgTotal = kgTurno1 + kgTurno2;
      const cxTotal = cxTurno1 + cxTurno2;
      const planoDiario = planejadoTurno1 + planejadoTurno2;
      const batchReceita = kgTotal > 0 ? planoDiario / kgTotal : 0;
      const diferencaPR = kgTotal - planoDiario;
      const ctptd = planoDiario > 0 ? kgTotal / planoDiario * 100 : 0;
      const processamentoResult: ProcessamentoData = {
        ctp1: parseFloat(ctp1.toFixed(1)),
        ctp2: parseFloat(ctp2.toFixed(1)),
        planoDiario: parseFloat(planoDiario.toFixed(2)),
        batchReceita: parseFloat(batchReceita.toFixed(2)),
        kgTotal: parseFloat(kgTotal.toFixed(2)),
        cxTotal: parseFloat(cxTotal.toFixed(2)),
        diferencaPR: parseFloat(diferencaPR.toFixed(2)),
        ctptd: parseFloat(ctptd.toFixed(1)),
        timestamp: new Date(),
        turnosProcessados: ["1 Turno", "2 Turno"],
        dataProcessamento: today,
        kgTurno1,
        kgTurno2,
        planejadoTurno1,
        planejadoTurno2
      };

      // Salvar no Firestore
      await setDoc(docRef, {
        Processamento: processamentoResult,
        processado: "sim"
      }, {
        merge: true
      });

      // Salvar no localStorage
      saveToLocalStorage(processamentoResult);
      setProcessamentoData(processamentoResult);
      toast({
        title: "Processamento concluído",
        description: "Os dados foram calculados com ambos os turnos!",
        variant: "default"
      });

      // Atualizar lista de processamentos
      await loadProcessamentos();
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getDocumentWithCache]);
  const verificarDatasNaoProcessadas = useCallback(async () => {
    try {
      const pcpCollection = collection(db, "PCP");
      const q = query(pcpCollection, where("processado", "==", "não"));
      const querySnapshot = await getDocs(q);
      const datasNaoProcessadasData: DataNaoProcessada[] = [];
      const dataAtual = format(new Date(), 'yyyy-MM-dd'); // Data atual no formato YYYY-MM-DD

      querySnapshot.forEach(doc => {
        const data = doc.data();
        const turnos: string[] = [];
        if (data["1_turno"]) turnos.push("1° Turno");
        if (data["2_turno"]) turnos.push("2° Turno");
        if (turnos.length > 0) {
          // Priorizar o ID do documento que geralmente tem o formato YYYY-MM-DD
          let dataParaExibir = doc.id;

          // Se o data.date existir e for diferente do ID, verificar qual usar
          if (data.date && data.date !== doc.id) {
            // Se data.date for uma string de data válida, usar ela
            if (typeof data.date === 'string' && data.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dataParaExibir = data.date;
            } else if (data.date.toDate && typeof data.date.toDate === 'function') {
              // Se for um Timestamp do Firebase
              const firebaseDate = data.date.toDate();
              dataParaExibir = format(firebaseDate, 'yyyy-MM-dd');
            }
          }

          // Só adicionar se não for a data atual
          if (dataParaExibir !== dataAtual) {
            datasNaoProcessadasData.push({
              id: doc.id,
              date: dataParaExibir,
              turnos
            });
          }
        }
      });
      return datasNaoProcessadasData;
    } catch (error) {
      return [];
    }
  }, []);
  const verificarDadosTurnos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Primeiro verificar se há datas não processadas
      const datasNaoProcessadasData = await verificarDatasNaoProcessadas();
      if (datasNaoProcessadasData.length > 0) {
        setDatasNaoProcessadas(datasNaoProcessadasData);
        setShowModalDatasNaoProcessadas(true);
        setIsLoading(false);
        return;
      }
      const today = getTodayDate();

      // Usar cache para documento
      const data = await getDocumentWithCache(today);
      if (!data) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }
      const temTurno1 = data["1_turno"] && data["1_turno"].length > 0;
      const temTurno2 = data["2_turno"] && data["2_turno"].length > 0;
      if (!temTurno1 && !temTurno2) {
        throw new Error("Nenhum dado de turno encontrado para hoje");
      }
      if (temTurno1 && temTurno2) {
        await calcularComDoisTurnos();
      } else if (temTurno1) {
        setSelectedTurno('1 Turno');
        setShowConfirmDialog(true);
      } else if (temTurno2) {
        setSelectedTurno('2 Turno');
        setShowConfirmDialog(true);
      }
    } catch (error) {
      toast({
        title: "Nenhuma produção encontrada",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getDocumentWithCache, calcularComDoisTurnos, verificarDatasNaoProcessadas]);
  const loadProcessamentoData = useCallback(async () => {
    try {
      // Primeiro tenta carregar do localStorage
      const localStorageData = loadFromLocalStorage();
      if (localStorageData) {
        setProcessamentoData(localStorageData);
        return;
      }

      // Se não tiver no localStorage, usa cache otimizado
      const today = getTodayDate();
      const data = await getDocumentWithCache(today);
      if (data && data.Processamento) {
        const firestoreData = data.Processamento as ProcessamentoData;
        setProcessamentoData(firestoreData);
        saveToLocalStorage(firestoreData);
      }
    } catch (error) {
    }
  }, [getDocumentWithCache]);

  // Função para carregar dados consolidados dos processamentos
  const loadProcessamentos = useCallback(async () => {
    console.log("🔄 Carregando processamentos...");
    try {
      const processamentosCollection = collection(db, "PCP");
      const q = query(processamentosCollection, where("processado", "==", "sim"));
      const querySnapshot = await getDocs(q);
      const dadosConsolidados: any[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const documentId = doc.id;

        // Se já tem o processamento salvo, usar ele
        if (data.Processamento) {
          const processamentoComData = {
            ...data.Processamento,
            id: documentId,
            documentId: documentId,
            dataProcessamento: data.date || documentId,
            dataUltimaAtualizacao: data.updatedAt || data.timestamp
          };
          console.log("📊 Processamento encontrado:", processamentoComData);
          dadosConsolidados.push(processamentoComData);
        } else {
          // Caso contrário, calcular na hora (dados consolidados)
          let totalTurno1Planejado = 0;
          let totalTurno1Kg = 0;
          let totalTurno1Cx = 0;
          let itensTurno1 = 0;
          if (data["1_turno"]) {
            const turno1 = Array.isArray(data["1_turno"]) ? data["1_turno"] : Object.values(data["1_turno"] || {});
            turno1.forEach((item: any) => {
              if (item && item.codigo) {
                totalTurno1Planejado += parseFloat(item.planejamento || '0');
                totalTurno1Kg += parseFloat(item.kg || '0');
                totalTurno1Cx += parseFloat(item.cx || '0');
                itensTurno1++;
              }
            });
          }
          let totalTurno2Planejado = 0;
          let totalTurno2Kg = 0;
          let totalTurno2Cx = 0;
          let itensTurno2 = 0;
          if (data["2_turno"]) {
            const turno2 = Array.isArray(data["2_turno"]) ? data["2_turno"] : Object.values(data["2_turno"] || {});
            turno2.forEach((item: any) => {
              if (item && item.codigo) {
                totalTurno2Planejado += parseFloat(item.planejamento || '0');
                totalTurno2Kg += parseFloat(item.kg || '0');
                totalTurno2Cx += parseFloat(item.cx || '0');
                itensTurno2++;
              }
            });
          }

          // Só adicionar se houver dados
          if (itensTurno1 > 0 || itensTurno2 > 0) {
            const totalPlanejado = totalTurno1Planejado + totalTurno2Planejado;
            const totalProduzidoKg = totalTurno1Kg + totalTurno2Kg;
            const totalProduzidoCx = totalTurno1Cx + totalTurno2Cx;
            const eficienciaGeral = totalPlanejado > 0 ? Math.round(totalProduzidoKg / totalPlanejado * 100) : 0;
            const diferenca = totalProduzidoKg - totalPlanejado;
            const ctp1 = totalTurno1Planejado > 0 ? totalTurno1Kg / totalTurno1Planejado * 100 : 0;
            const ctp2 = totalTurno2Planejado > 0 ? totalTurno2Kg / totalTurno2Planejado * 100 : 0;
            dadosConsolidados.push({
              id: documentId,
              documentId,
              dataProcessamento: data.date || documentId,
              timestamp: new Date(),
              // Dados consolidados
              planoDiario: totalPlanejado,
              kgTotal: totalProduzidoKg,
              cxTotal: totalProduzidoCx,
              diferencaPR: diferenca,
              ctptd: eficienciaGeral,
              ctp1: Math.round(ctp1 * 10) / 10,
              ctp2: Math.round(ctp2 * 10) / 10,
              // Detalhes dos turnos
              kgTurno1: totalTurno1Kg,
              kgTurno2: totalTurno2Kg,
              planejadoTurno1: totalTurno1Planejado,
              planejadoTurno2: totalTurno2Planejado,
              turnosProcessados: [...(itensTurno1 > 0 ? ['1 Turno'] : []), ...(itensTurno2 > 0 ? ['2 Turno'] : [])],
              // Informações extras
              itensTurno1,
              itensTurno2,
              turnosAtivos: [...(itensTurno1 > 0 ? ['1° Turno'] : []), ...(itensTurno2 > 0 ? ['2° Turno'] : [])].join(', ')
            });
            console.log("📋 Dados consolidados adicionados:", {
              documentId,
              dataProcessamento: data.date || documentId,
              itensTurno1,
              itensTurno2
            });
          }
        }
      });

      // Ordenar por data decrescente
      dadosConsolidados.sort((a, b) => {
        const dateA = new Date(a.dataProcessamento);
        const dateB = new Date(b.dataProcessamento);
        return dateB.getTime() - dateA.getTime();
      });
      setProcessamentos(dadosConsolidados);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de processamentos",
        variant: "destructive"
      });
    }
  }, [toast]);
  const processarDatasAnteriores = useCallback(async () => {
    setIsProcessingDatas(true);
    try {
      for (const dataNaoProcessada of datasNaoProcessadas) {
        const docRef = doc(db, "PCP", dataNaoProcessada.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const turno1 = data["1_turno"] || [];
          const turno2 = data["2_turno"] || [];

          // Calcular métricas similar ao processamento normal
          const kgTurno1 = Array.isArray(turno1) ? turno1.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0) : 0;
          const kgTurno2 = Array.isArray(turno2) ? turno2.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0) : 0;
          const cxTurno1 = Array.isArray(turno1) ? turno1.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0) : 0;
          const cxTurno2 = Array.isArray(turno2) ? turno2.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0) : 0;
          const planejadoTurno1 = Array.isArray(turno1) ? turno1.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0) : 0;
          const planejadoTurno2 = Array.isArray(turno2) ? turno2.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0) : 0;
          const ctp1 = planejadoTurno1 > 0 ? kgTurno1 / planejadoTurno1 * 100 : 0;
          const ctp2 = planejadoTurno2 > 0 ? kgTurno2 / planejadoTurno2 * 100 : 0;
          const kgTotal = kgTurno1 + kgTurno2;
          const cxTotal = cxTurno1 + cxTurno2;
          const planoDiario = planejadoTurno1 + planejadoTurno2;
          const batchReceita = kgTotal > 0 ? planoDiario / kgTotal : 0;
          const diferencaPR = kgTotal - planoDiario;
          const ctptd = planoDiario > 0 ? kgTotal / planoDiario * 100 : 0;
          const turnos = [];
          if (Array.isArray(turno1) && turno1.length > 0) turnos.push("1 Turno");
          if (Array.isArray(turno2) && turno2.length > 0) turnos.push("2 Turno");
          const processamentoResult: ProcessamentoData = {
            ctp1: parseFloat(ctp1.toFixed(1)),
            ctp2: parseFloat(ctp2.toFixed(1)),
            planoDiario: parseFloat(planoDiario.toFixed(2)),
            batchReceita: parseFloat(batchReceita.toFixed(2)),
            kgTotal: parseFloat(kgTotal.toFixed(2)),
            cxTotal: parseFloat(cxTotal.toFixed(2)),
            diferencaPR: parseFloat(diferencaPR.toFixed(2)),
            ctptd: parseFloat(ctptd.toFixed(1)),
            timestamp: new Date(),
            turnosProcessados: turnos,
            dataProcessamento: dataNaoProcessada.date,
            kgTurno1,
            kgTurno2,
            planejadoTurno1,
            planejadoTurno2
          };

          // Atualizar documento com processamento e marcar como processado
          await updateDoc(docRef, {
            processado: "sim",
            Processamento: processamentoResult
          });
        }
      }
      toast({
        title: "Sucesso",
        description: `${datasNaoProcessadas.length} datas anteriores processadas com sucesso!`
      });
      setShowModalDatasNaoProcessadas(false);
      setDatasNaoProcessadas([]);

      // Recarregar processamentos
      await loadProcessamentos();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao processar datas anteriores",
        variant: "destructive"
      });
    } finally {
      setIsProcessingDatas(false);
    }
  }, [datasNaoProcessadas, toast, loadProcessamentos]);
  const loadOrdensProducao = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "ordensProducao"));
      const ordensData: OrdemProducao[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        ordensData.push({
          id: doc.id,
          ordem_id: data.ordem_id || "",
          produto: data.produto || "",
          quantidade: data.quantidade || 0,
          status: data.status || "",
          data_inicio: data.data_inicio || "",
          data_fim: data.data_fim || "",
          turno: data.turno || "",
          dataProcessamento: data.dataProcessamento || "",
          processamentoId: data.processamentoId || ""
        });
      });
      setOrdens(ordensData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar ordens de produção",
        variant: "destructive"
      });
    }
  }, [toast]);
  const handleShowDetails = (processamento: ProcessamentoData) => {
    setSelectedProcessamento(processamento);
    setShowDetailsDialog(true);
  };
  const handleShowEditModal = async (processamento: ProcessamentoData) => {
    console.log("🔍 Abrindo modal de edição para:", processamento);
    console.log("📅 Data do processamento:", processamento.dataProcessamento);
    console.log("🏷️ ID do processamento:", processamento.id);
    console.log("📄 Document ID:", processamento.documentId);

    setEditingProcessamento(processamento);
    setOriginalProcessamentoDate(processamento.dataProcessamento);
    setShowActionMenu(null);
    setShowEditModal(true);
  };
  const handleShowDeleteConfirm = (processamento: ProcessamentoData) => {
    setProcessamentoToDelete(processamento);
    setShowActionMenu(null);
    setShowDeleteConfirmDialog(true);
  };
  const handleDeleteProcessamento = async () => {
    if (!processamentoToDelete) return;
    try {
      const docRef = doc(db, "PCP", processamentoToDelete.dataProcessamento);
      const today = getTodayDate();

      // Sempre remover o documento completo do Firestore
      await deleteDoc(docRef);

      // Se for do dia atual, também remover do localStorage
      if (processamentoToDelete.dataProcessamento === today) {
        const localStorageKey = `processamento_${today}`;
        localStorage.removeItem(localStorageKey);

        // Limpar o estado local do processamento atual
        setProcessamentoData(null);
      }
      toast({
        title: "Sucesso",
        description: "Documento removido completamente do Firestore!",
        variant: "default"
      });

      // Limpar estados e recarregar
      setShowDeleteConfirmDialog(false);
      setProcessamentoToDelete(null);

      // Limpar cache para esta data
      setDocumentCache(prev => {
        const newCache = {
          ...prev
        };
        delete newCache[processamentoToDelete.dataProcessamento];
        return newCache;
      });
      await loadProcessamentos();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover processamento",
        variant: "destructive"
      });
    }
  };
  const recalcularProcessamento = async (dataProcessamento: string) => {
    try {
      const docRef = doc(db, "PCP", dataProcessamento);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const turno1 = data["1_turno"] || [];
        const turno2 = data["2_turno"] || [];

        // Recalcular métricas
        const kgTurno1 = Array.isArray(turno1) ? turno1.reduce((sum, item) => sum + parseFloat(item.kg || "0"), 0) : 0;
        const kgTurno2 = Array.isArray(turno2) ? turno2.reduce((sum, item) => sum + parseFloat(item.kg || "0"), 0) : 0;
        const cxTurno1 = Array.isArray(turno1) ? turno1.reduce((sum, item) => sum + parseFloat(item.cx || "0"), 0) : 0;
        const cxTurno2 = Array.isArray(turno2) ? turno2.reduce((sum, item) => sum + parseFloat(item.cx || "0"), 0) : 0;
        const planejadoTurno1 = Array.isArray(turno1) ? turno1.reduce((sum, item) => sum + parseFloat(item.planejamento || "0"), 0) : 0;
        const planejadoTurno2 = Array.isArray(turno2) ? turno2.reduce((sum, item) => sum + parseFloat(item.planejamento || "0"), 0) : 0;
        const ctp1 = planejadoTurno1 > 0 ? kgTurno1 / planejadoTurno1 * 100 : 0;
        const ctp2 = planejadoTurno2 > 0 ? kgTurno2 / planejadoTurno2 * 100 : 0;
        const kgTotal = kgTurno1 + kgTurno2;
        const cxTotal = cxTurno1 + cxTurno2;
        const planoDiario = planejadoTurno1 + planejadoTurno2;
        const batchReceita = kgTotal > 0 ? planoDiario / kgTotal : 0;
        const diferencaPR = kgTotal - planoDiario;
        const ctptd = planoDiario > 0 ? kgTotal / planoDiario * 100 : 0;
        const turnos = [];
        if (Array.isArray(turno1) && turno1.length > 0) turnos.push("1 Turno");
        if (Array.isArray(turno2) && turno2.length > 0) turnos.push("2 Turno");
        const processamentoResult = {
          ctp1: parseFloat(ctp1.toFixed(1)),
          ctp2: parseFloat(ctp2.toFixed(1)),
          planoDiario: parseFloat(planoDiario.toFixed(2)),
          batchReceita: parseFloat(batchReceita.toFixed(2)),
          kgTotal: parseFloat(kgTotal.toFixed(2)),
          cxTotal: parseFloat(cxTotal.toFixed(2)),
          diferencaPR: parseFloat(diferencaPR.toFixed(2)),
          ctptd: parseFloat(ctptd.toFixed(1)),
          timestamp: new Date(),
          turnosProcessados: turnos,
          dataProcessamento,
          kgTurno1,
          kgTurno2,
          planejadoTurno1,
          planejadoTurno2
        };
        await updateDoc(docRef, {
          Processamento: processamentoResult
        });
      }
    } catch (error) {
    }
  };
  // updateTurnoField moved to ModificarProcessamentoModal
  const handleConfirmProcessing = () => {
    if (selectedTurno) {
      calcularComUmTurno(selectedTurno);
    }
    setShowConfirmDialog(false);
  };
  const prepareChartData = (processamento: ProcessamentoData) => {
    return [{
      name: '1° Turno',
      Produzido: processamento.kgTurno1 || 0,
      Planejado: processamento.planejadoTurno1 || 0
    }, {
      name: '2° Turno',
      Produzido: processamento.kgTurno2 || 0,
      Planejado: processamento.planejadoTurno2 || 0
    }, {
      name: 'Total',
      Produzido: (processamento.kgTurno1 || 0) + (processamento.kgTurno2 || 0),
      Planejado: (processamento.planejadoTurno1 || 0) + (processamento.planejadoTurno2 || 0)
    }];
  };

  // Carregar dados uma única vez e usar cache depois
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([loadProcessamentoData(), loadOrdensProducao(), loadProcessamentos()]);
    };
    loadAllData();
  }, [loadProcessamentoData, loadOrdensProducao, loadProcessamentos]);

  // Fechar menu de ações ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showActionMenu && !target.closest('[data-menu-content]')) {
        setShowActionMenu(null);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionMenu]);
  return <div className="space-y-6">
      <h2 className="text-2xl font-bold">Processamento</h2>
      
      {/* Header Responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por data..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button onClick={verificarDadosTurnos} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {isLoading ? "Processando..." : "Verificar / Processar"}
        </Button>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTurno === '1 Turno' ? "Foi encontrado apenas dados do 1° Turno. Deseja prosseguir com o processamento usando apenas este turno?" : "Foi encontrado apenas dados do 2° Turno. Deseja prosseguir com o processamento usando apenas este turno?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmProcessing}>
              Prosseguir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card de Resultados do Processamento */}
      {processamentoData && <Card>
          <CardHeader>
            <CardTitle>Resultados do Processamento</CardTitle>
            <CardDescription>
              {`Métricas calculadas em ${formatDate(processamentoData.timestamp)} com base nos dados de: ${processamentoData.turnosProcessados?.join(' e ') || 'turnos desconhecidos'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Plano Diário</h3>
                <p className="text-2xl font-bold">{processamentoData.planoDiario.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Total planejado (kg)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">KG Total</h3>
                <p className="text-2xl font-bold">{processamentoData.kgTotal.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Produção total (kg)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">CX Total</h3>
                <p className="text-2xl font-bold">{processamentoData.cxTotal.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Produção total (cx)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Diferença P/R</h3>
                <p className={`text-2xl font-bold ${processamentoData.diferencaPR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {processamentoData.diferencaPR >= 0 ? '+' : ''}{processamentoData.diferencaPR.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">Planejado vs Realizado (kg)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Eficiência</h3>
                <p className="text-2xl font-bold">{processamentoData.ctptd}%</p>
                <p className="text-xs text-muted-foreground">Eficiência Total</p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Card de Histórico de Processamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Processamentos</CardTitle>
          <CardDescription>
            Resultados consolidados por data processada - totais de produção e eficiência
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Turnos Enviados</TableHead>
                  <TableHead>Total Planejado (kg)</TableHead>
                  <TableHead>Total Produzido (kg)</TableHead>
                  <TableHead>Diferença (kg)</TableHead>
                  <TableHead>Eficiência Geral</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processamentos.filter(item => item.dataProcessamento && item.dataProcessamento.includes(searchTerm) || searchTerm === "").map(processamento => {
                // Calcular informações dos turnos ativos
                const turnosAtivos = [];
                if (processamento.kgTurno1 && processamento.kgTurno1 > 0) {
                  turnosAtivos.push('1° Turno');
                }
                if (processamento.kgTurno2 && processamento.kgTurno2 > 0) {
                  turnosAtivos.push('2° Turno');
                }
                return <TableRow key={processamento.id || processamento.dataProcessamento}>
                      <TableCell className="font-medium">{formatShortDate(processamento.dataProcessamento || processamento.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {processamento.kgTurno1 > 0 && <Badge variant="default" className="text-xs">
                              1° Turno
                            </Badge>}
                          {processamento.kgTurno2 > 0 && <Badge variant="default" className="text-xs">
                              2° Turno
                            </Badge>}
                          {(!processamento.kgTurno1 || processamento.kgTurno1 === 0) && (!processamento.kgTurno2 || processamento.kgTurno2 === 0) && <Badge variant="outline" className="text-xs">
                              Dados consolidados
                            </Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{(processamento.planoDiario || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}</TableCell>
                      <TableCell>{(processamento.kgTotal || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${(processamento.diferencaPR || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(processamento.diferencaPR || 0) >= 0 ? '+' : ''}{(processamento.diferencaPR || 0).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2
                      })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className={`font-medium ${(processamento.ctptd || 0) >= 100 ? 'text-green-600' : (processamento.ctptd || 0) >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {(processamento.ctptd || 0).toFixed(1)}%
                          </span>
                           
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuPosition({
                        x: rect.right - 150,
                        y: rect.bottom + 5
                      });
                      setSelectedProcessamentoForMenu(processamento);
                      const idKey = processamento.id || processamento.dataProcessamento;
                      setShowActionMenu(prev => prev === idKey ? null : idKey);
                    }}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>;
              })}
                {processamentos.filter(item => item.dataProcessamento && item.dataProcessamento.includes(searchTerm) || searchTerm === "").length === 0 && <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum resultado encontrado para a busca' : 'Nenhum processamento encontrado'}
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* Dialog de Detalhes do Processamento */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Processamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o processamento selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedProcessamento && <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">ID:</h3>
                  <p className="truncate">{selectedProcessamento.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Data/Hora:</h3>
                  <p>{formatDate(selectedProcessamento.timestamp)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Turnos Processados:</h3>
                  <p>{selectedProcessamento.turnosProcessados?.join(' e ') || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Status:</h3>
                  <Badge variant="outline">
                    {selectedProcessamento.turnosProcessados?.length === 2 ? 'Completo' : 'Parcial'}
                  </Badge>
                </div>
              </div>

              <div className="h-64 sm:h-80">
                <h3 className="text-sm font-medium mb-4">Comparativo de Produção (kg)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData(selectedProcessamento)} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Produzido" fill="#8884d8" />
                    <Bar dataKey="Planejado" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">1° Turno</h3>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p><span className="font-medium">Produzido:</span> {selectedProcessamento.kgTurno1?.toLocaleString('pt-BR') || 0} kg</p>
                      <p><span className="font-medium">Planejado:</span> {selectedProcessamento.planejadoTurno1?.toLocaleString('pt-BR') || 0} kg</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Eficiência:</span>
                        <span className={`font-medium ${(selectedProcessamento.ctp1 || 0) >= 80 ? 'text-green-500' : 'text-white'}`}>
                          {selectedProcessamento.ctp1?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${(selectedProcessamento.ctp1 || 0) >= 80 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min((selectedProcessamento.ctp1 || 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">2° Turno</h3>
                  <div className="mt-2 space-y-3">
                    <div>
                      <p><span className="font-medium">Produzido:</span> {selectedProcessamento.kgTurno2?.toLocaleString('pt-BR') || 0} kg</p>
                      <p><span className="font-medium">Planejado:</span> {selectedProcessamento.planejadoTurno2?.toLocaleString('pt-BR') || 0} kg</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Eficiência:</span>
                        <span className={`font-medium ${(selectedProcessamento.ctp2 || 0) >= 80 ? 'text-green-500' : 'text-white'}`}>
                          {selectedProcessamento.ctp2?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${(selectedProcessamento.ctp2 || 0) >= 80 ? 'bg-green-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min((selectedProcessamento.ctp2 || 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Resumo Total</h3>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">KG Total</p>
                    <p className="text-xl font-bold">{selectedProcessamento.kgTotal.toLocaleString('pt-BR')} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Planejado</p>
                    <p className="text-xl font-bold">{selectedProcessamento.planoDiario.toLocaleString('pt-BR')} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diferença</p>
                    <p className={`text-xl font-bold ${selectedProcessamento.diferencaPR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedProcessamento.diferencaPR >= 0 ? '+' : ''}{selectedProcessamento.diferencaPR.toLocaleString('pt-BR')} kg
                    </p>
                  </div>
                </div>
              </div>
            </div>}
        </DialogContent>
        </Dialog>

        {/* Modal para Datas Não Processadas */}
        <ModalProcessarDatasAnteriores open={showModalDatasNaoProcessadas} onOpenChange={setShowModalDatasNaoProcessadas} datasNaoProcessadas={datasNaoProcessadas} onProcessarDatas={processarDatasAnteriores} isLoading={isProcessingDatas} />

        {/* Dialog de Confirmação de Remoção */}
        <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Processamento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o processamento da data {processamentoToDelete ? formatShortDate(processamentoToDelete.dataProcessamento) : ''}? 
                Esta ação irá marcar a data como "não processada" e remover todos os cálculos de processamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProcessamento} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        
        {/* Modal Modificar Processamento */}
        <ModificarProcessamentoModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProcessamento(null);
            setOriginalProcessamentoDate('');
          }}
          editingProcessamento={editingProcessamento}
          originalProcessamentoDate={originalProcessamentoDate}
          onProcessamentoUpdated={loadProcessamentos}
          recalcularProcessamento={recalcularProcessamento}
          documentCache={documentCache}
          setDocumentCache={setDocumentCache}
        />
        
        
        {/* Menu de Ações - Renderizado fora da tabela */}
        {showActionMenu && selectedProcessamentoForMenu && <>
            {/* Overlay para fechar o menu */}
            <div className="fixed inset-0 z-40" onClick={() => {
        setShowActionMenu(null);
        setSelectedProcessamentoForMenu(null);
      }} />
            
            {/* Menu de ações */}
            <div className="fixed z-50 bg-background border rounded-md shadow-lg min-w-[200px]" data-menu-content onMouseDown={e => e.stopPropagation()} style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`
      }}>
              <div className="py-1">
                <button className="w-full flex items-center justify-start text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer" onClick={() => {
            handleShowDetails(selectedProcessamentoForMenu);
            setShowActionMenu(null);
            setSelectedProcessamentoForMenu(null);
          }}>
                  <Info className="h-4 w-4 mr-2" />
                  Detalhes
                </button>
                <button className="w-full flex items-center justify-start text-left px-4 py-2 text-sm hover:bg-muted cursor-pointer" onClick={() => {
            handleShowEditModal(selectedProcessamentoForMenu);
            setShowActionMenu(null);
            setSelectedProcessamentoForMenu(null);
          }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modificar Processamento
                </button>
                <button className="w-full flex items-center justify-start text-left px-4 py-2 text-sm text-destructive hover:bg-muted hover:text-destructive cursor-pointer" onClick={() => {
            handleShowDeleteConfirm(selectedProcessamentoForMenu);
            setShowActionMenu(null);
            setSelectedProcessamentoForMenu(null);
          }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Processamento
                </button>
              </div>
            </div>
          </>}
      </div>;
};
export default Processamento;