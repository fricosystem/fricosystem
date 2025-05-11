import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Edit, Trash2, Info, Calendar, Tag, Package, BarChart, Home, MapPin, User, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdicionarAoCarrinho from "./AdicionarAoCarrinho";
import { useState, useEffect } from "react";
import { db } from "@/firebase/firebase"; // Certifique-se de importar a referência ao seu Firestore
import { doc, getDoc } from "firebase/firestore"; // Importe as funções necessárias

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
  fornecedor?: string;
  unidade_de_medida?: string;
  
  // Campos adicionais para compatibilidade com o componente Produtos
  codigo?: string;
  codigoEstoque?: string;
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  dataVencimento?: string | { seconds: number; nanoseconds: number };
  dataHora?: string | { seconds: number; nanoseconds: number };
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
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
  const [unidadeMedida, setUnidadeMedida] = useState<string>("");
  const { user } = useAuth();

  // Buscar unidade_de_medida diretamente do Firestore se não estiver no objeto
  useEffect(() => {
    
    // Se o produto tem um ID mas não tem unidade_de_medida, buscamos do Firestore
    const fetchUnidadeMedida = async () => {
      if (produto.id && !produto.unidade_de_medida) {
        try {
          // Usamos a coleção 'produtos' - ajuste conforme necessário
          const docRef = doc(db, "produtos", produto.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.unidade_de_medida) {
              setUnidadeMedida(data.unidade_de_medida);
            } else {
              // Tentar extrair da string do nome se contiver KG, UN, etc.
              const medidaNoNome = extrairUnidadeMedidaDoNome(produto.nome);
              if (medidaNoNome) {
                setUnidadeMedida(medidaNoNome);
              }
            }
          }
        } catch (error) {
          console.error("Erro ao buscar unidade de medida:", error);
        }
      }
    };
    
    fetchUnidadeMedida();
  }, [produto]);

  // Função para extrair unidade de medida do nome se estiver presente
  const extrairUnidadeMedidaDoNome = (nome: string): string => {
    const unidadesPossiveis = ["KG", "GR", "UN", "LT", "ML", "CX", "PCT", "TN"];
    const nomeUpper = nome.toUpperCase();
    
    for (const unidade of unidadesPossiveis) {
      if (nomeUpper.includes(` ${unidade}`) || nomeUpper.endsWith(` ${unidade}`)) {
        return unidade;
      }
    }
    
    return "";
  };

  // Compatibilidade com os diferentes formatos de dados
  const quantidade = produto.quantidadeAtual !== undefined ? produto.quantidadeAtual : produto.quantidade || 0;
  const quantidadeMinima = produto.quantidadeMinima !== undefined ? produto.quantidadeMinima : produto.quantidade_minima || 0;
  const codigo = produto.codigo || produto.codigo_material || "";
  const codigoEstoque = produto.codigoEstoque || produto.codigo_estoque || "";
  const valorUnitario = produto.valorUnitario !== undefined ? produto.valorUnitario : produto.valor_unitario || 0;
  const unidade = produto.unidade || ""; // Unidade da empresa (FR01, FR02, etc)
  
  // Usar o valor do estado ou o valor do produto se disponível
  const unidade_de_medida = produto.unidade_de_medida || unidadeMedida || extrairUnidadeMedidaDoNome(produto.nome);
  
  const fornecedorNome = produto.fornecedor_nome || produto.fornecedor || "";
  const fornecedorCnpj = produto.fornecedor_cnpj || "";
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

  // Função para exibir a quantidade com a unidade adequada
  const formatQuantidade = (qtd: number, un: string): string => {
    if (!un) return `${qtd}`;
    return `${qtd} ${un}`;
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
        {/* Aumentando a altura da imagem de h-40 para h-56 */}
        <div className="relative h-56 bg-muted">
          <img
            src={produto.imagem || "/placeholder.svg"}
            alt={produto.nome}
            className="h-full w-full object-contain"
          />
          {/* Movido o botão de informações para o canto superior direito */}
          <div className="absolute top-2 right-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/10 hover:bg-black/20 dark:bg-black/20"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Seção da imagem */}
                  <div className="relative w-full md:w-2/5 bg-muted">
                    <img
                      src={produto.imagem || "/placeholder.svg"}
                      alt={produto.nome}
                      className="h-full w-full object-contain p-4"
                    />
                    {isLowStock && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="destructive" className="text-sm font-medium">
                          Estoque Baixo
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Seção de detalhes */}
                  <div className="flex-1 p-6 overflow-y-auto max-h-[80vh]">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-xl font-bold tracking-tight">
                        {produto.nome}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Detalhes completos do produto
                      </DialogDescription>
                    </DialogHeader>

                    {/* Principais informações destacadas */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className={`flex items-center gap-2 p-3 rounded-md ${isLowStock ? "bg-destructive/10" : "bg-muted"}`}>
                        <BarChart className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Estoque Atual</p>
                          <p className={`text-lg font-bold ${isLowStock ? "text-destructive" : ""}`}>
                            {formatQuantidade(quantidade, unidade_de_medida)}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 p-3 rounded-md ${isLowStock ? "bg-destructive/10" : "bg-muted"}`}>
                        <DollarSign className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Unitário</p>
                          <p className="text-lg font-medium">{formatCurrency(valorUnitario)}</p>
                        </div>
                      </div>
                    </div>
                    {/* Informações detalhadas em seções */}
                    <div className="space-y-6">
                      {/* Seção Identificação */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-primary border-b pb-1">Identificação</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Código Material</p>
                              <p className="text-sm text-muted-foreground">{codigo || "Não informado"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Código Estoque</p>
                              <p className="text-sm text-muted-foreground">{codigoEstoque || "Não informado"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Unidade de Medida</p>
                              <p className="text-sm text-muted-foreground">{unidade_de_medida || "Não informado"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Unidade</p>
                              <p className="text-sm text-muted-foreground">{unidade || "Não informado"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Seção Estoque */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-primary border-b pb-1">Informações de Estoque</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <BarChart className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Quantidade Mínima</p>
                              <p className="text-sm text-muted-foreground">{formatQuantidade(quantidadeMinima, unidade_de_medida)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Depósito</p>
                              <p className="text-sm text-muted-foreground">{produto.deposito || "Não informado"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Prateleira</p>
                              <p className="text-sm text-muted-foreground">{produto.prateleira || "Não informado"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Fornecedor</p>
                            <p className="text-sm text-muted-foreground">{fornecedorNome || "Não informado"}</p>
                            {fornecedorCnpj && (
                              <p className="text-xs text-muted-foreground">CNPJ: {fornecedorCnpj}</p>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                      
                      {/* Seção Datas */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-primary border-b pb-1">Informações de Datas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Data de Vencimento</p>
                              <p className="text-sm text-muted-foreground">{formatDate(dataVencimento)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Data de Cadastro</p>
                              <p className="text-sm text-muted-foreground">{formatDate(dataCriacao)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detalhes do produto, se disponíveis */}
                      {produto.detalhes && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-primary border-b pb-1">Descrição Detalhada</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">{produto.detalhes}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Ações na parte inferior */}
                    <div className="mt-8 pt-4 border-t flex flex-wrap gap-2 justify-end">
                      <AdicionarAoCarrinho 
                        produto={produto} 
                        onSuccess={handleCartSuccess}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center"
                        onClick={() => produto.id && onEdit(produto.id)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center text-destructive hover:bg-destructive/10"
                        onClick={() => produto.id && onDelete(produto.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Badge de estoque baixo movido para a parte inferior direita da imagem */}
          {isLowStock && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="destructive">Estoque Baixo</Badge>
            </div>
          )}
        </div>
        <CardContent className="pt-4 flex-grow">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">{produto.nome}</h3>

          {/* Informações básicas sempre visíveis - modificado para mostrar quantidade com unidade de medida */}
          <div className="space-y-2 text-sm mb-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cód. Material:</span>
              <span className="font-medium">{codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Qtd:</span>
              <span className={isLowStock ? "text-destructive font-semibold" : "font-medium"}>
                {formatQuantidade(quantidade, unidade_de_medida)}
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