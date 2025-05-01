import { useEffect, useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { getProdutos } from "@/pages/Producao/Services/ProdutoService";
import { Produto } from "@/types/typesProducao";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const ProdutosProducao = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarProdutos = async () => {
      setLoading(true);
      
      try {
        const resultado = await getProdutos();
        
        if (resultado.success) {
          setProdutos(resultado.produtos);
        } else {
          toast.error("Erro ao carregar produtos");
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        toast.error("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };
    
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((produto) => {
    if (!filtro) return true;
    
    const termoLower = filtro.toLowerCase();
    return (
      produto.nome.toLowerCase().includes(termoLower) ||
      (produto.codigo_material && produto.codigo_material.toLowerCase().includes(termoLower)) ||
      (produto.codigo_estoque && produto.codigo_estoque.toLowerCase().includes(termoLower))
    );
  });

  const produtosFinais = produtosFiltrados.filter((p) => p.quantidade_minima > 0);
  const ingredientes = produtosFiltrados.filter((p) => p.quantidade_minima === 0);

  const formatarMoeda = (valor: number | undefined) => {
    if (valor === undefined || valor === null) return "N/A";
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderProdutoCard = (produto: Produto) => (
    <Card key={produto.id} className="flex flex-col overflow-hidden">
      {/* Área da imagem no topo */}
      <div className="h-48 w-full bg-gray-100">
        {produto.imagem ? (
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <span className="text-center text-gray-600">Sem imagem</span>
          </div>
        )}
      </div>
      
      {/* Conteúdo do produto abaixo da imagem */}
      <CardContent className="flex flex-col flex-1 p-4">
        <h3 className="text-lg font-medium mb-1">{produto.nome}</h3>
        
        <p className="text-xs text-muted-foreground mb-2">
          Código: {produto.codigo_material || "N/A"} | Estoque: {produto.codigo_estoque || "N/A"}
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-auto">
          <div>
            <span className="font-medium">Estoque atual:</span>{" "}
            <span className={produto.quantidade < (produto.quantidade_minima || 0) ? "text-red-600" : ""}>
              {produto.quantidade} {produto.unidade_de_medida || ""}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Mínimo:</span>{" "}
            <span>{produto.quantidade_minima || 0} {produto.unidade_de_medida || ""}</span>
          </div>
          
          <div className="col-span-2">
            <span className="font-medium">Depósito:</span> {produto.deposito || "N/A"}
          </div>
          
          <div className="col-span-2">
            <span className="font-medium">Fornecedor:</span> {produto.fornecedor_nome || produto.fornecedor || "N/A"}
          </div>

          <div className="col-span-2">
            <span className="font-medium">Vencimento:</span> {produto.data_vencimento || "N/A"}
          </div>
        </div>
        
        <div className="mt-3 text-right">
          <p className="font-semibold text-blue-700">
            Valor: {formatarMoeda(produto.valor_unitario)}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AppLayout title="Produtos">
        <div className="flex h-full items-center justify-center">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Carregando produtos...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Produtos">
      <div className="mb-4">
        <Input
          placeholder="Buscar produto por nome ou código..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">Todos ({produtos.length})</TabsTrigger>
          <TabsTrigger value="finais">Produtos Finais ({produtosFinais.length})</TabsTrigger>
          <TabsTrigger value="ingredientes">Ingredientes ({ingredientes.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produtosFiltrados.map(renderProdutoCard)}
            
            {produtosFiltrados.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Nenhum produto encontrado com esse filtro
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="finais">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {produtosFinais.map(renderProdutoCard)}
            
            {produtosFinais.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Nenhum produto final encontrado com esse filtro
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="ingredientes">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ingredientes.map(renderProdutoCard)}
            
            {ingredientes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Nenhum ingrediente encontrado com esse filtro
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ProdutosProducao;