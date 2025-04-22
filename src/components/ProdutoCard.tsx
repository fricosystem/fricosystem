import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Trash2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdicionarAoCarrinho from "./AdicionarAoCarrinho";
import { useState } from "react";

// Interface para os produtos do Firebase - compatível com ambos os componentes
export interface Produto {
  id?: string;
  // Campos originais do Firebase
  codigo_material?: string; 
  codigo_estoque?: string;
  nome: string;
  unidade?: string;
  deposito?: string;
  quantidade?: number;
  quantidade_minima?: number;
  detalhes?: string;
  imagem?: string;
  valor_unitario?: number;
  prateleira?: string;
  data_vencimento?: string | { seconds: number; nanoseconds: number };
  data_criacao?: string | { seconds: number; nanoseconds: number };
  fornecedor_atual?: string;
  unidade_de_medida?: string;
  
  // Campos adicionais para compatibilidade com o componente Produtos
  codigo?: string;
  codigoEstoque?: string;
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  dataVencimento?: string | { seconds: number; nanoseconds: number };
  dataHora?: string | { seconds: number; nanoseconds: number };
  fornecedor?: string;
  valorUnitario?: number;
}

interface ProdutoCardProps {
  produto: Produto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddToCart?: (produto: Produto) => void;
}

const ProdutoCard = ({ 
  produto, 
  onEdit, 
  onDelete, 
  onAddToCart 
}: ProdutoCardProps) => {
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const { user } = useAuth();

  // Compatibilidade com os diferentes formatos de dados
  const quantidade = produto.quantidadeAtual !== undefined ? produto.quantidadeAtual : produto.quantidade || 0;
  const quantidadeMinima = produto.quantidadeMinima !== undefined ? produto.quantidadeMinima : produto.quantidade_minima || 0;
  const codigo = produto.codigo || produto.codigo_material || "";
  const codigoEstoque = produto.codigoEstoque || produto.codigo_estoque || "";
  const valorUnitario = produto.valorUnitario !== undefined ? produto.valorUnitario : produto.valor_unitario || 0;
  const unidade = produto.unidade || produto.unidade_de_medida || "";
  const fornecedor = produto.fornecedor || produto.fornecedor_atual || "";
  const dataVencimento = produto.dataVencimento || produto.data_vencimento;
  const dataCriacao = produto.dataHora || produto.data_criacao;
  
  const isLowStock = quantidade <= quantidadeMinima;

  // Formatar valor para o padrão brasileiro (R$ 0.000,00)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Formatar data para o padrão brasileiro (DD/MM/AAAA)
  const formatDate = (dateValue?: string | { seconds: number; nanoseconds: number }): string => {
    if (!dateValue) return "Não informado";
    
    try {
      // Verifica se é um objeto Timestamp do Firestore
      if (typeof dateValue === 'object' && 'seconds' in dateValue) {
        // Converte timestamp para milissegundos
        const milliseconds = dateValue.seconds * 1000;
        const date = new Date(milliseconds);
        return new Intl.DateTimeFormat("pt-BR").format(date);
      } 
      // Se for uma string de data
      else if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        return new Intl.DateTimeFormat("pt-BR").format(date);
      }
      
      return "Não informado";
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Não informado";
    }
  };

  // Handler para quando o item é adicionado ao carrinho com sucesso
  const handleCartSuccess = () => {
    if (onAddToCart) {
      onAddToCart(produto);
    }
  };

  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative h-40 bg-muted">
          <img
            src={produto.imagem || "/placeholder.svg"}
            alt={produto.nome}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {isLowStock && (
              <Badge variant="destructive">Estoque Baixo</Badge>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-10 w-10 rounded-full dbg-black/90 hover:bg-black/90 dark:bg-black/20"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Detalhes do Produto</DialogTitle>
                </DialogHeader>
                {produto && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Nome</h4>
                      <p>{produto.nome}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Código Material</h4>
                      <p>{codigo || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Código Estoque</h4>
                      <p>{codigoEstoque || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Quantidade</h4>
                      <p className={isLowStock ? "text-destructive font-semibold" : ""}>
                        {quantidade} {unidade}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Quantidade Mínima</h4>
                      <p>{quantidadeMinima} {unidade}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Valor Unitário</h4>
                      <p>{formatCurrency(valorUnitario)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Unidade</h4>
                      <p>{unidade || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Depósito</h4>
                      <p>{produto.deposito || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Prateleira</h4>
                      <p>{produto.prateleira || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Fornecedor</h4>
                      <p>{fornecedor || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Data Vencimento</h4>
                      <p>{formatDate(dataVencimento)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500">Data Cadastro</h4>
                      <p>{formatDate(dataCriacao)}</p>
                    </div>
                    
                    {produto.detalhes && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-sm text-gray-500">Detalhes</h4>
                        <p>{produto.detalhes}</p>
                      </div>
                    )}
                    
                    <div className="md:col-span-2 mt-4">
                      <h4 className="font-semibold text-sm text-gray-500">Ações</h4>
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                          onClick={() => produto.id && onEdit(produto.id)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                          onClick={() => produto.id && onDelete(produto.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardContent className="pt-4 flex-grow">
          <h3 className="font-semibold text-base line-clamp-1 mb-2">{produto.nome}</h3>

          {/* Informações básicas sempre visíveis */}
          <div className="space-y-1 text-sm mb-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cód. Material:</span>
              <span className="font-medium">{codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Qtd:</span>
              <span className={isLowStock ? "text-destructive font-semibold" : "font-medium"}>
                {quantidade} {unidade}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">{formatCurrency(valorUnitario)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t p-2 flex gap-2">
          <AdicionarAoCarrinho 
            produto={produto} 
            onSuccess={handleCartSuccess}
          />
        </CardFooter>
      </Card>
    </>
  );
};

export default ProdutoCard;