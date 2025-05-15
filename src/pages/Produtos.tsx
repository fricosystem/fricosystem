import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, RefreshCw, ArrowUpDown } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProdutoCard from "@/components/ProdutoCard";
import AddProdutoModal from "@/components/AddProdutoModal";
import AlertaBaixoEstoque from "@/components/AlertaBaixoEstoque";
import { useCarrinho } from "@/hooks/useCarrinho";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Interface para o produto
interface Produto {
  id: string;
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  unidade_de_medida: string;
  deposito: string;
  quantidadeAtual: number;
  quantidadeMinima: number;
  detalhes: string;
  imagem: string;
  valorUnitario: number;
  prateleira: string;
  dataVencimento: string;
  dataHora: string;
  fornecedor: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
}

const Produtos = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adicionarAoCarrinho } = useCarrinho();
  const { toast } = useToast();
  const [produtosEmBaixoEstoque, setProdutosEmBaixoEstoque] = useState<Produto[]>([]);
  const [sortOption, setSortOption] = useState<string>("codigoEstoque-asc");

  const fetchProdutos = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, "produtos"));
      
      if (querySnapshot.empty) {
        toast({
          title: "Aviso",
          description: "Nenhum produto encontrado no banco de dados.",
        });
        setProdutos([]);
      } else {
        const produtosData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            codigo: data.codigo_material || "",
            codigoEstoque: data.codigo_estoque || "",
            nome: data.nome || "",
            unidade: data.unidade || "UN",
            unidade_de_medida: data.unidade_de_medida || "",
            deposito: data.deposito || "",
            quantidadeAtual: data.quantidade || 0,
            quantidadeMinima: data.quantidade_minima || 0,
            detalhes: data.detalhes || "",
            imagem: data.imagem || "/placeholder.svg",
            valorUnitario: data.valor_unitario || 0,
            prateleira: data.prateleira || "",
            dataVencimento: data.data_vencimento || "",
            dataHora: data.data_criacao || new Date().toISOString(),
            fornecedor: data.fornecedor || "",
            fornecedor_nome: data.fornecedor_nome || "",
            fornecedor_cnpj: data.fornecedor_cnpj || ""
          };
        }) as Produto[];
        
        setProdutos(produtosData);
        
        toast({
          title: "Dados carregados",
          description: `${produtosData.length} produtos foram carregados com sucesso.`,
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      
      const errorMessage = error.message || "Erro ao carregar dados do Firebase";
      setError(errorMessage);
      
      toast({
        title: "Erro ao carregar dados",
        description: `Não foi possível carregar os produtos: ${errorMessage}`,
        variant: "destructive",
        duration: 5000,
      });
      
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  useEffect(() => {
    if (produtos && produtos.length > 0) {
      const produtosComBaixoEstoque = produtos.filter(
        (produto) => produto.quantidadeAtual <= produto.quantidadeMinima
      );
      setProdutosEmBaixoEstoque(produtosComBaixoEstoque);
    } else {
      setProdutosEmBaixoEstoque([]);
    }
  }, [produtos]);

  const handleAdicionarAoCarrinho = (produto: Produto) => {
    const produtoCompleto = {
      ...produto,
      codigoEstoque: produto.codigoEstoque || `EST-${produto.id}`,
      unidade: produto.unidade || "UN",
      detalhes: produto.detalhes || "",
      dataHora: produto.dataHora || new Date().toISOString(),
      imagem: produto.imagem || "/placeholder.svg",
      unidade_de_medida: produto.unidade_de_medida || "",
      fornecedor_nome: produto.fornecedor_nome || "",
      fornecedor_cnpj: produto.fornecedor_cnpj || "",
    };

    adicionarAoCarrinho(produtoCompleto);
    toast({
      title: "Produto adicionado!",
      description: `O produto ${produto.nome} foi adicionado ao carrinho.`,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await deleteDoc(doc(db, "produtos", id));
        toast({
          title: "Produto excluído",
          description: "O produto foi removido com sucesso",
        });
        setProdutos(produtos.filter(produto => produto.id !== id));
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o produto",
          variant: "destructive",
        });
      }
    }
  };

  const safeToLowerCase = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value).toLowerCase();
  };

  const sortProdutos = (produtos: Produto[]): Produto[] => {
    const [field, order] = sortOption.split('-');
    
    return [...produtos].sort((a, b) => {
      // Tratamento para campos que podem ser undefined
      const valueA = a[field as keyof Produto] || '';
      const valueB = b[field as keyof Produto] || '';
      
      // Ordenação especial para datas
      if (field === 'dataVencimento') {
        const dateA = new Date(valueA as string).getTime();
        const dateB = new Date(valueB as string).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Ordenação numérica para valores
      if (field === 'valorUnitario') {
        return order === 'asc' 
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      }
      
      // Ordenação padrão para strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    });
  };

  const produtosFiltrados = produtos
    ? sortProdutos(produtos.filter((produto) => {
        const termoBusca = searchTerm.toLowerCase();
        return (
          safeToLowerCase(produto.nome).includes(termoBusca) ||
          safeToLowerCase(produto.codigo).includes(termoBusca) ||
          safeToLowerCase(produto.codigoEstoque).includes(termoBusca) ||
          safeToLowerCase(produto.fornecedor_nome).includes(termoBusca) ||
          safeToLowerCase(produto.fornecedor_cnpj).includes(termoBusca) ||
          safeToLowerCase(produto.detalhes).includes(termoBusca)
        );
      }))
    : [];

  return (
    <AppLayout title="Produtos">
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Buscar produto por nome, código ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <SearchIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        
        <div className="w-full md:w-64">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Ordenar por" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="codigoEstoque-asc">Código Estoque (A-Z)</SelectItem>
              <SelectItem value="codigoEstoque-desc">Código Estoque (Z-A)</SelectItem>
              <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="nome-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="valorUnitario-desc">Maior Valor</SelectItem>
              <SelectItem value="valorUnitario-asc">Menor Valor</SelectItem>
              <SelectItem value="dataVencimento-asc">Vencimento (Próximos)</SelectItem>
              <SelectItem value="dataVencimento-desc">Vencimento (Distantes)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="ml-2"
            onClick={fetchProdutos}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Adicionar Produto
        </Button>
      </div>
  
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-4 rounded-md">
          <h3 className="font-medium">Erro ao carregar dados</h3>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">
            Verifique se a coleção existe no Firebase e se as permissões estão corretas.
          </p>
        </div>
      )}
  
      {produtosEmBaixoEstoque.length > 0 && (
        <div className="mb-8">
          <AlertaBaixoEstoque produtos={produtosEmBaixoEstoque} />
        </div>
      )}
  
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(8)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-56 bg-muted">
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
          description={
            searchTerm
              ? "Nenhum produto corresponde à sua busca."
              : error
              ? "Ocorreu um erro ao carregar os dados. Tente novamente."
              : "Adicione novos produtos para começar."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto) => (
            <ProdutoCard
              key={produto.id}
              produto={produto}
              onEdit={() => {}}
              onDelete={() => handleDelete(produto.id)}
              onAddToCart={() => handleAdicionarAoCarrinho(produto)}
            />
          ))}
        </div>
      )}
  
      <AddProdutoModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchProdutos}
      />
    </AppLayout>
  );
};

export default Produtos;