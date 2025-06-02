import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShoppingCart, Filter, Check, Mail, MessageSquare } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

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
  valor_unitario: number;
  prateleira: string;
  dataVencimento: string;
  dataHora: string;
  fornecedor: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  fornecedor_telefone: string;
  fornecedor_email: string;
  status?: "Pendente" | "Realizado" | "Cancelado";
}

interface Compra {
  id?: string;
  produtoId: string;
  produtoNome: string;
  codigo: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  fornecedorId: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  status: "Pendente" | "Realizado" | "Cancelado";
  criadoPor: string;
  criadoEm: Timestamp;
  compradoPor?: string;
  compradoEm?: Timestamp;
  enviadoPor?: "whatsapp" | "email";
}

const Compras = () => {
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidadeCompra, setQuantidadeCompra] = useState(0);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [enviado, setEnviado] = useState(false);

  const buscarProdutos = async () => {
    try {
      setLoading(true);
      const produtosRef = collection(db, "produtos");
      const q = query(produtosRef, orderBy("nome"));
      const querySnapshot = await getDocs(q);
      
      const produtosData: Produto[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        produtosData.push({
          id: doc.id,
          codigo: data.codigo || data.codigo_material || "",
          codigoEstoque: data.codigoEstoque || data.codigo_estoque || "",
          nome: data.nome || "",
          unidade: data.unidade || "UN",
          unidade_de_medida: data.unidade_de_medida || data.unidade || "UN",
          deposito: data.deposito || "",
          quantidadeAtual: Number(data.quantidadeAtual) || Number(data.quantidade) || 0,
          quantidadeMinima: Number(data.quantidadeMinima) || Number(data.quantidade_minima) || 0,
          detalhes: data.detalhes || "",
          imagem: data.imagem || "",
          valor_unitario: Number(data.valor_unitario) || 0,
          prateleira: data.prateleira || "",
          dataVencimento: data.dataVencimento || "",
          dataHora: data.dataHora || "",
          fornecedor: data.fornecedor || "",
          fornecedor_nome: data.fornecedor_nome || "",
          fornecedor_cnpj: data.fornecedor_cnpj || "",
          fornecedor_telefone: data.fornecedor_telefone || "",
          fornecedor_email: data.fornecedor_email || "",
          status: data.status || "Pendente"
        });
      });
      
      setProdutos(produtosData);
      aplicarFiltros(produtosData);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (produtosData: Produto[]) => {
    let produtosFiltrados = produtosData;

    if (filtroStatus === "critico") {
      produtosFiltrados = produtosFiltrados.filter(
        produto => produto.quantidadeAtual <= produto.quantidadeMinima
      );
    } else if (filtroStatus === "baixo") {
      produtosFiltrados = produtosFiltrados.filter(
        produto => produto.quantidadeAtual > produto.quantidadeMinima && 
                  produto.quantidadeAtual <= produto.quantidadeMinima * 1.5
      );
    } else if (filtroStatus === "todos") {
      produtosFiltrados = produtosFiltrados.filter(
        produto => produto.quantidadeAtual <= produto.quantidadeMinima * 1.5
      );
    }

    setProdutosFiltrados(produtosFiltrados);
  };

  useEffect(() => {
    buscarProdutos();
  }, [filtroStatus]);

  const abrirModalCompra = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setQuantidadeCompra(produto.quantidadeMinima * 2);
    setModalAberto(true);
    setEnviado(false);
  };

  const formatarCNPJ = (cnpj: string) => {
    if (!cnpj) return "";
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const gerarMensagemWhatsApp = (produto: Produto, quantidade: number) => {
    const statusEstoque = getStatusTexto(produto.quantidadeAtual, produto.quantidadeMinima);
    const fornecedorCnpjFormatado = formatarCNPJ(produto.fornecedor_cnpj);
    
    let mensagem = `Olá, ${produto.fornecedor_nome}.\n\n`;
    mensagem += `Gostaríamos de realizar um pedido de ${quantidade} ${produto.unidade_de_medida} do produto ${produto.nome}\n`;
    
    if (statusEstoque === "Crítico") {
      mensagem += `e, se possível, precisamos que a entrega seja realizada com urgência, pois estamos com o estoque quase zerado deste material.\n\n`;
    } else {
      mensagem += `mas fique à vontade para programar a entrega conforme sua disponibilidade e rotina de logística.\n\n`;
    }
    
    mensagem += `Sabemos que você já fornece este produto para nossa empresa e agradecemos imensamente pela parceria e confiança.\n`;
    mensagem += `Caso haja qualquer dúvida ou necessidade de ajuste quanto ao pedido, prazos ou condições, estamos totalmente à disposição para alinhar da melhor forma possível.\n\n`;
    mensagem += `Para receber os pedidos automaticamente, solicitamos que realize seu cadastro em nosso site (https://fricosystem.vercel.app), utilizando o CNPJ ${fornecedorCnpjFormatado}, no menu de cadastro 'Sou Fornecedor'. Assim que houver demanda de compra, os produtos fornecidos por sua empresa serão exibidos na página principal da plataforma, permitindo que sejam enviados para nós.\n\n`;
    mensagem += `Desde já, agradecemos pela atenção e colaboração.\nAbraços!`;
    
    return encodeURIComponent(mensagem);
  };

  const enviarWhatsApp = async () => {
    if (!produtoSelecionado || !user || !userData || quantidadeCompra <= 0) {
      toast({
        title: "Erro",
        description: "Dados incompletos ou quantidade inválida para realizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Registrar a compra no Firebase
      const compra: Compra = {
        produtoId: produtoSelecionado.id,
        produtoNome: produtoSelecionado.nome,
        codigo: produtoSelecionado.codigo,
        quantidade: quantidadeCompra,
        unidade: produtoSelecionado.unidade_de_medida,
        valor_unitario: produtoSelecionado.valor_unitario,
        fornecedorId: produtoSelecionado.fornecedor,
        fornecedorNome: produtoSelecionado.fornecedor_nome,
        fornecedorCnpj: produtoSelecionado.fornecedor_cnpj,
        status: "Pendente",
        criadoPor: userData.nome || user.displayName || user.email || "Usuário desconhecido",
        criadoEm: serverTimestamp() as Timestamp,
        enviadoPor: "whatsapp"
      };

      await addDoc(collection(db, "compras"), compra);
      
      // Abrir WhatsApp com a mensagem
      const mensagem = gerarMensagemWhatsApp(produtoSelecionado, quantidadeCompra);
      const telefone = produtoSelecionado.fornecedor_telefone.replace(/\D/g, '');
      const url = `https://wa.me/${telefone}?text=${mensagem}`;
      window.open(url, '_blank');
      
      toast({
        title: "Pedido enviado",
        description: `O pedido de ${produtoSelecionado.nome} foi enviado por WhatsApp.`,
      });
      
      setEnviado(true);
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido por WhatsApp.",
        variant: "destructive",
      });
    }
  };

  const enviarEmail = async () => {
    if (!produtoSelecionado || !user || !userData || quantidadeCompra <= 0) {
      toast({
        title: "Erro",
        description: "Dados incompletos ou quantidade inválida para realizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Registrar a compra no Firebase
      const compra: Compra = {
        produtoId: produtoSelecionado.id,
        produtoNome: produtoSelecionado.nome,
        codigo: produtoSelecionado.codigo,
        quantidade: quantidadeCompra,
        unidade: produtoSelecionado.unidade_de_medida,
        valor_unitario: produtoSelecionado.valor_unitario,
        fornecedorId: produtoSelecionado.fornecedor,
        fornecedorNome: produtoSelecionado.fornecedor_nome,
        fornecedorCnpj: produtoSelecionado.fornecedor_cnpj,
        status: "Pendente",
        criadoPor: userData.nome || user.displayName || user.email || "Usuário desconhecido",
        criadoEm: serverTimestamp() as Timestamp,
        enviadoPor: "email"
      };

      await addDoc(collection(db, "compras"), compra);
      
      // Abrir cliente de email com a mensagem
      const statusEstoque = getStatusTexto(produtoSelecionado.quantidadeAtual, produtoSelecionado.quantidadeMinima);
      const fornecedorCnpjFormatado = formatarCNPJ(produtoSelecionado.fornecedor_cnpj);
      
      let assunto = `Pedido de ${produtoSelecionado.nome}`;
      let corpo = `Olá, ${produtoSelecionado.fornecedor_nome}.\n\n`;
      corpo += `Gostaríamos de realizar um pedido de ${quantidadeCompra} ${produtoSelecionado.unidade_de_medida} do produto ${produtoSelecionado.nome}\n`;
      
      if (statusEstoque === "Crítico") {
        corpo += `e, se possível, precisamos que a entrega seja realizada com urgência, pois estamos com o estoque quase zerado deste material.\n\n`;
      } else {
        corpo += `mas fique à vontade para programar a entrega conforme sua disponibilidade e rotina de logística.\n\n`;
      }
      
      corpo += `Sabemos que você já fornece este produto para nossa empresa e agradecemos imensamente pela parceria e confiança.\n`;
      corpo += `Caso haja qualquer dúvida ou necessidade de ajuste quanto ao pedido, prazos ou condições, estamos totalmente à disposição para alinhar da melhor forma possível.\n\n`;
      corpo += `Para receber os pedidos automaticamente, solicitamos que realize seu cadastro em nosso site (https://fricosystem.vercel.app), utilizando o CNPJ ${fornecedorCnpjFormatado}, no menu de cadastro 'Sou Fornecedor'. Assim que houver demanda de compra, os produtos fornecidos por sua empresa serão exibidos na página principal da plataforma, permitindo que sejam enviados para nós.\n\n`;
      corpo += `Desde já, agradecemos pela atenção e colaboração.\nAbraços!`;
      
      const mailtoLink = `mailto:${produtoSelecionado.fornecedor_email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
      window.open(mailtoLink);
      
      toast({
        title: "Pedido enviado",
        description: `O pedido de ${produtoSelecionado.nome} foi enviado por e-mail.`,
      });
      
      setEnviado(true);
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido por e-mail.",
        variant: "destructive",
      });
    }
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const getStatusEstoque = (quantidadeAtual: number, quantidadeMinima: number) => {
    if (quantidadeAtual <= quantidadeMinima) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    } else if (quantidadeAtual <= quantidadeMinima * 1.5) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    } else {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  const getStatusTexto = (quantidadeAtual: number, quantidadeMinima: number) => {
    if (quantidadeAtual <= quantidadeMinima) {
      return "Crítico";
    } else if (quantidadeAtual <= quantidadeMinima * 1.5) {
      return "Baixo";
    } else {
      return "Normal";
    }
  };

  const getStatusTooltip = (quantidadeAtual: number, quantidadeMinima: number) => {
    if (quantidadeAtual <= quantidadeMinima) {
      return "Estoque crítico! Necessário compra urgente para evitar falta.";
    } else if (quantidadeAtual <= quantidadeMinima * 1.5) {
      return "Estoque baixo. Recomendado fazer pedido antecipado.";
    } else {
      return "Estoque dentro dos níveis seguros.";
    }
  };

  const atualizarStatusProduto = async (produtoId: string, novoStatus: "Pendente" | "Realizado" | "Cancelado") => {
    try {
      const produtoRef = doc(db, "produtos", produtoId);
      await updateDoc(produtoRef, {
        status: novoStatus,
        atualizadoEm: serverTimestamp()
      });

      setProdutos(prevProdutos => 
        prevProdutos.map(produto => 
          produto.id === produtoId ? { ...produto, status: novoStatus } : produto
        )
      );
      setProdutosFiltrados(prevProdutos => 
        prevProdutos.map(produto => 
          produto.id === produtoId ? { ...produto, status: novoStatus } : produto
        )
      );
      
      toast({
        title: "Status atualizado",
        description: `Status do produto atualizado para ${getStatusLabel(novoStatus)}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do produto.",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case "Pendente": return "Pendente";
      case "Realizado": return "Em rota de entrega";
      case "Cancelado": return "Entregue";
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Pendente": 
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pendente</span>;
      case "Realizado": 
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Em rota</span>;
      case "Cancelado": 
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Entregue</span>;
      default: 
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    }
  };

  const solicitarCompra = () => {
    setModalAberto(false);
    setModalConfirmacaoAberto(true);
  };

  const confirmarCompra = async () => {
    if (!produtoSelecionado || !user || !userData || quantidadeCompra <= 0) {
      toast({
        title: "Erro",
        description: "Dados incompletos ou quantidade inválida para realizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Registrar a compra no Firebase
      const compra: Compra = {
        produtoId: produtoSelecionado.id,
        produtoNome: produtoSelecionado.nome,
        codigo: produtoSelecionado.codigo,
        quantidade: quantidadeCompra,
        unidade: produtoSelecionado.unidade_de_medida,
        valor_unitario: produtoSelecionado.valor_unitario,
        fornecedorId: produtoSelecionado.fornecedor,
        fornecedorNome: produtoSelecionado.fornecedor_nome,
        fornecedorCnpj: produtoSelecionado.fornecedor_cnpj,
        status: "Pendente",
        criadoPor: userData.nome || user.displayName || user.email || "Usuário desconhecido",
        criadoEm: serverTimestamp() as Timestamp
      };

      await addDoc(collection(db, "compras"), compra);
      
      toast({
        title: "Pedido registrado",
        description: `O pedido de ${produtoSelecionado.nome} foi registrado com sucesso.`,
      });
      
      setModalConfirmacaoAberto(false);
      buscarProdutos();
    } catch (error) {
      console.error("Erro ao registrar pedido:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pedido.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Compras - Estoque Mínimo">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <Select 
              value={filtroStatus}
              onValueChange={(value) => setFiltroStatus(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {produtosFiltrados.length} produtos com estoque mínimo
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {produtosFiltrados.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Estoque Atual</TableHead>
                        <TableHead>Estoque Mínimo</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Status Estoque</TableHead>
                        <TableHead>Status Entrega</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosFiltrados.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell>
                            <div className="font-medium">{produto.nome}</div>
                            <div className="text-xs text-muted-foreground">{produto.deposito}</div>
                          </TableCell>
                          <TableCell>{produto.codigo}</TableCell>
                          <TableCell>
                            {produto.quantidadeAtual} {produto.unidade_de_medida}
                          </TableCell>
                          <TableCell>
                            {produto.quantidadeMinima} {produto.unidade_de_medida}
                          </TableCell>
                          <TableCell>{formatarValor(produto.valor_unitario)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{produto.fornecedor_nome}</div>
                              <div className="text-xs text-muted-foreground">{formatarCNPJ(produto.fornecedor_cnpj)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusEstoque(produto.quantidadeAtual, produto.quantidadeMinima)}`}
                              title={getStatusTooltip(produto.quantidadeAtual, produto.quantidadeMinima)}
                            >
                              {getStatusTexto(produto.quantidadeAtual, produto.quantidadeMinima)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(produto.status || "Pendente")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalCompra(produto)}
                              title="Solicitar pedido"
                            >
                              <ShoppingCart className="mr-1 h-4 w-4" /> Solicitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold">Nenhum produto com estoque mínimo</p>
                  <p className="text-muted-foreground mt-2">
                    Todos os produtos estão com estoque acima do mínimo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de confirmação de compra */}
      {modalAberto && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-white">Solicitar pedido</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-300">Produto:</p>
                <p className="text-white">{produtoSelecionado.nome}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300">Fornecedor:</p>
                <p className="text-white">{produtoSelecionado.fornecedor_nome}</p>
                <p className="text-sm text-gray-400">{formatarCNPJ(produtoSelecionado.fornecedor_cnpj)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300">Quantidade mínima:</p>
                <p className="text-white">{produtoSelecionado.quantidadeMinima} {produtoSelecionado.unidade_de_medida}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300">Sugestão (dobro da mínima):</p>
                <p className="text-white">{produtoSelecionado.quantidadeMinima * 2} {produtoSelecionado.unidade_de_medida}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300">Quantidade:</p>
                <input
                  type="number"
                  min="1"
                  value={quantidadeCompra}
                  onChange={(e) => setQuantidadeCompra(Number(e.target.value))}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <p className="font-medium text-gray-300">Unidade:</p>
                <p className="text-white">{produtoSelecionado.unidade_de_medida}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300">Valor calculado:</p>
                <p className="text-white">{formatarValor(produtoSelecionado.valor_unitario * quantidadeCompra)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-300">Status estoque:</p>
                <p className="text-white">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusEstoque(produtoSelecionado.quantidadeAtual, produtoSelecionado.quantidadeMinima)}`}>
                    {getStatusTexto(produtoSelecionado.quantidadeAtual, produtoSelecionado.quantidadeMinima)}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setModalAberto(false)}
                className="text-white border-gray-600 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={solicitarCompra}
                className="bg-primary hover:bg-primary/90"
              >
                Solicitar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de envio */}
      {modalConfirmacaoAberto && produtoSelecionado && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setModalConfirmacaoAberto(false)}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">Confirmar pedido</h3>
            <div className="space-y-4">
              <p className="text-gray-300">Você está prestes a registrar um pedido de:</p>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="font-medium text-white">{produtoSelecionado.nome}</p>
                <p className="text-sm text-gray-300">{quantidadeCompra} {produtoSelecionado.unidade_de_medida}</p>
                <p className="text-sm text-gray-300">Fornecedor: {produtoSelecionado.fornecedor_nome}</p>
                <p className="text-sm text-gray-300">Valor estimado sobre última cotação: {formatarValor(produtoSelecionado.valor_unitario * quantidadeCompra)}</p>
              </div>
              <p className="text-gray-300">Como deseja enviar este pedido?</p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setModalConfirmacaoAberto(false)}
                className="text-white border-gray-600 hover:bg-gray-800 w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  onClick={enviarWhatsApp}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  disabled={!produtoSelecionado.fornecedor_telefone}
                  title={!produtoSelecionado.fornecedor_telefone ? "Fornecedor não tem telefone cadastrado" : ""}
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
                <Button 
                  onClick={enviarEmail}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  disabled={!produtoSelecionado.fornecedor_email}
                  title={!produtoSelecionado.fornecedor_email ? "Fornecedor não tem e-mail cadastrado" : ""}
                >
                  <Mail className="mr-2 h-4 w-4" /> E-mail
                </Button>
                <Button 
                  onClick={confirmarCompra}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                >
                  <Check className="mr-2 h-4 w-4" /> Apenas registrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Compras;