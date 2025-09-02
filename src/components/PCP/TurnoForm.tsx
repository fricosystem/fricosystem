import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload } from "lucide-react";

interface Produto {
  codigo: string;
  textoBreve: string;
  kg: number; // Mudado para number
  cx: number; // Mudado para number
  planejamento: number; // Mudado para number
}

interface TurnoFormProps {
  turno: '1' | '2';
  titulo: string;
}

const TurnoForm: React.FC<TurnoFormProps> = ({ turno, titulo }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importData, setImportData] = useState<Produto[]>([]);
  const [status, setStatus] = useState<"empty" | "loaded" | "saved">("empty");
  const { toast } = useToast();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load data from localStorage and Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      const today = getTodayDate();
      const localStorageKey = `turno${turno}_${today}`;
      
      // Try to load from localStorage first
      const savedData = localStorage.getItem(localStorageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setProdutos(parsed);
        setStatus("loaded");
        return;
      }
      
      // If not in localStorage, try to load from Firestore
      try {
        const docRef = doc(db, "PCP", today);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data()[`${turno}_turno`]) {
          const firestoreData = docSnap.data()[`${turno}_turno`].map((p: any) => ({
            codigo: p.codigo,
            textoBreve: p.texto_breve,
            kg: parseFloat(p.kg || "0"),
            cx: parseFloat(p.cx || "0"),
            planejamento: parseFloat(p.planejamento || "0")
          }));
          
          setProdutos(firestoreData);
          setStatus("loaded");
          // Save to localStorage for future use
          localStorage.setItem(localStorageKey, JSON.stringify(firestoreData));
        }
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
      }
    };

    loadData();
  }, [turno]);

  // Parse número do formato brasileiro para number
  const parseNumber = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleanValue = String(value).replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanValue) || 0;
  };

  // Formatar número para exibição brasileira
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Importar arquivo XLS
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      readExcelFile(e.target.files[0]);
    }
  };

  // Ler arquivo Excel
  const readExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { header: 1 });

      const processedData: Produto[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row.length >= 6 && row[0] && (row[3] || row[5])) {
          processedData.push({
            codigo: String(row[0]).trim(),
            textoBreve: row[2] ? String(row[2]).trim().substring(0, 30) : "",
            kg: parseFloat(String(row[3]) || "0"),
            cx: parseFloat(String(row[5]) || "0"),
            planejamento: 0
          });
        }
      }

      setImportData(processedData);
      setIsModalOpen(true);
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirmar importação
  const confirmImport = () => {
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    
    setProdutos(importData);
    setStatus("loaded");
    setIsModalOpen(false);
    
    // Save to localStorage immediately
    localStorage.setItem(localStorageKey, JSON.stringify(importData));
  };

  // Atualizar planejamento
  const handlePlanejamentoChange = (index: number, value: string) => {
    const newProdutos = [...produtos];
    newProdutos[index].planejamento = parseNumber(value);
    setProdutos(newProdutos);
    
    // Update localStorage on every change
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    localStorage.setItem(localStorageKey, JSON.stringify(newProdutos));
  };

  // Limpar importação
  const clearImportation = () => {
    const today = getTodayDate();
    const localStorageKey = `turno${turno}_${today}`;
    
    // Limpar do localStorage
    localStorage.removeItem(localStorageKey);
    
    // Limpar estado
    setProdutos([]);
    setStatus("empty");
    
    toast({
      title: "Sucesso",
      description: `Importação do ${titulo} limpa com sucesso!`,
    });
  };

  // Salvar dados no Firestore
  const saveToFirestore = async () => {
    if (produtos.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado para salvar!",
        variant: "destructive",
      });
      return;
    }

    try {
      const today = getTodayDate();
      const docRef = doc(db, "PCP", today);
      
      await setDoc(docRef, {
        [`${turno}_turno`]: produtos.map(p => ({
          codigo: p.codigo,
          texto_breve: p.textoBreve,
          kg: p.kg, // Salvar como number
          cx: p.cx, // Salvar como number
          planejamento: p.planejamento // Salvar como number
        })),
        timestamp: new Date()
      }, { merge: true });

      setStatus("saved");
      
      // Limpar importação após salvar com sucesso
      const localStorageKey = `turno${turno}_${today}`;
      localStorage.removeItem(localStorageKey);
      setProdutos([]);
      setStatus("empty");
      
      toast({
        title: "Sucesso",
        description: `Dados do ${titulo} salvos e importação limpa com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados!",
        variant: "destructive",
      });
    }
  };

  // Estilo do badge baseado no status
  const getBadgeVariant = () => {
    switch (status) {
      case "empty": return "destructive";
      case "loaded": return "secondary";
      case "saved": return "default";
      default: return "default";
    }
  };

  // Texto do badge baseado no status
  const getBadgeText = () => {
    switch (status) {
      case "empty": return "Apontamento não importado";
      case "loaded": return "Apontamento carregado";
      case "saved": return "Apontamento salvo";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      
      <Card className="bg-card/95 backdrop-blur-sm border border-border/50">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Controle de Produção</span>
            <Badge variant={getBadgeVariant()}>
              {getBadgeText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className={`${produtos.length === 0 ? 'min-h-[300px] flex flex-col justify-center' : 'py-6'} bg-card p-8`}>
          <div className="space-y-8">
            {produtos.length === 0 && (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-6 text-foreground">Importar Planilha de Apontamento</h3>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      id={`file-upload-${turno}`}
                    />
                    <Button
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                      asChild
                    >
                      <label htmlFor={`file-upload-${turno}`} className="cursor-pointer flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Escolher Arquivo</span>
                          <span className="text-xs opacity-90">Formato .xls ou .xlsx</span>
                        </div>
                      </label>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Selecione a planilha de apontamento para importar os dados
                  </p>
                </div>
              </div>
            )}

            {produtos.length > 0 && (
              <div className="mt-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead className="w-1/4">Texto breve</TableHead>
                        <TableHead className="text-right">KG</TableHead>
                        <TableHead className="text-right">CX</TableHead>
                        <TableHead className="text-right">Planejamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.map((produto, index) => (
                        <TableRow key={index}>
                          <TableCell>{produto.codigo}</TableCell>
                          <TableCell className="truncate" title={produto.textoBreve}>{produto.textoBreve}</TableCell>
                          <TableCell className="text-right">{formatNumber(produto.kg)}</TableCell>
                          <TableCell className="text-right">{formatNumber(produto.cx)}</TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={formatNumber(produto.planejamento)}
                              onChange={(e) => handlePlanejamentoChange(index, e.target.value)}
                              className="text-right"
                              placeholder="Digite o valor"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <Button 
                    variant="destructive" 
                    onClick={clearImportation}
                    className="flex items-center gap-2 hover:bg-destructive/80 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Importação
                  </Button>
                  <Button 
                    onClick={saveToFirestore} 
                    disabled={status === "saved"}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Salvar {titulo}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Importação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Itens a serem importados</DialogTitle>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="w-1/4">Texto breve</TableHead>
                  <TableHead className="text-right">KG</TableHead>
                  <TableHead className="text-right">CX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell className="truncate" title={item.textoBreve}>{item.textoBreve}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.kg)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.cx)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-secondary/80 hover:scale-105 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmImport}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-lg"
            >
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TurnoForm;