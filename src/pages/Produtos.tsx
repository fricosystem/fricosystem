
import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { useProdutos } from "@/hooks/useProdutos";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  }).format(value);
};

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { produtos, loading: isLoading, refreshProdutos } = useProdutos();
  const { adicionarAoCarrinho } = useCarrinho();
  const { toast } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<any[]>([]);

  useEffect(() => {
    if (produtos) {
      const produtosComBaixoEstoque = produtos.filter(
        (produto) => produto.quantidadeAtual <= produto.quantidadeMinima
      );
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    }
  }, [produtos]);

  const handleAdicionarAoCarrinho = (produto: any) => {
    // Ensure the product has all required fields for ProdutoSheets type
    const produtoCompleto = {
      ...produto,
      codigoEstoque: produto.codigoEstoque || `EST-${produto.id}`,
      unidade: produto.unidade || 'UN',
      detalhes: produto.detalhes || '',
      dataHora: produto.dataHora || new Date().toISOString(),
    };
    
    adicionarAoCarrinho(produtoCompleto);
    toast({
      title: "Produto adicionado!",
      description: `O produto ${produto.nome} foi adicionado ao carrinho.`,
    });
  };

  const produtosFiltrados = produtos
    ? produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <AppLayout title="Produtos">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Lista de Produtos</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Adicionar Produto
        </Button>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <SearchIcon className="h-5 w-5 text-gray-500" />
      </div>

      {produtosEmBaixoEstoque.length > 0 && (
        <AlertaBaixoEstoque produtos={produtosEmBaixoEstoque} />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="h-48 bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Verifique sua busca ou adicione novos produtos."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => {
            // Ensure all required properties exist to satisfy ProdutoSheets type
            const produtoCompleto = {
              ...produto,
              codigoEstoque: produto.codigoEstoque || `EST-${produto.id}`,
              unidade: produto.unidade || 'UN',
              detalhes: produto.detalhes || '',
              dataHora: produto.dataHora || new Date().toISOString(),
            };
            
            return (
              <ProdutoCard
                key={produto.id}
                produto={produtoCompleto}
                onEdit={() => {}} 
                onDelete={() => {}}
                onAddToCart={() => handleAdicionarAoCarrinho(produto)}
              />
            );
          })}
        </div>
      )}

      <AddProdutoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={refreshProdutos}
      />
    </AppLayout>
  );
};

export default Produtos;
