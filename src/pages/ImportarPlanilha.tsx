import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Database, Upload, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { uploadMultipleProducts, uploadProduct } from "@/firebase/firestore";
import AppLayout from "@/layouts/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportTable } from "@/components/ImportTable";
import { EquipmentTable } from "@/components/EquipamentTable";
import { ImportedProduct, ImportedEquipment } from "@/types/typesImportarPlanilha";
import { uploadEquipment, uploadMultipleEquipments } from "@/firebase/firestore";

const ImportarPlanilha = () => {
  const [importedData, setImportedData] = useState<ImportedProduct[]>([]);
  const [importedEquipments, setImportedEquipments] = useState<ImportedEquipment[]>([]);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSingle, setIsUploadingSingle] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("produtos");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
              detalhes: String(row["DESCRICAO"] || "")
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
    } else {
      setImportedEquipments([]);
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
    } else {
      const newData = [...importedEquipments];
      newData.splice(index, 1);
      setImportedEquipments(newData);
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido da lista de importação.",
      });
    }
  };
  
  const handleUpdateItem = (index: number, updatedItem: ImportedProduct | ImportedEquipment) => {
    if (activeTab === "produtos") {
      const newData = [...importedData];
      newData[index] = updatedItem as ImportedProduct;
      setImportedData(newData);
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    } else {
      const newData = [...importedEquipments];
      newData[index] = updatedItem as ImportedEquipment;
      setImportedEquipments(newData);
      toast({
        title: "Equipamento atualizado",
        description: "O equipamento foi atualizado com sucesso.",
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
    } else {
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
    }
  };

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
                  <TabsList className="grid w-full grid-cols-2 bg-gray-700">
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
                  </TabsList>
                  
                  <TabsContent value="produtos" className="mt-4">
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
                          {isUploading ? "Enviando..." : `Enviar Todos (${importedData.length})`}
                        </Button>
                      </div>
                      
                      {fileSelected && (
                        <p className="text-sm text-gray-300 break-all">
                          Arquivo selecionado: {fileSelected.name}
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="equipamentos" className="mt-4">
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
                          {isUploading ? "Enviando..." : `Enviar Todos (${importedEquipments.length})`}
                        </Button>
                      </div>
                      
                      {fileSelected && (
                        <p className="text-sm text-gray-300 break-all">
                          Arquivo selecionado: {fileSelected.name}
                        </p>
                      )}
                    </div>
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ImportarPlanilha;