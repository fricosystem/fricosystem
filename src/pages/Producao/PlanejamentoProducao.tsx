import { useEffect, useState } from "react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { getProdutos } from "@/pages/Producao/Services/ProdutoService";
import { getPlanejamentoByPeriodo, salvarPlanejamento } from "@/pages/Producao/Services/PlanejamentoService";
import AppLayout from "@/layouts/AppLayout"; // Updated import
import { ProdutoTree } from "@/pages/Producao/Componentes/ProdutoTreeProducao";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Calendar as CalendarIcon, Save, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Planejamento, ItemPlanejamento, Produto } from "@/types/typesProducao";
import { toast } from "sonner";

const PlanejamentoProducao = () => {
  const { userData } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      
      try {
        // Carregar produtos
        const resultProdutos = await getProdutos();
        
        if (resultProdutos.success) {
          setProdutos(resultProdutos.produtos);
        } else {
          toast.error("Erro ao carregar produtos");
        }
        
        // Carregar planejamento para o período selecionado
        const inicioSemana = startOfWeek(periodoSelecionado, { weekStartsOn: 1 });
        const fimSemana = endOfWeek(periodoSelecionado, { weekStartsOn: 1 });
        
        const resultPlanejamento = await getPlanejamentoByPeriodo(inicioSemana, fimSemana);
        
        if (resultPlanejamento.success) {
          if (resultPlanejamento.planejamento) {
            setPlanejamento(resultPlanejamento.planejamento);
          } else {
            // Criar um novo planejamento vazio
            const novoPlanejamento: Planejamento = {
              dataInicio: format(inicioSemana, "yyyy-MM-dd"),
              dataFim: format(fimSemana, "yyyy-MM-dd"),
              responsavel: userData?.nome || "",
              itens: criarItensPlanejamento(resultProdutos.produtos),
              status: "rascunho",
              criadoEm: null,
              atualizadoEm: null,
            };
            
            setPlanejamento(novoPlanejamento);
          }
        } else {
          toast.error("Erro ao carregar planejamento");
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [periodoSelecionado, userData]);

  const criarItensPlanejamento = (produtos: Produto[]): ItemPlanejamento[] => {
    // Implementação simplificada - na prática, você precisaria carregar as receitas
    // e criar a estrutura hierárquica correta
    
    // Considerando que todos os produtos com quantidade mínima > 0 são produtos finais
    const produtosFinais = produtos.filter((p) => p.quantidade_minima > 0);
    const ingredientes = produtos.filter((p) => p.quantidade_minima === 0);
    
    return produtosFinais.map((produto) => {
      // Para cada produto final, vamos simular que ele precisa de 2-3 ingredientes aleatórios
      const ingredientesNecessarios = ingredientes
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 2) + 2);
      
      return {
        produtoId: produto.id,
        produtoNome: produto.nome,
        quantidadePlanejada: 0,
        unidadeMedida: produto.unidade_de_medida,
        ingredientes: ingredientesNecessarios.map((ing) => {
          const quantidadeNecessariaPorUnidade = Math.random() * 2 + 0.5; // Entre 0.5 e 2.5
          
          return {
            produtoId: ing.id,
            produtoNome: ing.nome,
            quantidadeNecessaria: 0, // Será calculado com base na quantidade planejada
            quantidadeDisponivel: ing.quantidade,
            unidadeMedida: ing.unidade_de_medida,
            suficiente: true, // Será recalculado
          };
        }),
      };
    });
  };

  const atualizarQuantidadeProduto = (index: number, quantidade: number) => {
    if (!planejamento) return;
    
    const novosProdutos = [...planejamento.itens];
    const produto = novosProdutos[index];
    produto.quantidadePlanejada = quantidade;
    
    // Atualizar quantidades necessárias de ingredientes
    produto.ingredientes = produto.ingredientes.map((ing) => {
      // Simular uma relação entre produto e ingrediente
      // Na prática, isso viria da tabela de receitas
      const fatorConversao = Math.random() * 2 + 0.5; // Entre 0.5 e 2.5
      const quantidadeNecessaria = quantidade * fatorConversao;
      
      return {
        ...ing,
        quantidadeNecessaria,
        suficiente: ing.quantidadeDisponivel >= quantidadeNecessaria,
      };
    });
    
    const novoPlanejamento = {
      ...planejamento,
      itens: novosProdutos,
    };
    
    setPlanejamento(novoPlanejamento);
  };

  const handleSalvarPlanejamento = async () => {
    if (!planejamento) return;
    
    setSalvando(true);
    
    try {
      // Calcular o valor total do planejamento
      const valorTotal = calcularValorTotalPlanejamento();
      
      const planejamentoAtualizado: Planejamento = {
        ...planejamento,
        metricas: {
          valorTotal,
        },
      };
      
      const resultado = await salvarPlanejamento(planejamentoAtualizado);
      
      if (resultado.success) {
        toast.success("Planejamento salvo com sucesso");
        
        // Atualizar o ID se for um novo planejamento
        if (!planejamento.id && resultado.planejamentoId) {
          setPlanejamento({
            ...planejamentoAtualizado,
            id: resultado.planejamentoId,
          });
        }
      } else {
        toast.error("Erro ao salvar planejamento", {
          description: resultado.error,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar planejamento:", error);
      toast.error("Erro ao salvar planejamento");
    } finally {
      setSalvando(false);
    }
  };

  const calcularValorTotalPlanejamento = () => {
    if (!planejamento) return 0;
    
    return planejamento.itens.reduce((total, item) => {
      // Buscar o produto para obter o valor unitário
      const produto = produtos.find((p) => p.id === item.produtoId);
      const valorUnitario = produto?.valor_unitario || 0;
      
      return total + item.quantidadePlanejada * valorUnitario;
    }, 0);
  };

  const temAlertasEstoque = () => {
    if (!planejamento) return false;
    
    return planejamento.itens.some((item) => {
      return item.ingredientes.some((ing) => !ing.suficiente);
    });
  };

  const getFormatoPeriodo = () => {
    if (!planejamento) return "";
    
    const dataInicio = new Date(planejamento.dataInicio);
    const dataFim = new Date(planejamento.dataFim);
    
    return `${format(dataInicio, "dd")} a ${format(dataFim, "dd 'de' MMMM, yyyy", { locale: pt })}`;
  };

  if (loading) {
    return (
      <AppLayout title="Planejamento de Produção">
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Carregando...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Planejamento de Produção">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Semana de {getFormatoPeriodo()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={periodoSelecionado}
                onSelect={(date) => date && setPeriodoSelecionado(date)}
                disabled={(date) => date < new Date("2023-01-01")}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {temAlertasEstoque() && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Há ingredientes com estoque insuficiente para a produção planejada.
            Ajuste as quantidades ou providencie mais estoque.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Produtos e Ingredientes</CardTitle>
          <CardDescription>
            Defina a quantidade planejada para cada produto final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {planejamento?.itens.map((item, index) => (
            <ProdutoTree
              key={item.produtoId}
              item={item}
              onQuantidadeChange={(quantidade) => atualizarQuantidadeProduto(index, quantidade)}
            />
          ))}
          
          {planejamento?.itens.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum produto cadastrado para planejamento
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm">
            <span className="font-medium">Status:</span>{" "}
            <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {planejamento?.status === "rascunho" ? "Rascunho" : "Confirmado"}
            </span>
          </div>
          
          <Button onClick={handleSalvarPlanejamento} disabled={salvando}>
            <Save className="mr-2 h-4 w-4" />
            {salvando ? "Salvando..." : "Salvar Planejamento"}
          </Button>
        </CardFooter>
      </Card>
    </AppLayout>
  );
};

export default PlanejamentoProducao;