import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { useProdutos } from "@/hooks/useProdutos";
import { useMateriais, gerarMateriaisNecessarios } from "@/hooks/useMateriais";
import { usePlanejamento, DiaPlanejamento, Produto } from "@/hooks/usePlanejamento";
import DiaPlanejamentoComponent from "@/components/Planejamento/DiaPlanejamento";

const PlanejamentoProducao = () => {
  const { toast } = useToast();
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });

  const { produtos: produtosEstoque, loading: carregandoProdutos } = useProdutos();
  const { data: materiaisEstoque } = useMateriais();

  const diasIniciais = Array.from({ length: 7 }, (_, i) => {
    const data = addDays(inicioSemana, i);
    return {
      id: `temp-${format(data, "yyyy-MM-dd")}`,
      data,
      produtos: [] as Produto[]
    };
  });

  const [diasState, setDias] = useState<DiaPlanejamento[]>(diasIniciais);
  const [diaAtual, setDiaAtual] = useState<string>(format(hoje, "yyyy-MM-dd"));

  const { 
    planejamento,
    isLoading,
    error,
    salvar,
    isSaving,
    saveError
  } = usePlanejamento(inicioSemana);

  useEffect(() => {
    if (planejamento && !isLoading) {
      setDias(planejamento);
    }
  }, [planejamento, isLoading]);

  const handleAddProduto = (diaIndex: number, produtoId: string, quantidade: number) => {
    if (!produtoId) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive"
      });
      return;
    }

    const produto = produtosEstoque?.find((p) => p.id === produtoId);
    if (!produto) {
      toast({
        title: "Erro",
        description: "Produto não encontrado no estoque!",
        variant: "destructive"
      });
      return;
    }

    const materiaisNecessarios = gerarMateriaisNecessarios(materiaisEstoque);

    const novoProduto: Produto = {
      id: `prod_${Date.now()}`,
      nome: produto.nome,
      quantidade: quantidade,
      unidade: produto.unidade_de_medida || produto.unidade,
      status: 'pendente',
      materiais: materiaisNecessarios
    };

    setDias(diasAtuais => 
      diasAtuais.map((dia, idx) => 
        idx === diaIndex
          ? { ...dia, produtos: [...dia.produtos, novoProduto] }
          : dia
      )
    );

    toast({
      title: "Produto adicionado",
      description: `${produto.nome} adicionado ao planejamento de ${format(diasState[diaIndex].data, 'dd/MM/yyyy')}`
    });
  };

  const handleRemoveProduto = (diaIndex: number, produtoId: string) => {
    setDias(diasAtuais => 
      diasAtuais.map((dia, idx) => 
        idx === diaIndex
          ? { ...dia, produtos: dia.produtos.filter(p => p.id !== produtoId) }
          : dia
      )
    );

    toast({
      title: "Produto removido",
      description: "Produto removido do planejamento"
    });
  };

  const handleStatusChange = (diaIndex: number, produtoId: string, novoStatus: 'pendente' | 'em_producao' | 'concluido' | 'problema') => {
    setDias(diasAtuais => 
      diasAtuais.map((dia, idx) => 
        idx === diaIndex
          ? {
              ...dia,
              produtos: dia.produtos.map(p => 
                p.id === produtoId
                  ? { ...p, status: novoStatus }
                  : p
              )
            }
          : dia
      )
    );

    toast({
      title: "Status atualizado",
      description: `Status alterado com sucesso`
    });
  };

  const handleSalvarPlanejamento = () => {
    console.log("Salvando planejamento:", diasState);
    if (diasState && diasState.length > 0) {
      salvar(diasState);
      toast({
        title: "Salvando planejamento",
        description: "Aguarde enquanto salvamos suas alterações..."
      });
    } else {
      toast({
        title: "Erro",
        description: "Não há dados para salvar",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planejamento de Produção</h1>
          <p className="text-muted-foreground">Organize a produção para os próximos 7 dias</p>
        </div>
        <Button onClick={handleSalvarPlanejamento} disabled={isSaving}>
          {isSaving ? (
            <>Salvando...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue={diaAtual} onValueChange={setDiaAtual}>
        <TabsList className="grid grid-cols-7 mb-4">
          {diasState.map((dia, index) => (
            <TabsTrigger
              key={index}
              value={format(dia.data, 'yyyy-MM-dd')}
              className="flex flex-col"
            >
              <span>{format(dia.data, 'EEE', { locale: ptBR })}</span>
              <span className="text-xs">{format(dia.data, 'dd/MM')}</span>
              {dia.produtos.length > 0 && (
                <Badge variant="secondary" className="mt-1">
                  {dia.produtos.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          diasState.map((dia, diaIndex) => (
            <TabsContent
              key={diaIndex}
              value={format(dia.data, 'yyyy-MM-dd')}
              className="space-y-4"
            >
              <DiaPlanejamentoComponent 
                dia={dia}
                diaIndex={diaIndex}
                produtos={produtosEstoque}
                carregandoProdutos={carregandoProdutos}
                handleAddProduto={handleAddProduto}
                handleRemoveProduto={handleRemoveProduto}
                handleStatusChange={handleStatusChange}
              />
            </TabsContent>
          ))
        )}
      </Tabs>
    </div>
  );
};

export default PlanejamentoProducao;