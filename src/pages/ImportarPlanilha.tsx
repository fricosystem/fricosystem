import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import ImportTable from "@/components/ImportTable";
import { ImportedProduct, SpreadsheetRow } from "@/types/typesImportarPlanilha";
import { Database, Upload, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import { uploadMultipleProducts } from "@/firebase/firestore";
import AppLayout from "@/layouts/AppLayout";

const ImportarPlanilha = () => {
  const [importedData, setImportedData] = useState<ImportedProduct[]>([]);
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
          const jsonData = XLSX.utils.sheet_to_json<SpreadsheetRow>(worksheet);
          
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
    setImportedData([]);
    setFileSelected(null);
    toast({
      title: "Dados limpos",
      description: "Os dados importados foram removidos.",
    });
  };
  
  const handleRemoveProduct = (index: number) => {
    const newData = [...importedData];
    newData.splice(index, 1);
    setImportedData(newData);
    toast({
      title: "Produto removido",
      description: "O produto foi removido da lista de importação.",
    });
  };
  
  const handleUpdateProduct = (index: number, updatedProduct: ImportedProduct) => {
    const newData = [...importedData];
    newData[index] = updatedProduct;
    setImportedData(newData);
    toast({
      title: "Produto atualizado",
      description: "O produto foi atualizado com sucesso.",
    });
  };
  
  const handleUploadAll = async () => {
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
  };

  return (
    <AppLayout title="Importar Planilha">
      <div className="flex flex-col min-h-[calc(100vh-64px)] bg-background">
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-full mx-auto space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  Importar Planilha
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      className="w-full md:w-auto"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Arquivo
                    </Button>
                    <Button 
                      onClick={handleImport}
                      className="w-full md:w-auto"
                    >
                      Importar Dados
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClearData}
                      className="w-full md:w-auto"
                    >
                      Limpar Dados
                    </Button>
                        <Button 
                        variant="outline"
                        onClick={handleUploadAll}
                        disabled={isUploading}
                        className="w-full md:w-auto"
                    >
                        <Database className="mr-2 h-5 w-5" />
                        {isUploading ? "Enviando..." : `Enviar Todos (${importedData.length})`}
                    </Button>
                  </div>
                  
                  {fileSelected && (
                    <p className="text-sm text-muted-foreground break-all">
                      Arquivo selecionado: {fileSelected.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {importedData.length > 0 && (
              <div className="space-y-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Dados Importados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <ImportTable
                      products={importedData}
                      onRemoveProduct={handleRemoveProduct}
                      onUpdateProduct={handleUpdateProduct}
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