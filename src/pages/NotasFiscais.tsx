
import { useEffect, useState } from "react";
import { FileText, Upload, Search, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";

import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/EmptyState";
import LoadingIndicator from "@/components/LoadingIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useNotasFiscais from "@/hooks/useNotasFiscais";

// Simulated SEFAZ status check
interface SefazStatus {
  status: "online" | "partial" | "offline";
  message: string;
  lastChecked: string;
}

const NotasFiscais = () => {
  const { 
    notasFiscais,
    loading,
    arquivoSelecionado, 
    carregando,
    setArquivoSelecionado,
    handleArquivoChange,
    processarNota
  } = useNotasFiscais();

  const [sefazStatus, setSefazStatus] = useState<SefazStatus>({
    status: "online",
    message: "Sistema online e operacional",
    lastChecked: new Date().toLocaleTimeString('pt-BR')
  });

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [checkingSefaz, setCheckingSefaz] = useState(false);

  // Simulate loading progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processarNota();
  };

  const checkSefazStatus = () => {
    setCheckingSefaz(true);
    
    // Simulate API call to check SEFAZ status
    setTimeout(() => {
      // Randomly select a status for demonstration
      const statusOptions: ("online" | "partial" | "offline")[] = ["online", "online", "online", "partial", "offline"];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      const messages = {
        online: "Sistema online e operacional",
        partial: "Sistema operando com instabilidade",
        offline: "Sistema temporariamente indisponível"
      };
      
      setSefazStatus({
        status: randomStatus,
        message: messages[randomStatus],
        lastChecked: new Date().toLocaleTimeString('pt-BR')
      });
      
      setCheckingSefaz(false);
    }, 2000);
  };

  // Check SEFAZ status on component mount
  useEffect(() => {
    checkSefazStatus();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Notas Fiscais">
        <LoadingIndicator 
          message="Buscando notas fiscais..." 
          progress={loadingProgress}
          showProgress={true}
        />
      </AppLayout>
    );
  }

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
                    {carregando ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : "Processar XML"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="processadas">
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

                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Carregando notas fiscais...</span>
                      </div>
                    ) : notasFiscais.length > 0 ? (
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
                            {notasFiscais.map((nota) => (
                              <tr key={nota.id} className="data-table-row">
                                <td className="data-table-cell">{nota.id}</td>
                                <td className="data-table-cell">{nota.fornecedor}</td>
                                <td className="data-table-cell">
                                  {new Date(nota.dataEmissao).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="data-table-cell">
                                  R$ {nota.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="data-table-cell">
                                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                    {nota.status === 'processada' ? 'Processada' : 'Pendente'}
                                  </span>
                                </td>
                                <td className="data-table-cell">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4 mr-1" /> XML
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState
                        title="Nenhuma nota fiscal processada"
                        description="Não existem notas fiscais processadas no momento."
                        icon={<FileText size={50} />}
                      />
                    )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Status da SEFAZ</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={checkSefazStatus}
                disabled={checkingSefaz}
              >
                {checkingSefaz ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
            </CardHeader>
            <CardContent>
              {checkingSefaz ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Verificando status da SEFAZ...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    {sefazStatus.status === 'online' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {sefazStatus.status === 'partial' && (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    {sefazStatus.status === 'offline' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${
                      sefazStatus.status === 'online' ? 'text-green-500' :
                      sefazStatus.status === 'partial' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {sefazStatus.message}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Última verificação: {sefazStatus.lastChecked}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotasFiscais;
