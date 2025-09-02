import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon, RefreshCw, Info } from "lucide-react";
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProcessamentoData {
  id?: string;
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
  const { toast } = useToast();

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

  const filteredOrdens = ordens.filter((ordem) =>
    ordem.ordem_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ordem.produto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";
    
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    if (isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateInput: string | Date) => {
    if (!dateInput) return "N/A";
    
    let date: Date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
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

  const calcularComUmTurno = async (turno: '1 Turno' | '2 Turno') => {
    setIsLoading(true);
    try {
      const today = getTodayDate();
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }

      const data = docSnap.data();
      const turnoData = data[turno] || [];

      if (turnoData.length === 0) {
        throw new Error(`Dados do ${turno} não encontrados`);
      }

      // Calcular métricas apenas com um turno
      const kgTotal = turnoData.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0);
      const cxTotal = turnoData.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0);
      const planoDiario = turnoData.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0);
      const batchReceita = kgTotal > 0 ? (planoDiario / kgTotal) : 0;
      const diferencaPR = kgTotal - planoDiario;
      const ctptd = planoDiario > 0 ? (kgTotal / planoDiario) * 100 : 0;

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
        Processamento: processamentoResult
      }, { merge: true });

      // Salvar no localStorage
      saveToLocalStorage(processamentoResult);

      setProcessamentoData(processamentoResult);
      toast({
        title: "Processamento concluído",
        description: `Os dados foram calculados com base apenas no ${turno}`,
        variant: "default",
      });

      // Atualizar lista de processamentos
      await loadProcessamentos();
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calcularComDoisTurnos = async () => {
    setIsLoading(true);
    try {
      const today = getTodayDate();
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }

      const data = docSnap.data();
      const turno1 = data["1 Turno"] || [];
      const turno2 = data["2 Turno"] || [];

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
      const ctp1 = planejadoTurno1 > 0 ? (kgTurno1 / planejadoTurno1) * 100 : 0;
      const ctp2 = planejadoTurno2 > 0 ? (kgTurno2 / planejadoTurno2) * 100 : 0;
      const kgTotal = kgTurno1 + kgTurno2;
      const cxTotal = cxTurno1 + cxTurno2;
      const planoDiario = planejadoTurno1 + planejadoTurno2;
      const batchReceita = kgTotal > 0 ? (planoDiario / kgTotal) : 0;
      const diferencaPR = kgTotal - planoDiario;
      const ctptd = planoDiario > 0 ? (kgTotal / planoDiario) * 100 : 0;

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
        Processamento: processamentoResult
      }, { merge: true });

      // Salvar no localStorage
      saveToLocalStorage(processamentoResult);

      setProcessamentoData(processamentoResult);
      toast({
        title: "Processamento concluído",
        description: "Os dados foram calculados com ambos os turnos!",
        variant: "default",
      });

      // Atualizar lista de processamentos
      await loadProcessamentos();
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verificarDadosTurnos = async () => {
    setIsLoading(true);
    try {
      const today = getTodayDate();
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }

      const data = docSnap.data();
      const temTurno1 = data["1 Turno"] && data["1 Turno"].length > 0;
      const temTurno2 = data["2 Turno"] && data["2 Turno"].length > 0;

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
        title: "Erro na verificação",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProcessamentoData = async () => {
    try {
      // Primeiro tenta carregar do localStorage
      const localStorageData = loadFromLocalStorage();
      if (localStorageData) {
        setProcessamentoData(localStorageData);
        return;
      }

      // Se não tiver no localStorage, tenta carregar do Firestore
      const today = getTodayDate();
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().Processamento) {
        const firestoreData = docSnap.data().Processamento as ProcessamentoData;
        setProcessamentoData(firestoreData);
        saveToLocalStorage(firestoreData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de processamento:", error);
    }
  };

  const loadProcessamentos = async () => {
    try {
      const processamentosCollection = collection(db, "PCP");
      const q = query(processamentosCollection, orderBy("Processamento.timestamp", "desc"));
      const querySnapshot = await getDocs(q);

      const processamentosData: ProcessamentoData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data().Processamento;
        if (data) {
          processamentosData.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp.toDate()
          });
        }
      });

      setProcessamentos(processamentosData);
    } catch (error) {
      console.error("Erro ao carregar processamentos:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de processamentos",
        variant: "destructive",
      });
    }
  };

  const loadOrdensProducao = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "ordensProducao"));
      const ordensData: OrdemProducao[] = [];
      querySnapshot.forEach((doc) => {
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
      console.error("Erro ao carregar ordens de produção:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar ordens de produção",
        variant: "destructive",
      });
    }
  };

  const handleShowDetails = (processamento: ProcessamentoData) => {
    setSelectedProcessamento(processamento);
    setShowDetailsDialog(true);
  };

  const handleConfirmProcessing = () => {
    if (selectedTurno) {
      calcularComUmTurno(selectedTurno);
    }
    setShowConfirmDialog(false);
  };

  const prepareChartData = (processamento: ProcessamentoData) => {
    return [
      {
        name: '1° Turno',
        Produzido: processamento.kgTurno1 || 0,
        Planejado: processamento.planejadoTurno1 || 0,
      },
      {
        name: '2° Turno',
        Produzido: processamento.kgTurno2 || 0,
        Planejado: processamento.planejadoTurno2 || 0,
      },
      {
        name: 'Total',
        Produzido: (processamento.kgTurno1 || 0) + (processamento.kgTurno2 || 0),
        Planejado: (processamento.planejadoTurno1 || 0) + (processamento.planejadoTurno2 || 0),
      }
    ];
  };

  useEffect(() => {
    loadProcessamentoData();
    loadOrdensProducao();
    loadProcessamentos();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Processamento</h2>
      
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ordens de produção..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={verificarDadosTurnos} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Processando..." : "Calcular Processamento"}
        </Button>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTurno === '1 Turno' 
                ? "Foi encontrado apenas dados do 1° Turno. Deseja prosseguir com o processamento usando apenas este turno?"
                : "Foi encontrado apenas dados do 2° Turno. Deseja prosseguir com o processamento usando apenas este turno?"}
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
      {processamentoData && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Processamento</CardTitle>
            <CardDescription>
              {`Métricas calculadas em ${formatDate(processamentoData.timestamp)} com base nos dados de: ${processamentoData.turnosProcessados?.join(' e ') || 'turnos desconhecidos'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">CTP1</h3>
                <p className="text-2xl font-bold">{processamentoData.ctp1}%</p>
                <p className="text-xs text-muted-foreground">Eficiência 1° Turno</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">CTP2</h3>
                <p className="text-2xl font-bold">{processamentoData.ctp2}%</p>
                <p className="text-xs text-muted-foreground">Eficiência 2° Turno</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Plano Diário</h3>
                <p className="text-2xl font-bold">{processamentoData.planoDiario.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-muted-foreground">Total planejado (kg)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Batch Receita</h3>
                <p className="text-2xl font-bold">{processamentoData.batchReceita.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Índice de eficiência</p>
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
                <p className="text-2xl font-bold">
                  {processamentoData.diferencaPR >= 0 ? '+' : ''}{processamentoData.diferencaPR.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">Planejado vs Realizado (kg)</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">CTPTD</h3>
                <p className="text-2xl font-bold">{processamentoData.ctptd}%</p>
                <p className="text-xs text-muted-foreground">Eficiência Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Histórico de Processamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Processamentos</CardTitle>
          <CardDescription>
            Lista de todos os processamentos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turnos</TableHead>
                <TableHead>KG Total</TableHead>
                <TableHead>Planejado</TableHead>
                <TableHead>Diferença</TableHead>
                <TableHead>Eficiência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processamentos.map((processamento) => (
                <TableRow key={processamento.id}>
                  <TableCell>{formatShortDate(processamento.timestamp)}</TableCell>
                  <TableCell>
                    {processamento.turnosProcessados?.includes('1 Turno') && 
                     processamento.turnosProcessados?.includes('2 Turno') 
                     ? 'Ambos' 
                     : processamento.turnosProcessados?.join(', ')}
                  </TableCell>
                  <TableCell>{processamento.kgTotal.toLocaleString('pt-BR')} kg</TableCell>
                  <TableCell>{processamento.planoDiario.toLocaleString('pt-BR')} kg</TableCell>
                  <TableCell>
                    <span className={processamento.diferencaPR >= 0 ? "text-green-600" : "text-red-600"}>
                      {processamento.diferencaPR >= 0 ? '+' : ''}{processamento.diferencaPR.toLocaleString('pt-BR')} kg
                    </span>
                  </TableCell>
                  <TableCell>{processamento.ctptd.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleShowDetails(processamento)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Processamento */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Processamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o processamento selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedProcessamento && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">ID:</h3>
                  <p>{selectedProcessamento.id}</p>
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

              <div className="h-80">
                <h3 className="text-sm font-medium mb-4">Comparativo de Produção (kg)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareChartData(selectedProcessamento)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
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

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">1° Turno</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Produzido:</span> {selectedProcessamento.kgTurno1?.toLocaleString('pt-BR') || 0} kg</p>
                    <p><span className="font-medium">Planejado:</span> {selectedProcessamento.planejadoTurno1?.toLocaleString('pt-BR') || 0} kg</p>
                    <p><span className="font-medium">Eficiência:</span> {selectedProcessamento.ctp1?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">2° Turno</h3>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Produzido:</span> {selectedProcessamento.kgTurno2?.toLocaleString('pt-BR') || 0} kg</p>
                    <p><span className="font-medium">Planejado:</span> {selectedProcessamento.planejadoTurno2?.toLocaleString('pt-BR') || 0} kg</p>
                    <p><span className="font-medium">Eficiência:</span> {selectedProcessamento.ctp2?.toFixed(1) || 0}%</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Resumo Total</h3>
                <div className="mt-2 grid grid-cols-3 gap-4">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Processamento;