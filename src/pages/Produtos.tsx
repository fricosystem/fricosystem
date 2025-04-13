import { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";

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
  const { produtos, isLoading, isError, mutate } = useProdutos();
  const { adicionarProduto } = useCarrinho();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState([]);

  useEffect(() => {
    if (produtos) {
      const produtosComBaixoEstoque = produtos.filter(
        (produto) => produto.estoque <= 5
      );
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    }
  }, [produtos]);

  if (isLoading) {
    return (
      <AppLayout title="Produtos">
        <LoadingIndicator />
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="Produtos">
        <div className="text-red-500">
          Erro ao carregar os produtos. Por favor, tente novamente.
        </div>
      </AppLayout>
    );
  }

  const handleAdicionarAoCarrinho = (produto: any) => {
    adicionarProduto(produto);
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

      {produtosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Verifique sua busca ou adicione novos produtos."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onAdicionarAoCarrinho={() => handleAdicionarAoCarrinho(produto)}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      <AddProdutoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mutate={mutate}
      />
    </AppLayout>
  );
};

export default Produtos;
