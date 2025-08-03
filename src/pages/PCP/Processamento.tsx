import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchIcon, RefreshCw } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";

interface OrdemProducao {
  id: string;
  ordem_id: string;
  produto: string;
  quantidade: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  turno: string;
  eficiencia: number;
}

interface ProcessamentoProps {
  ordens: OrdemProducao[];
}

interface ProcessamentoData {
  ctp1: number;
  ctp2: number;
  planoDiario: number;
  batchReceita: number;
  kgTotal: number;
  cxTotal: number;
  diferencaPR: number;
  ctptd: number;
  timestamp: Date;
}

const Processamento: React.FC<ProcessamentoProps> = ({ ordens }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processamentoData, setProcessamentoData] = useState<ProcessamentoData | null>(null);
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

  const calcularProcessamento = async () => {
    setIsLoading(true);
    try {
      // Obter dados dos turnos do Firestore
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Nenhum dado de produção encontrado para hoje");
      }

      const data = docSnap.data();
      const turno1 = data["1 Turno"] || [];
      const turno2 = data["2 Turno"] || [];

      if (turno1.length === 0 && turno2.length === 0) {
        throw new Error("Dados dos turnos não encontrados");
      }

      // Calcular métricas
      const kgTurno1 = turno1.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0);
      const kgTurno2 = turno2.reduce((sum: number, item: any) => sum + parseFloat(item.kg || "0"), 0);
      const cxTurno1 = turno1.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0);
      const cxTurno2 = turno2.reduce((sum: number, item: any) => sum + parseFloat(item.cx || "0"), 0);
      const planejadoTurno1 = turno1.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0);
      const planejadoTurno2 = turno2.reduce((sum: number, item: any) => sum + parseFloat(item.planejamento || "0"), 0);

      // Cálculos conforme Processamento.py
      const ctp1 = kgTurno1 > 0 ? (planejadoTurno1 / kgTurno1) * 100 : 0;
      const ctp2 = kgTurno2 > 0 ? (planejadoTurno2 / kgTurno2) * 100 : 0;
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
        timestamp: new Date()
      };

      // Salvar no Firestore
      await setDoc(docRef, {
        Processamento: processamentoResult
      }, { merge: true });

      setProcessamentoData(processamentoResult);
      toast({
        title: "Processamento concluído",
        description: "Os dados foram calculados e salvos com sucesso!",
        variant: "default",
      });
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

  const loadProcessamentoData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const docRef = doc(db, "PCP", today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().Processamento) {
        setProcessamentoData(docSnap.data().Processamento as ProcessamentoData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados de processamento:", error);
    }
  };

  useEffect(() => {
    loadProcessamentoData();
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
        <Button onClick={calcularProcessamento} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Processando..." : "Calcular Processamento"}
        </Button>
      </div>

      {/* Card de Resultados do Processamento */}
      {processamentoData && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Processamento</CardTitle>
            <CardDescription>
              Métricas calculadas com base nos dados de produção
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
                <p className="text-2xl font-bold">{processamentoData.planoDiario}</p>
                <p className="text-xs text-muted-foreground">Total planejado</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Batch Receita</h3>
                <p className="text-2xl font-bold">{processamentoData.batchReceita}</p>
                <p className="text-xs text-muted-foreground">Eficiência</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">KG Total</h3>
                <p className="text-2xl font-bold">{processamentoData.kgTotal}</p>
                <p className="text-xs text-muted-foreground">Produção total</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">CX Total</h3>
                <p className="text-2xl font-bold">{processamentoData.cxTotal}</p>
                <p className="text-xs text-muted-foreground">Produção total</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground">Diferença P/R</h3>
                <p className="text-2xl font-bold">
                  {processamentoData.diferencaPR >= 0 ? '+' : ''}{processamentoData.diferencaPR}
                </p>
                <p className="text-xs text-muted-foreground">Planejado vs Realizado</p>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Produção</CardTitle>
          <CardDescription>
            Todas as ordens de produção registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Término</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdens.map((ordem) => (
                <TableRow key={ordem.id}>
                  <TableCell className="font-medium">{ordem.ordem_id}</TableCell>
                  <TableCell>{ordem.produto}</TableCell>
                  <TableCell>{ordem.quantidade}</TableCell>
                  <TableCell>{ordem.data_inicio}</TableCell>
                  <TableCell>{ordem.data_fim}</TableCell>
                  <TableCell>{ordem.turno}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(ordem.status)}>
                      {ordem.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Processamento;