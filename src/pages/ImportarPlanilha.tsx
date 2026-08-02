import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Database, Upload, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { uploadMultipleProducts, uploadProduct, uploadParadaRealizada, uploadMultipleParadasRealizadasComProgresso } from "@/firebase/firestore";
import AppLayout from "@/layouts/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportTable } from "@/components/ImportTable";
import { EquipmentTable } from "@/components/EquipamentTable";
import { ParadasRealizadasTable } from "@/components/ParadasRealizadasTable";
import { ImportedProduct, ImportedEquipment, ImportedParadaRealizada } from "@/types/typesImportarPlanilha";
import { uploadEquipment, uploadMultipleEquipments } from "@/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Timestamp } from "firebase/firestore";

// Converte número serial do Excel para string de data no formato dd/MM/yyyy
const excelDateToString = (value: any): string => {
  if (!value) return "";
  
  // Se já for uma string no formato esperado, retorna diretamente
  if (typeof value === 'string' && value.includes('/')) {
    return value;
  }
  
  // Se for um número (serial do Excel), converte para data
  if (typeof value === 'number') {
    // Excel usa 1/1/1900 como dia 1, mas tem um bug que considera 1900 como ano bissexto
    // Por isso, subtraímos 25569 para converter para Unix timestamp (dias desde 1/1/1970)
    const excelEpoch = new Date(1899, 11, 30); // 30/12/1899
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  return String(value);
};

// Função auxiliar para calcular tempo decorrido entre dois horários
const calcularTempoDecorrido = (hrInicial: string, hrFinal: string): string => {
  if (!hrInicial || !hrFinal) return "00:00";
  
  const parseHora = (hora: string): number => {
    const parts = hora.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 60 + parts[1];
  };
  
  const minutosInicial = parseHora(hrInicial);
  const minutosFinal = parseHora(hrFinal);
  const diff = Math.abs(minutosFinal - minutosInicial);
  
  const horas = Math.floor(diff / 60).toString().padStart(2, '0');
  const minutos = (diff % 60).toString().padStart(2, '0');
  
  return `${horas}:${minutos}`;
};

// Função para converter data dd/MM/yyyy para Timestamp do Firestore
const converterDataParaTimestamp = (dataString: string): Timestamp => {
  if (!dataString) return Timestamp.now();
  
  const parts = dataString.split('/').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return Timestamp.now();
  
  const [dia, mes, ano] = parts;
  const date = new Date(ano, mes - 1, dia, 0, 0, 0);
  return Timestamp.fromDate(date);
};

// Função para converter data dd/MM/yyyy + hora HH:mm para Timestamp do Firestore
const converterDataHoraParaTimestamp = (dataString: string, horaString: string): Timestamp => {
  if (!dataString) return Timestamp.now();
  
  const dataParts = dataString.split('/').map(Number);
  if (dataParts.length !== 3 || dataParts.some(isNaN)) return Timestamp.now();
  
  const [dia, mes, ano] = dataParts;
  
  // Parse da hora (formato HH:mm ou HH:mm:ss)
  let horas = 0;
  let minutos = 0;
  let segundos = 0;
  
  if (horaString) {
    const horaParts = horaString.split(':').map(Number);
    if (horaParts.length >= 2 && !horaParts.some(isNaN)) {
      horas = horaParts[0] || 0;
      minutos = horaParts[1] || 0;
      segundos = horaParts[2] || 0;
    }
  }
  
  const date = new Date(ano, mes - 1, dia, horas, minutos, segundos);
  return Timestamp.fromDate(date);
};

const ImportarPlanilha = () => {
  const [importedData, setImportedData] = useState<ImportedProduct[]>([]);
  const [importedEquipments, setImportedEquipments] = useState<ImportedEquipment[]>([]);
  const [importedParadas, setImportedParadas] = useState<ImportedParadaRealizada[]>([]);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSingle, setIsUploadingSingle] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("produtos");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { userData } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileSelected(file);
  };
  
  const handleSelectFileClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  
  const handleImport = async () => {
    if (!fileSelected) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo para importar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook;
          if (typeof data === 'string') {
            workbook = XLSX.read(data, { type: "string" });
          } else if (data instanceof ArrayBuffer) {
            workbook = XLSX.read(new Uint8Array(data), { type: "array" });
          } else {
            throw new Error("Formato de dados não suportado");
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          if (activeTab === "produtos") {
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
            
            if (jsonData.length === 0) {
              toast({
                title: "Erro",
                description: "A planilha não contém dados ou o formato está incorreto.",
                variant: "destructive",
              });
              return;
            }
            
            const products: ImportedProduct[] = jsonData.map((row) => ({
              codigo_estoque: String(row["CODIGO ESTOQUE"] || ""),
              nome: String(row["TEXTO BREVE"] || ""),
              quantidade: Number(row["QUANTIDADE"] || 0),
              unidade_de_medida: String(row["U.M"] || ""),
              detalhes: String(row["DESCRICAO"] || ""),
              valor_unitario: Number(row["VALOR UNIT"] || 0),
              quantidade_minima: Number(row["QUANTIDADE MINIMA"] || 0),
              codigo_material: String(row["CODIGO FORNECEDOR"] || "")
            }));
            
            setImportedData(products);
            toast({
              title: "Sucesso",
              description: `${products.length} produtos importados com sucesso.`,
            });
          } else if (activeTab === "equipamentos") {
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
            
            if (jsonData.length === 0) {
              toast({
                title: "Erro",
                description: "A planilha não contém dados ou o formato está incorreto.",
                variant: "destructive",
              });
              return;
            }
            
            const equipments: ImportedEquipment[] = jsonData.map((row) => ({
              patrimonio: String(row["PATRIMONIO"] || ""),
              equipamento: String(row["EQUIPAMENTOS"] || ""),
              setor: String(row["SETOR"] || ""),
              tag: String(row["TAG"] || "")
            }));
            
            setImportedEquipments(equipments);
            toast({
              title: "Sucesso",
              description: `${equipments.length} equipamentos importados com sucesso.`,
            });
          } else if (activeTab === "paradas") {
            // Lê os dados baseado nas colunas A-O (índice 0-14)
            const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
            
            if (rawData.length <= 1) {
              toast({
                title: "Erro",
                description: "A planilha não contém dados ou o formato está incorreto.",
                variant: "destructive",
              });
              return;
            }
            
            // Ignora a primeira linha (cabeçalho) e mapeia as colunas
            const paradas: ImportedParadaRealizada[] = rawData.slice(1).map((row: any[]) => ({
              setor: String(row[0] || ""),
              patrimonio: String(row[1] || ""),
              equipamento: String(row[2] || ""),
              tipoManutencao: String(row[3] || ""),
              dataProgramada: excelDateToString(row[4]),
              dataConclusao: excelDateToString(row[5]),
              hrInicial: String(row[6] || ""),
              hrFinal: String(row[7] || ""),
              manutentorI: String(row[8] || ""),
              manutentorII: String(row[9] || ""),
              manutentorIII: String(row[10] || ""),
              manutentorIIII: String(row[11] || ""),
              tipoFalha: String(row[12] || ""),
              descricaoMotivo: String(row[13] || ""),
              resolucao: String(row[14] || ""),
            })).filter((p: ImportedParadaRealizada) => p.setor || p.patrimonio || p.equipamento);
            
            setImportedParadas(paradas);
            toast({
              title: "Sucesso",
              description: `${paradas.length} paradas importadas com sucesso.`,
            });
          }
        } catch (error) {
          console.error("Erro ao processar planilha:", error);
          toast({
            title: "Erro ao processar planilha",
            description: "Verifique se o formato da planilha está correto.",
            variant: "destructive",
          });
        }
      };
      
      reader.onerror = (error) => {
        console.error("Erro ao ler arquivo:", error);
        toast({
          title: "Erro",
          description: "Não foi possível ler o arquivo.",
          variant: "destructive",
        });
      };
      
      reader.readAsArrayBuffer(fileSelected);
    } catch (error) {
      console.error("Erro ao importar arquivo:", error);
      toast({
        title: "Erro",
        description: "Falha ao importar o arquivo.",
        variant: "destructive",
      });
    }
  };
  
  const handleClearData = () => {
    if (activeTab === "produtos") {
      setImportedData([]);
    } else if (activeTab === "equipamentos") {
      setImportedEquipments([]);
    } else if (activeTab === "paradas") {
      setImportedParadas([]);
    }
    setFileSelected(null);
    toast({
      title: "Dados limpos",
      description: "Os dados importados foram removidos.",
    });
  };
  
  const handleRemoveItem = (index: number) => {
    if (activeTab === "produtos") {
      const newData = [...importedData];
      newData.splice(index, 1);
      setImportedData(newData);
      toast({
        title: "Produto removido",
        description: "O produto foi removido da lista de importação.",
      });
    } else if (activeTab === "equipamentos") {
      const newData = [...importedEquipments];
      newData.splice(index, 1);
      setImportedEquipments(newData);
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido da lista de importação.",
      });
    } else if (activeTab === "paradas") {
      const newData = [...importedParadas];
      newData.splice(index, 1);
      setImportedParadas(newData);
      toast({
        title: "Parada removida",
        description: "A parada foi removida da lista de importação.",
      });
    }
  };
  
  const handleUpdateItem = (index: number, updatedItem: ImportedProduct | ImportedEquipment | ImportedParadaRealizada) => {
    if (activeTab === "produtos") {
      const newData = [...importedData];
      newData[index] = updatedItem as ImportedProduct;
      setImportedData(newData);
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    } else if (activeTab === "equipamentos") {
      const newData = [...importedEquipments];
      newData[index] = updatedItem as ImportedEquipment;
      setImportedEquipments(newData);
      toast({
        title: "Equipamento atualizado",
        description: "O equipamento foi atualizado com sucesso.",
      });
    } else if (activeTab === "paradas") {
      const newData = [...importedParadas];
      newData[index] = updatedItem as ImportedParadaRealizada;
      setImportedParadas(newData);
      toast({
        title: "Parada atualizada",
        description: "A parada foi atualizada com sucesso.",
      });
    }
  };

  const handleUploadProduct = async (index: number, product: ImportedProduct) => {
    setIsUploadingSingle(index);
    try {
      await uploadProduct(product);
      toast({
        title: "Sucesso",
        description: "Produto enviado para o Firestore.",
      });
    } catch (error) {
      console.error("Erro ao enviar produto:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar produto para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingSingle(null);
    }
  };

  const handleUploadEquipment = async (index: number, equipment: ImportedEquipment) => {
    setIsUploadingSingle(index);
    try {
      await uploadEquipment(equipment);
      toast({
        title: "Sucesso",
        description: `Equipamento ${equipment.equipamento} cadastrado com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao enviar equipamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar equipamento para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingSingle(null);
    }
  };

  const handleUploadParada = async (index: number, parada: ImportedParadaRealizada) => {
    if (!userData) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingSingle(index);
    try {
      const paradaFormatada = {
        status: "concluido",
        criadoEm: converterDataHoraParaTimestamp(parada.dataConclusao || parada.dataProgramada, parada.hrInicial),
        criadoPor: userData.id,
        encarregadoId: userData.id,
        encarregadoNome: userData.nome,
        horarioExecucaoFim: parada.hrFinal,
        horarioExecucaoInicio: parada.hrInicial,
        horarioProgramado: parada.hrInicial,
        id: crypto.randomUUID(),
        origemParada: parada.tipoFalha,
        tempoTotalDecorrido: calcularTempoDecorrido(parada.hrInicial, parada.hrFinal),
        tentativaAtual: 1,
        setor: parada.setor,
        patrimonio: parada.patrimonio,
        equipamento: parada.equipamento,
        tipoManutencao: parada.tipoManutencao,
        dataProgramada: converterDataHoraParaTimestamp(parada.dataProgramada, parada.hrInicial),
        dataConclusao: converterDataHoraParaTimestamp(parada.dataConclusao, parada.hrFinal),
        hrInicial: parada.hrInicial,
        hrFinal: parada.hrFinal,
        manutentorII: parada.manutentorII,
        manutentorIII: parada.manutentorIII,
        manutentorIIII: parada.manutentorIIII,
        tipoFalha: parada.tipoFalha,
        descricaoMotivo: parada.descricaoMotivo,
        resolucao: parada.resolucao,
      };

      await uploadParadaRealizada(paradaFormatada);
      toast({
        title: "Sucesso",
        description: `Parada do equipamento ${parada.equipamento} cadastrada com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao enviar parada:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar parada para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingSingle(null);
    }
  };

  const handleUploadAllEquipments = async () => {
    if (importedEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Não há equipamentos para enviar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      await uploadMultipleEquipments(importedEquipments);
      toast({
        title: "Sucesso",
        description: `${importedEquipments.length} equipamentos enviados para o Firestore.`,
      });
    } catch (error) {
      console.error("Erro ao enviar equipamentos:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar equipamentos para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUploadAll = async () => {
    if (activeTab === "produtos") {
      if (importedData.length === 0) {
        toast({
          title: "Erro",
          description: "Não há produtos para enviar.",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      try {
        await uploadMultipleProducts(importedData);
        toast({
          title: "Sucesso",
          description: `${importedData.length} produtos enviados para o Firestore.`,
        });
      } catch (error) {
        console.error("Erro ao enviar produtos:", error);
        toast({
          title: "Erro",
          description: "Falha ao enviar produtos para o Firestore.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    } else if (activeTab === "equipamentos") {
      if (importedEquipments.length === 0) {
        toast({
          title: "Erro",
          description: "Não há equipamentos para enviar.",
          variant: "destructive",
        });
        return;
      }
      
      setIsUploading(true);
      try {
        await uploadMultipleEquipments(importedEquipments);
        toast({
          title: "Sucesso",
          description: `${importedEquipments.length} equipamentos enviados para o Firestore.`,
        });
      } catch (error) {
        console.error("Erro ao enviar equipamentos:", error);
        toast({
          title: "Erro",
          description: "Falha ao enviar equipamentos para o Firestore.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    } else if (activeTab === "paradas") {
      if (importedParadas.length === 0) {
        toast({
          title: "Erro",
          description: "Não há paradas para enviar.",
          variant: "destructive",
        });
        return;
      }

      if (!userData) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }
      
      setShowProgressModal(true);
      setUploadProgress(0);
      setIsUploading(true);

      try {
        // Mapeia as paradas para o formato esperado no Firestore
        const paradasFormatadas = importedParadas.map((parada) => ({
          status: "concluido",
          criadoEm: converterDataHoraParaTimestamp(parada.dataConclusao || parada.dataProgramada, parada.hrInicial),
          criadoPor: userData.id,
          encarregadoId: userData.id,
          encarregadoNome: userData.nome,
          horarioExecucaoFim: parada.hrFinal,
          horarioExecucaoInicio: parada.hrInicial,
          horarioProgramado: parada.hrInicial,
          id: crypto.randomUUID(),
          origemParada: parada.tipoFalha,
          tempoTotalDecorrido: calcularTempoDecorrido(parada.hrInicial, parada.hrFinal),
          tentativaAtual: 1,
          setor: parada.setor,
          patrimonio: parada.patrimonio,
          equipamento: parada.equipamento,
          tipoManutencao: parada.tipoManutencao,
          dataProgramada: converterDataHoraParaTimestamp(parada.dataProgramada, parada.hrInicial),
          dataConclusao: converterDataHoraParaTimestamp(parada.dataConclusao, parada.hrFinal),
          hrInicial: parada.hrInicial,
          hrFinal: parada.hrFinal,
          manutentorII: parada.manutentorII,
          manutentorIII: parada.manutentorIII,
          manutentorIIII: parada.manutentorIIII,
          tipoFalha: parada.tipoFalha,
          descricaoMotivo: parada.descricaoMotivo,
          resolucao: parada.resolucao,
        }));

        await uploadMultipleParadasRealizadasComProgresso(
          paradasFormatadas,
          (progress) => setUploadProgress(progress)
        );

        toast({
          title: "Sucesso",
          description: `${importedParadas.length} paradas enviadas para o Firestore.`,
        });
      } catch (error) {
        console.error("Erro ao enviar paradas:", error);
        toast({
          title: "Erro",
          description: "Falha ao enviar paradas para o Firestore.",
          variant: "destructive",
        });
      } finally {
        setShowProgressModal(false);
        setIsUploading(false);
      }
    }
  };

  const getCurrentCount = () => {
    if (activeTab === "produtos") return importedData.length;
    if (activeTab === "equipamentos") return importedEquipments.length;
    if (activeTab === "paradas") return importedParadas.length;
    return 0;
  };

  const renderFileControls = () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        <Input 
          ref={fileInputRef}
          type="file" 
          accept=".xlsx,.xls,.csv" 
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          onClick={handleSelectFileClick} 
          variant="outline"
          className="w-full md:w-auto bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
        >
          <Upload className="mr-2 h-4 w-4" />
          Selecionar Arquivo
        </Button>
        <Button 
          onClick={handleImport}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          Importar Dados
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClearData}
          className="w-full md:w-auto bg-gray-700 border-gray-600 hover:bg-gray-600 text-white"
        >
          Limpar Dados
        </Button>
        <Button 
          variant="outline"
          onClick={handleUploadAll}
          disabled={isUploading}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Database className="mr-2 h-5 w-5" />
          {isUploading ? "Enviando..." : `Enviar Todos (${getCurrentCount()})`}
        </Button>
      </div>
      
      {fileSelected && (
        <p className="text-sm text-gray-300 break-all">
          Arquivo selecionado: {fileSelected.name}
        </p>
      )}
    </div>
  );

  return (
    <AppLayout title="Importar Planilha">
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-gray-950 text-white">
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-full mx-auto space-y-6">
            <Card className="w-full bg-gray-950">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Upload className="mr-2 h-5 w-5" />
                  Importar Planilha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                    <TabsTrigger 
                      value="produtos" 
                      className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                    >
                      Importar Produtos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="equipamentos" 
                      className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                    >
                      Importar Equipamentos
                    </TabsTrigger>
                    <TabsTrigger 
                      value="paradas" 
                      className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                    >
                      Importar Paradas Realizadas
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="produtos" className="mt-4">
                    {renderFileControls()}
                  </TabsContent>
                  
                  <TabsContent value="equipamentos" className="mt-4">
                    {renderFileControls()}
                  </TabsContent>

                  <TabsContent value="paradas" className="mt-4">
                    {renderFileControls()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {activeTab === "produtos" && importedData.length > 0 && (
              <div className="space-y-6">
                <Card className="w-full bg-gray-950 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <FileText className="mr-2 h-5 w-5" />
                      Dados Importados - Produtos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <ImportTable
                      products={importedData}
                      onRemoveProduct={handleRemoveItem}
                      onUpdateProduct={(index, product) => handleUpdateItem(index, product)}
                      onUploadProduct={handleUploadProduct}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "equipamentos" && importedEquipments.length > 0 && (
              <div className="space-y-6">
                <Card className="w-full bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <FileText className="mr-2 h-5 w-5" />
                      Dados Importados - Equipamentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <EquipmentTable
                      equipments={importedEquipments}
                      onRemoveEquipment={handleRemoveItem}
                      onUpdateEquipment={(index, equipment) => handleUpdateItem(index, equipment)}
                      onUploadEquipment={handleUploadEquipment}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "paradas" && importedParadas.length > 0 && (
              <div className="space-y-6">
                <Card className="w-full bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-white">
                      <FileText className="mr-2 h-5 w-5" />
                      Dados Importados - Paradas Realizadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <ParadasRealizadasTable
                      paradas={importedParadas}
                      onRemoveParada={handleRemoveItem}
                      onUpdateParada={(index, parada) => handleUpdateItem(index, parada)}
                      onUploadParada={handleUploadParada}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Progresso */}
        <Dialog open={showProgressModal} onOpenChange={() => {}}>
          <DialogContent className="bg-gray-800 border-gray-700 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-center">
                Enviando Paradas Realizadas
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-center text-xl font-semibold text-white">
                {uploadProgress}%
              </p>
              <p className="text-center text-sm text-gray-400">
                Por favor, aguarde enquanto os dados são enviados...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default ImportarPlanilha;
