
import { useState } from "react";
import { FileText, Upload, Search, Download } from "lucide-react";

import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const NotasFiscais = () => {
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const { toast } = useToast();

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    if (arquivos && arquivos[0]) {
      const arquivo = arquivos[0];
      // Verificar se é um arquivo XML
      if (arquivo.type !== "text/xml" && !arquivo.name.endsWith('.xml')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo XML.",
          variant: "destructive",
        });
        return;
      }
      setArquivoSelecionado(arquivo);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoSelecionado) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, selecione um arquivo XML da NFe.",
        variant: "destructive",
      });
      return;
    }

    setCarregando(true);
    
    // Simulando processamento do XML
    setTimeout(() => {
      setCarregando(false);
      toast({
        title: "XML processado com sucesso",
        description: "Os itens da nota fiscal foram extraídos.",
      });
      // Redirecionar para página de confirmação (a ser implementada)
    }, 2000);
  };

  return (
    <AppLayout title="Notas Fiscais">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload de Nota Fiscal Eletrônica</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Selecione o arquivo XML da NFe
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-muted/50 cursor-pointer"
                    onClick={() => document.getElementById("arquivo-xml")?.click()}
                  >
                    {arquivoSelecionado ? (
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                        <p className="font-medium">{arquivoSelecionado.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(arquivoSelecionado.size / 1024).toFixed(2)} KB
                        </p>
                        <Button 
                          variant="link" 
                          className="mt-2 h-auto p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setArquivoSelecionado(null);
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground text-center">
                          Clique para fazer upload ou arraste o arquivo XML aqui
                        </p>
                      </>
                    )}
                    <Input 
                      id="arquivo-xml"
                      type="file" 
                      accept=".xml" 
                      className="hidden" 
                      onChange={handleArquivoChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={!arquivoSelecionado || carregando}>
                    {carregando ? "Processando..." : "Processar XML"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="pendentes">
              <TabsList>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="processadas">Processadas</TabsTrigger>
              </TabsList>
              <TabsContent value="pendentes" className="mt-4">
                <EmptyState
                  title="Sem notas fiscais pendentes"
                  description="Não existem notas fiscais pendentes de processamento no momento."
                  icon={<FileText size={50} />}
                />
              </TabsContent>
              <TabsContent value="processadas" className="mt-4">
                <Card>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Notas fiscais processadas</h3>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar nota fiscal..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="border rounded-md">
                      <table className="data-table">
                        <thead className="data-table-header">
                          <tr>
                            <th className="data-table-head">Número</th>
                            <th className="data-table-head">Fornecedor</th>
                            <th className="data-table-head">Data</th>
                            <th className="data-table-head">Valor</th>
                            <th className="data-table-head">Status</th>
                            <th className="data-table-head">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="data-table-body">
                          <tr className="data-table-row">
                            <td className="data-table-cell">NF-001234</td>
                            <td className="data-table-cell">Distribuidora ABC</td>
                            <td className="data-table-cell">12/04/2025</td>
                            <td className="data-table-cell">R$ 4.850,00</td>
                            <td className="data-table-cell">
                              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                Processada
                              </span>
                            </td>
                            <td className="data-table-cell">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" /> XML
                              </Button>
                            </td>
                          </tr>
                          <tr className="data-table-row">
                            <td className="data-table-cell">NF-001233</td>
                            <td className="data-table-cell">Alimentos XYZ</td>
                            <td className="data-table-cell">11/04/2025</td>
                            <td className="data-table-cell">R$ 2.320,00</td>
                            <td className="data-table-cell">
                              <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                Processada
                              </span>
                            </td>
                            <td className="data-table-cell">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" /> XML
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ajuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Como funciona o processo?</h4>
                <p className="text-muted-foreground">
                  Faça o upload do arquivo XML da nota fiscal eletrônica. O sistema irá extrair automaticamente os dados e itens para confirmação.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Onde obter o arquivo XML?</h4>
                <p className="text-muted-foreground">
                  O arquivo XML da NFe é enviado pelo fornecedor ou pode ser obtido no portal da SEFAZ do seu estado.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Após o processamento</h4>
                <p className="text-muted-foreground">
                  Revise os dados e itens extraídos, confirme as quantidades recebidas e finalize o processo para atualizar automaticamente o estoque.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Status da SEFAZ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Sistema online e operacional</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotasFiscais;
