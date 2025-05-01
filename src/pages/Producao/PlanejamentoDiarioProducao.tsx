import { useState, useEffect } from "react";
import { format, addDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar as CalendarIcon, Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Planejamento, ProdutoFinal } from "@/types/typesProducao";
import { getPlanejamentoPorData } from "@/pages/Producao/Services/PlanejamentoService";
import { getProdutosFinais } from "@/pages/Producao/Services/ProdutoFinalService";
import { concluirPlanejamentoDoDia } from "@/pages/Producao/Services/PlanejamentoConcluidoService";

const PlanejamentoDiarioProducao = () => {
  const { userData } = useAuth();
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [produtosFinais, setProdutosFinais] = useState<ProdutoFinal[]>([]);
  const [quantidadesProduzidas, setQuantidadesProduzidas] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  useEffect(() => {
    carregarDados();
  }, [dataSelecionada]);
  
  const carregarDados = async () => {
    setLoading(true);
    
    try {
      // Carregar produtos finais
      const produtosFinaisResult = await getProdutosFinais();
      
      if (produtosFinaisResult.success) {
        setProdutosFinais(produtosFinaisResult.produtosFinais);
      } else {
        toast.error("Erro ao carregar produtos finais");
      }
      
      // Buscar planejamento para a data selecionada
      const planejamentoResult = await getPlanejamentoPorData(dataSelecionada);
      
      if (planejamentoResult.success) {
        setPlanejamento(planejamentoResult.planejamento);
        
        // Inicializar as quantidades produzidas com base nos itens do planejamento
        const quantidades: {[key: string]: number} = {};
        planejamentoResult.planejamento.itens.forEach(item => {
          quantidades[item.produtoId] = item.quantidadePlanejada;
        });
        
        setQuantidadesProduzidas(quantidades);
      } else {
        setPlanejamento(null);
        setQuantidadesProduzidas({});
        toast.error("Nenhum planejamento encontrado para esta data");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuantidadeChange = (produtoId: string, quantidade: number) => {
    setQuantidadesProduzidas(prev => ({
      ...prev,
      [produtoId]: quantidade
    }));
  };
  
  const handleConcluirPlanejamento = async () => {
    if (!planejamento) return;
    
    setSalvando(true);
    
    try {
      // Atualizar as quantidades no planejamento antes de concluir
      const planejamentoAtualizado: Planejamento = {
        ...planejamento,
        itens: planejamento.itens.map(item => ({
          ...item,
          quantidadePlanejada: quantidadesProduzidas[item.produtoId] || item.quantidadePlanejada
        }))
      };
      
      const resultado = await concluirPlanejamentoDoDia(planejamentoAtualizado, dataSelecionada);
      
      if (resultado.success) {
        toast.success("Planejamento do dia concluído com sucesso");
      } else {
        toast.error(resultado.error || "Erro ao concluir planejamento");
      }
    } catch (error) {
      console.error("Erro ao concluir planejamento:", error);
      toast.error("Erro ao concluir planejamento");
    } finally {
      setSalvando(false);
    }
  };
  
  const pageContent = () => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Carregando planejamento...</span>
        </div>
      );
    }
    
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(dataSelecionada, "dd 'de' MMMM, yyyy", { locale: pt })}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dataSelecionada}
                onSelect={(date) => date && setDataSelecionada(date)}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {!planejamento ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sem planejamento</AlertTitle>
            <AlertDescription>
              Nenhum planejamento encontrado para a data selecionada.
              Crie um planejamento semanal que inclua esta data.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Produção de {format(dataSelecionada, "dd/MM/yyyy")}</CardTitle>
              <CardDescription>
                Registre a quantidade produzida de cada produto final para esta data
              </CardDescription>a
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {planejamento.itens.length > 0 ? (
                  planejamento.itens.map((item) => {
                    const produtoFinal = produtosFinais.find(p => p.id === item.produtoId);
                    
                    return (
                      <div key={item.produtoId} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{item.produtoNome}</h3>
                            <p className="text-sm text-muted-foreground">
                              Planejado: {item.quantidadePlanejada} {item.unidadeMedida}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Produzido:</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={quantidadesProduzidas[item.produtoId] || 0}
                              onChange={(e) => handleQuantidadeChange(item.produtoId, parseFloat(e.target.value) || 0)}
                              className="w-24 text-right"
                            />
                            <span className="w-16 text-sm text-gray-600">{item.unidadeMedida}</span>
                          </div>
                        </div>
                        
                        {produtoFinal && (
                          <div className="mt-4 rounded-md bg-gray-50 p-2">
                            <h4 className="mb-1 text-sm font-medium">Ingredientes utilizados:</h4>
                            <div className="grid gap-1">
                              {produtoFinal.ingredientes.map((ing) => {
                                const quantidadeUsada = 
                                  (quantidadesProduzidas[item.produtoId] || 0) * ing.quantidade;
                                
                                return (
                                  <div key={ing.produtoId} className="flex justify-between text-sm">
                                    <span>{ing.produtoNome}</span>
                                    <span>
                                      {quantidadeUsada.toFixed(2)} {ing.unidadeMedida}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-lg text-muted-foreground">
                      Nenhum produto final no planejamento desta data
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="text-sm">
                <span className="font-medium">Responsável:</span>{" "}
                <span>{userData?.nome || planejamento.responsavel}</span>
              </div>
              
              <Button onClick={handleConcluirPlanejamento} disabled={salvando}>
                <Check className="mr-2 h-4 w-4" />
                {salvando ? "Concluindo..." : "Concluir Produção do Dia"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </>
    );
  };
  
  return (
    <AppLayout title="Produção Diária">
      {pageContent()}
    </AppLayout>
  );
};

export default PlanejamentoDiarioProducao;