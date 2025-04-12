
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Produto {
  id: string;
  nome: string;
  imagem: string;
  quantidadeAtual: number; // Quantidade atual no carrinho
  codigoMaterial: string; // Adicionado campo para Código Material
  codigoEstoque: string; // Adicionado campo para Código Estoque
  unidade: string; // Adicionado campo para Unidade
  deposito: string; // Adicionado campo para Depósito
  quantidadeMinima: number; // Adicionado campo para Quantidade Mínima
  detalhes: string; // Adicionado campo para Detalhes
  unidadeMedida: string; // Adicionado campo para Unidade de Medida
  valorUnitario: number; // Adicionado campo para Valor Unitário
}

const Carrinho = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [carrinho, setCarrinho] = useState<Produto[]>(location.state?.carrinho || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Função para remover um produto do carrinho
  const handleRemover = (id: string) => {
    setCarrinho((prevCarrinho) => prevCarrinho.filter((item) => item.id !== id));
    toast({
      title: "Item removido",
      description: "O item foi removido do carrinho",
    });
  };

  // Função para atualizar a quantidade de um produto
  const handleQuantidadeChange = (id: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    setCarrinho((prevCarrinho) =>
      prevCarrinho.map((produto) =>
        produto.id === id ? { ...produto, quantidadeAtual: novaQuantidade } : produto
      )
    );
  };

  // Função para aumentar a quantidade
  const handleIncrease = (id: string) => {
    setCarrinho((prevCarrinho) =>
      prevCarrinho.map((produto) =>
        produto.id === id ? { ...produto, quantidadeAtual: produto.quantidadeAtual + 1 } : produto
      )
    );
  };

  // Função para diminuir a quantidade
  const handleDecrease = (id: string) => {
    setCarrinho((prevCarrinho) =>
      prevCarrinho.map((produto) =>
        produto.id === id && produto.quantidadeAtual > 1
          ? { ...produto, quantidadeAtual: produto.quantidadeAtual - 1 }
          : produto
      )
    );
  };

  // Função para enviar os itens do carrinho para o Google Forms
  const handleSubmitToGoogleForms = async () => {
    if (carrinho.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Seu carrinho está vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Obter nome do usuário logado
      const userName = user?.user_metadata?.nome || "Usuário não identificado";
      
      // Construir os dados para envio
      const formData = carrinho.map((produto) => ({
        aa: produto.codigoMaterial,
        bb: produto.codigoEstoque,
        cc: produto.nome,
        dd: produto.unidade,
        ee: produto.deposito,
        ff: produto.quantidadeAtual.toString(),
        gg: produto.quantidadeMinima.toString(),
        hh: produto.detalhes,
        ii: produto.imagem,
        jj: produto.unidadeMedida,
        kk: produto.valorUnitario.toString(),
        ll: userName,
      }));

      // Enviar cada item do carrinho como uma entrada separada
      for (const data of formData) {
        // Usando iframe oculto para contornar limitações de CORS com Google Forms
        const formUrl = new URL("https://docs.google.com/forms/d/e/1FAIpQLSfh_WWxIroAYEEEtnecpwWxk-SzZAQ6vTM99z8bvN1f3vlXmQ/formResponse");
        
        formUrl.searchParams.append("entry.950738290", data.aa); // Código Material
        formUrl.searchParams.append("entry.1093321090", data.bb); // Código Estoque
        formUrl.searchParams.append("entry.289277253", data.cc); // Nome
        formUrl.searchParams.append("entry.1094520217", data.dd); // Unidade
        formUrl.searchParams.append("entry.338874101", data.ee); // Depósito
        formUrl.searchParams.append("entry.668169828", data.ff); // Quantidade
        formUrl.searchParams.append("entry.1153735670", data.gg); // Quantidade Mínima
        formUrl.searchParams.append("entry.150763117", data.hh); // Detalhes
        formUrl.searchParams.append("entry.251730834", data.ii); // Imagem
        formUrl.searchParams.append("entry.1457202272", data.jj); // Unidade de Medida
        formUrl.searchParams.append("entry.917646528", data.kk); // Valor Unitário
        formUrl.searchParams.append("entry.123456789", data.ll); // Usuário logado
        
        // Criar iframe temporário
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = formUrl.toString();
        
        // Esperar um pouco para garantir que a solicitação seja enviada
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Limpar iframe
        document.body.removeChild(iframe);
      }

      toast({
        title: "Sucesso!",
        description: "Itens enviados com sucesso!",
      });
      
      setCarrinho([]); // Limpar o carrinho após o envio
      
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar os itens. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular o valor total do carrinho
  const valorTotal = carrinho.reduce(
    (total, produto) => total + produto.valorUnitario * produto.quantidadeAtual,
    0
  );

  // Formatar valor para o padrão brasileiro (R$ 0.000,00)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <AppLayout title="Carrinho de Compras">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingCart className="text-primary" />
          <h1 className="text-2xl font-bold">Carrinho de Compras</h1>
        </div>

        {carrinho.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">Seu carrinho está vazio</p>
            <Button className="mt-4" onClick={() => navigate("/produtos")}>
              Ver produtos
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[1fr,3fr,1fr,1fr,1fr] gap-4 p-4 font-medium border-b">
                <div>Imagem</div>
                <div>Produto</div>
                <div className="text-center">Quantidade</div>
                <div className="text-right">Preço Unit.</div>
                <div className="text-right">Subtotal</div>
              </div>

              {/* Itens do carrinho */}
              {carrinho.map((produto) => (
                <div key={produto.id} className="grid grid-cols-[1fr,3fr,1fr,1fr,1fr] gap-4 p-4 items-center border-b">
                  <div>
                    <img
                      src={produto.imagem || "/placeholder.svg"}
                      alt={produto.nome}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{produto.nome}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Código: {produto.codigoMaterial} | Depósito: {produto.deposito}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/20"
                      onClick={() => handleRemover(produto.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center border rounded-md">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 rounded-none"
                        onClick={() => handleDecrease(produto.id)}
                        disabled={produto.quantidadeAtual <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <input
                        type="number"
                        min="1"
                        value={produto.quantidadeAtual}
                        onChange={(e) => handleQuantidadeChange(produto.id, parseInt(e.target.value, 10) || 1)}
                        className="w-10 text-center border-none focus:ring-0 bg-transparent"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 rounded-none"
                        onClick={() => handleIncrease(produto.id)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    {formatCurrency(produto.valorUnitario)}
                  </div>
                  <div className="text-right font-medium">
                    {formatCurrency(produto.valorUnitario * produto.quantidadeAtual)}
                  </div>
                </div>
              ))}

              {/* Rodapé do carrinho com total */}
              <div className="p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(valorTotal)}</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => navigate("/produtos")}>
                Continuar Comprando
              </Button>
              <Button 
                onClick={handleSubmitToGoogleForms}
                disabled={isSubmitting || carrinho.length === 0}
              >
                {isSubmitting ? "Enviando..." : "Finalizar Pedido"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrinho;
