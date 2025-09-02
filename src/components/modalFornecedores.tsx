import { useEffect, useState } from "react";
import { db } from "@/firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  quantidade_minima: number;
  unidade_de_medida: string;
  valor_unitario: number;
  data_vencimento: string;
  fornecedor_nome: string;
  imagem: string;
}

interface ModalFornecedorProps {
  fornecedor: {
    razaoSocial: string;
    cnpj: string;
    endereco: {
      rua: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
    telefone: string;
    email: string;
    pessoaContato: string;
    condicoesPagamento: string;
    prazoEntrega: string;
  };
  onClose: () => void;
}

const ModalFornecedor = ({ fornecedor, onClose }: ModalFornecedorProps) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [produtosProximoVencimento, setProdutosProximoVencimento] = useState<Produto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const q = query(
          collection(db, "produtos"),
          where("fornecedor_nome", "==", fornecedor.razaoSocial)
        );
        
        const querySnapshot = await getDocs(q);
        const produtosData: Produto[] = [];
        const vencimentoProximo: Produto[] = [];
        
        querySnapshot.forEach((doc) => {
          const produto = { id: doc.id, ...doc.data() } as Produto;
          produtosData.push(produto);
          
          // Verificar se a data de vencimento está próxima (menos de 20 dias)
          if (produto.data_vencimento) {
            const dataVencimento = new Date(produto.data_vencimento);
            const hoje = new Date();
            const diffTime = dataVencimento.getTime() - hoje.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 20 && diffDays >= 0) {
              vencimentoProximo.push(produto);
            }
          }
        });
        
        setProdutos(produtosData);
        setProdutosProximoVencimento(vencimentoProximo);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProdutos();
  }, [fornecedor.razaoSocial]);

  const handlePedidosClick = () => {
    navigate("/pedidos");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Não informado";
    try {
      return format(new Date(dateString), "PP", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{fornecedor.razaoSocial}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">CNPJ: {fornecedor.cnpj}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div>
              <h3 className="font-medium mb-3">Informações do Fornecedor</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Endereço:</span> {`${fornecedor.endereco.rua}, ${fornecedor.endereco.numero} - ${fornecedor.endereco.bairro}, ${fornecedor.endereco.cidade}/${fornecedor.endereco.estado}`}</p>
                <p><span className="font-medium">CEP:</span> {fornecedor.endereco.cep}</p>
                <p><span className="font-medium">Complemento:</span> {fornecedor.endereco.complemento || "Não informado"}</p>
                <p><span className="font-medium">Telefone:</span> {fornecedor.telefone}</p>
                <p><span className="font-medium">Email:</span> {fornecedor.email}</p>
                <p><span className="font-medium">Pessoa de Contato:</span> {fornecedor.pessoaContato}</p>
                <p><span className="font-medium">Cond. Pagamento:</span> {fornecedor.condicoesPagamento}</p>
                <p><span className="font-medium">Prazo Entrega:</span> {fornecedor.prazoEntrega} dias</p>
              </div>
            </div>
            
            {produtosProximoVencimento.length > 0 && (
              <div>
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription className="flex justify-between items-center">
                    <span>{produtosProximoVencimento.length} produto(s) próximo(s) do vencimento</span>
                    <Button variant="outline" size="sm" onClick={handlePedidosClick} className="ml-2">
                      <Truck className="h-4 w-4 mr-2" />
                      Fazer Pedido
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
          
          <div className="border-t p-6">
            <h3 className="font-medium mb-4">Produtos Fornecidos</h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : produtos.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => {
                      const dataVencimento = produto.data_vencimento ? new Date(produto.data_vencimento) : null;
                      const hoje = new Date();
                      let status = "normal";
                      let statusText = "OK";
                      
                      if (dataVencimento) {
                        const diffTime = dataVencimento.getTime() - hoje.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0) {
                          status = "vencido";
                          statusText = "Vencido";
                        } else if (diffDays < 20) {
                          status = "alerta";
                          statusText = `Vence em ${diffDays} dias`;
                        }
                      }
                      
                      if (produto.quantidade <= produto.quantidade_minima) {
                        status = "alerta";
                        statusText = "Estoque baixo";
                      }
                      
                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>
                            {produto.quantidade} {produto.unidade_de_medida}
                            {produto.quantidade <= produto.quantidade_minima && (
                              <span className="text-xs text-red-500 ml-1">(mín: {produto.quantidade_minima})</span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(produto.valor_unitario)}</TableCell>
                          <TableCell>{formatDate(produto.data_vencimento)}</TableCell>
                          <TableCell>
                            <Badge variant={status === "vencido" ? "destructive" : status === "alerta" ? "destructive" : "default"}>
                              {statusText}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum produto encontrado para este fornecedor.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModalFornecedor;