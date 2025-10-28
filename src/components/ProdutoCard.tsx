import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Info, Calendar, Package, BarChart } from "lucide-react";
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
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
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
      <div className="relative h-56 bg-muted">
        <img
          src={produto.imagem || "/placeholder.svg"}
          alt={produto.nome}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          style={{ 
            imageRendering: 'crisp-edges'
          }}
        />
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
            <DialogContent className="max-w-4xl w-[95vw] max-h-[95dvh] p-0 overflow-hidden flex flex-col">
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header com título e badge de estoque */}
                <div className="border-b px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold leading-tight pr-8">
                      {produto.nome}
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-1">
                      Detalhes completos do produto
                    </DialogDescription>
                  </DialogHeader>
                  {isLowStock && (
                    <Badge variant="destructive" className="mt-2 text-xs font-medium">
                      Estoque Baixo
                    </Badge>
                  )}
                </div>

                {/* Conteúdo scrollável */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                    {/* Seção da Imagem - Vertical Full */}
                    <div className="relative bg-muted rounded-lg overflow-hidden aspect-[9/16] lg:aspect-[3/4] max-h-[60vh] lg:max-h-none mx-auto w-full max-w-sm lg:max-w-none">
                      <img
                        src={produto.imagem || "/placeholder.svg"}
                        alt={produto.nome}
                        loading="eager"
                        decoding="sync"
                        className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        style={{ 
                          imageRendering: 'crisp-edges'
                        }}
                        onClick={() => setImageModalOpen(true)}
                      />
                    </div>

                    {/* Seção de Detalhes */}
                    <div className="space-y-4">
                      {/* Cards de destaque - Estoque e Valor */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-lg border-2 ${isLowStock ? "bg-destructive/10 border-destructive" : "bg-card border-border"}`}>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estoque Atual</p>
                          <p className={`text-2xl font-bold ${isLowStock ? "text-destructive" : "text-foreground"}`}>
                            {quantidade}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{unidade_de_medida || "UN"}</p>
                        </div>
                        
                        <div className="p-4 rounded-lg border-2 bg-card border-border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Valor Unitário</p>
                          <p className="text-2xl font-bold text-foreground">{formatCurrency(valorUnitario)}</p>
                          <p className="text-xs text-muted-foreground mt-1">por {unidade_de_medida || "unidade"}</p>
                        </div>
                      </div>

                      {/* Identificação */}
                      <div className="bg-card rounded-lg border p-4 space-y-3">
                        <h3 className="font-semibold text-primary text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Identificação
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Cód. Material</p>
                            <p className="font-medium">{codigo || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Cód. Estoque</p>
                            <p className="font-medium">{codigoEstoque || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Unidade de Medida</p>
                            <p className="font-medium">{unidade_de_medida || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">Unidade</p>
                            <p className="font-medium">{unidade || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Informações de Estoque */}
                      <div className="bg-card rounded-lg border p-4 space-y-3">
                        <h3 className="font-semibold text-primary text-base flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Informações de Estoque
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="text-muted-foreground">Quantidade Mínima</span>
                            <span className="font-medium">{formatQuantidade(quantidadeMinima, unidade_de_medida)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="text-muted-foreground">Depósito</span>
                            <span className="font-medium">{produto.deposito || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b last:border-b-0">
                            <span className="text-muted-foreground">Prateleira</span>
                            <span className="font-medium">{produto.prateleira || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-start py-2">
                            <span className="text-muted-foreground">Fornecedor</span>
                            <div className="text-right">
                              <p className="font-medium">{fornecedorNome || "N/A"}</p>
                              {fornecedorCnpj && (
                                <p className="text-xs text-muted-foreground">CNPJ: {fornecedorCnpj}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informações de Datas */}
                      <div className="bg-card rounded-lg border p-4 space-y-3">
                        <h3 className="font-semibold text-primary text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Datas
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Data de Vencimento</span>
                            <span className="font-medium">{formatDate(dataVencimento)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">Data de Cadastro</span>
                            <span className="font-medium">{formatDate(dataCriacao)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Descrição Detalhada */}
                      {produto.detalhes && (
                        <div className="bg-card rounded-lg border p-4 space-y-2">
                          <h3 className="font-semibold text-primary text-base">Descrição Detalhada</h3>
                          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {produto.detalhes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer fixo com botão */}
                <div className="border-t px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex justify-end">
                    <AdicionarAoCarrinho 
                      produto={produto} 
                      onSuccess={handleCartSuccess}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLowStock && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="destructive">Estoque Baixo</Badge>
          </div>
        )}
      </div>
      <CardContent className="pt-4 flex-grow">
        <h3 className="font-semibold text-base line-clamp-2 mb-2">{produto.nome}</h3>
        <div className="space-y-2 text-sm mb-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cód. Fornecedor:</span>
            <span className="font-medium">{codigo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cód. Estoque:</span>
            <span className="font-medium">{codigoEstoque || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantidade:</span>
            <span className={isLowStock ? "text-destructive font-semibold" : "font-medium"}>
              {formatQuantidade(quantidade, unidade_de_medida)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor unitário:</span>
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

    {/* Modal para visualização ampliada da imagem */}
    <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[90dvh] p-2 overflow-hidden bg-black/95 border-none">
        <div className="relative w-full h-[80vh] flex items-center justify-center">
          <img
            src={produto.imagem || "/placeholder.svg"}
            alt={produto.nome}
            loading="eager"
            decoding="sync"
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ 
              imageRendering: 'crisp-edges',
              filter: 'contrast(1.1) saturate(1.1)'
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  </>
);
};

export default ProdutoCard;