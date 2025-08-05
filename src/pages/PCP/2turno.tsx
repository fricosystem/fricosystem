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
import { toast } from "@/components/ui/use-toast";

interface Produto {
  codigo: string;
  textoBreve: string;
  kg: string;
  cx: string;
  planejamento: string;
}

const SegundoTurno: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importData, setImportData] = useState<Produto[]>([]);
  const [status, setStatus] = useState<"empty" | "loaded" | "saved">("empty");

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Load data from localStorage and Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      const today = getTodayDate();
      const localStorageKey = `segundoTurno_${today}`;
      
      // Try to load from localStorage first
      const savedData = localStorage.getItem(localStorageKey);
      if (savedData) {
        setProdutos(JSON.parse(savedData));
        setStatus("loaded");
        return;
      }
      
      // If not in localStorage, try to load from Firestore
      try {
        const docRef = doc(db, "PCP", today);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data()["2 Turno"]) {
          const firestoreData = docSnap.data()["2 Turno"].map((p: any) => ({
            codigo: p.codigo,
            textoBreve: p.texto_breve,
            kg: parseFloat(p.kg).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            cx: parseFloat(p.cx).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            planejamento: p.planejamento ? parseFloat(p.planejamento).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00"
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
  }, []);

  // Formatar número no formato brasileiro ao sair do campo
  const formatNumberOnBlur = (value: string): string => {
    if (!value) return "";
    
    // Remove tudo que não é dígito ou vírgula/ponto decimal
    const cleanValue = value.replace(/[^\d,.-]/g, "");
    
    // Se não tiver valor, retorna vazio
    if (cleanValue === "") return "";
    
    // Verifica se já está no formato brasileiro
    if (/^[\d.]*,\d{0,2}$/.test(cleanValue)) {
      return cleanValue;
    }
    
    // Converte para número e formata
    const number = parseFloat(cleanValue.replace(/\./g, "").replace(",", ".")) || 0;
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  // Parse número do formato brasileiro
  const parseNumber = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleanValue) || 0;
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
            kg: row[3] ? String(row[3]).replace(".", ",") : "0,00",
            cx: row[5] ? String(row[5]).replace(".", ",") : "0,00",
            planejamento: ""
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
    const localStorageKey = `segundoTurno_${today}`;
    
    setProdutos(importData);
    setStatus("loaded");
    setIsModalOpen(false);
    
    // Save to localStorage immediately
    localStorage.setItem(localStorageKey, JSON.stringify(importData));
  };

  // Atualizar planejamento
  const handlePlanejamentoChange = (index: number, value: string) => {
    const newProdutos = [...produtos];
    newProdutos[index].planejamento = value;
    setProdutos(newProdutos);
    
    // Update localStorage on every change
    const today = getTodayDate();
    const localStorageKey = `segundoTurno_${today}`;
    localStorage.setItem(localStorageKey, JSON.stringify(newProdutos));
  };

  // Formatar ao sair do campo
  const handlePlanejamentoBlur = (index: number) => {
    const newProdutos = [...produtos];
    newProdutos[index].planejamento = formatNumberOnBlur(newProdutos[index].planejamento);
    setProdutos(newProdutos);
    
    // Update localStorage on blur
    const today = getTodayDate();
    const localStorageKey = `segundoTurno_${today}`;
    localStorage.setItem(localStorageKey, JSON.stringify(newProdutos));
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
        "2 Turno": produtos.map(p => ({
          codigo: p.codigo,
          texto_breve: p.textoBreve,
          kg: parseNumber(p.kg).toFixed(2),
          cx: parseNumber(p.cx).toFixed(2),
          planejamento: p.planejamento ? parseNumber(p.planejamento).toFixed(2) : "0.00"
        })),
        timestamp: new Date()
      }, { merge: true }); // Using merge to preserve other shifts' data

      setStatus("saved");
      
      // Update localStorage with saved data
      const localStorageKey = `segundoTurno_${today}`;
      localStorage.setItem(localStorageKey, JSON.stringify(produtos));
      
      toast({
        title: "Sucesso",
        description: "Dados do 2° Turno salvos com sucesso!",
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
      <h2 className="text-2xl font-bold">2° Turno</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Controle de Produção - 2° Turno</span>
            <Badge variant={getBadgeVariant()}>
              {getBadgeText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Importar planilha de apontamento (.xls):</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="file" 
                    accept=".xls,.xlsx" 
                    onChange={handleFileChange}
                    className="max-w-xs bg-blue-500 text-white hover:bg-blue-600"
                  />
                </div>
              </div>
            </div>

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
                          <TableCell className="text-right">{produto.kg}</TableCell>
                          <TableCell className="text-right">{produto.cx}</TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={produto.planejamento}
                              onChange={(e) => handlePlanejamentoChange(index, e.target.value)}
                              onBlur={() => handlePlanejamentoBlur(index)}
                              className="text-right"
                              placeholder="Digite o valor"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={saveToFirestore} disabled={status === "saved"}>
                    Salvar Segundo Turno
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
                    <TableCell className="text-right">{item.kg}</TableCell>
                    <TableCell className="text-right">{item.cx}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmImport}>
              Confirmar Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SegundoTurno;