import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy, serverTimestamp, where } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Plus,
  Trash2,
  X,
  ChevronDown,
  Package,
  Loader2,
  Check,
  RefreshCw,
  ArrowLeft,
  ClipboardList,
  FileText,
  Eye,
  Calendar
} from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModalProdutosRequisicao from "@/components/ModalProdutosRequisicao";

interface ItemRequisicao {
  nome: string;
  codigo_material: string;
  codigo_estoque: string;
  quantidade: number;
  valor_unitario: number;
  unidade: string;
  unidade_de_medida: string;
  deposito: string;
  prateleira: string;
  detalhes: string;
  imagem: string;
  centro_de_custo: string;
}

interface Solicitante {
  id: string;
  nome: string;
  cargo: string;
  email: string;
}

interface Usuario {
  id: string;
  email: string;
  nome: string;
}

interface Requisicao {
  id: string;
  requisicao_id: string;
  status: string;
  itens: ItemRequisicao[];
  usuario: Usuario;
  solicitante: Solicitante;
  data_criacao: any;
  valor_total: number;
}

interface ItemDevolucao {
  codigo_material: string;
  codigo_estoque: string;
  nome: string;
  quantidade_original: number;
  quantidade_devolvida: number;
  quantidade_ja_devolvida?: number;
  quantidade_disponivel?: number;
  unidade: string;
  valor_unitario: number;
}

interface Devolucao {
  id?: string;
  requisicao_id: string;
  requisicao_original: string;
  motivo: string;
  observacoes: string;
  data: string;
  itens: ItemDevolucao[];
  usuarioId: string;
  usuarioNome: string;
  usuarioCargo: string;
  dataRegistro: Date;
}

const DevolucaoMateriais = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [requisicaoSelecionada, setRequisicaoSelecionada] = useState<Requisicao | null>(null);
  const [itensDevolucao, setItensDevolucao] = useState<ItemDevolucao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermHistorico, setSearchTermHistorico] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devolucao, setDevolucao] = useState<Omit<Devolucao, 'dataRegistro' | 'usuarioId' | 'usuarioNome' | 'usuarioCargo' | 'requisicao_original' | 'itens'>>({
    requisicao_id: "",
    motivo: "",
    observacoes: "",
    data: new Date().toISOString().split('T')[0],
  });
  const [view, setView] = useState<"lista" | "devolucao" | "historico">("lista");
  const [historicoDevolucoes, setHistoricoDevolucoes] = useState<Devolucao[]>([]);
  const [devolucoesRequisicoes, setDevolucoesRequisicoes] = useState<Record<string, ItemDevolucao[]>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    fetchRequisicoes();
    if (view === "historico") {
      fetchHistoricoDevolucoes();
    }
  }, [view]);

  const fetchRequisicoes = async () => {
    try {
      setIsLoading(true);
      const requisicoesCollection = collection(db, "requisicoes");
      const requisicoesQuery = query(requisicoesCollection, orderBy("data_criacao", "desc"));
      const requisicoesSnapshot = await getDocs(requisicoesQuery);
      
      const requisicoesData = requisicoesSnapshot.docs.map(doc => ({
        id: doc.id,
        requisicao_id: doc.data().requisicao_id || "",
        status: doc.data().status || "",
        itens: doc.data().itens || [],
        usuario: doc.data().usuario || {},
        solicitante: doc.data().solicitante || {},
        data_criacao: doc.data().data_criacao,
        valor_total: doc.data().valor_total || 0
      })) as Requisicao[];
      
      // Buscar devoluções para mapear quais requisições já tiveram devoluções
      const devolucoesCollection = collection(db, "devolucao");
      const devolucoesSnapshot = await getDocs(devolucoesCollection);
      
      const devolucoesMap: Record<string, ItemDevolucao[]> = {};
      devolucoesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const requisicaoId = data.requisicao_id;
        if (!devolucoesMap[requisicaoId]) {
          devolucoesMap[requisicaoId] = [];
        }
        devolucoesMap[requisicaoId].push(...(data.itens || []));
      });
      
      setDevolucoesRequisicoes(devolucoesMap);
      setRequisicoes(requisicoesData);
      setError(null);
    } catch (error) {
      console.error("Erro ao buscar requisições:", error);
      setError("Falha ao carregar requisições");
      toast({
        title: "Erro",
        description: "Falha ao carregar requisições",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoricoDevolucoes = async () => {
    try {
      setIsLoading(true);
      const devolucoesCollection = collection(db, "devolucao");
      const devolucoesQuery = query(devolucoesCollection, orderBy("dataRegistro", "desc"));
      const devolucoesSnapshot = await getDocs(devolucoesQuery);
      
      const devolucoesData = devolucoesSnapshot.docs.map(doc => ({
        id: doc.id,
        requisicao_id: doc.data().requisicao_id || "",
        requisicao_original: doc.data().requisicao_original || "",
        motivo: doc.data().motivo || "",
        observacoes: doc.data().observacoes || "",
        data: doc.data().data || "",
        itens: doc.data().itens || [],
        usuarioId: doc.data().usuarioId || "",
        usuarioNome: doc.data().usuarioNome || "",
        usuarioCargo: doc.data().usuarioCargo || "",
        dataRegistro: doc.data().dataRegistro?.toDate() || new Date()
      })) as Devolucao[];
      
      setHistoricoDevolucoes(devolucoesData);
    } catch (error) {
      console.error("Erro ao buscar histórico de devoluções:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar histórico de devoluções",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelecionarRequisicao = (requisicao: Requisicao) => {
    // Verificar se a requisição tem produtos disponíveis para devolução
    const devolucoesExistentes = devolucoesRequisicoes[requisicao.requisicao_id] || [];
    const temProdutosDisponiveis = requisicao.itens.some(item => {
      const quantidadeDevolvida = devolucoesExistentes
        .filter(d => d.codigo_material === item.codigo_material)
        .reduce((total, d) => total + d.quantidade_devolvida, 0);
      return item.quantidade > quantidadeDevolvida;
    });

    if (!temProdutosDisponiveis) {
      toast({
        title: "Atenção",
        description: "Esta requisição não possui produtos disponíveis para devolução",
        variant: "destructive",
      });
      return;
    }

    setRequisicaoSelecionada(requisicao);
    setDevolucao(prev => ({
      ...prev,
      requisicao_id: requisicao.requisicao_id
    }));

    // Inicializar itens de devolução baseado nos itens da requisição
    const itens = requisicao.itens.map(item => {
      const quantidadeJaDevolvida = devolucoesExistentes
        .filter(d => d.codigo_material === item.codigo_material)
        .reduce((total, d) => total + d.quantidade_devolvida, 0);
      
      return {
        codigo_material: item.codigo_material,
        codigo_estoque: item.codigo_estoque,
        nome: item.nome,
        quantidade_original: item.quantidade,
        quantidade_devolvida: 0,
        quantidade_ja_devolvida: quantidadeJaDevolvida,
        quantidade_disponivel: item.quantidade - quantidadeJaDevolvida,
        unidade: item.unidade || item.unidade_de_medida,
        valor_unitario: item.valor_unitario
      };
    }).filter(item => item.quantidade_disponivel > 0); // Só mostra itens com quantidade disponível

    setItensDevolucao(itens);
    setView("devolucao");
  };

  const handleQuantidadeDevolucaoChange = (index: number, quantidade: number) => {
    if (quantidade < 0) return;
    
    const item = itensDevolucao[index];
    const maxQuantidade = (item as any).quantidade_disponivel || item.quantidade_original;
    
    if (quantidade > maxQuantidade) {
      toast({
        title: "Atenção",
        description: `Quantidade máxima disponível para devolução: ${maxQuantidade}`,
        variant: "destructive",
      });
      return;
    }
    
    setItensDevolucao(prev => 
      prev.map((itemPrev, i) => 
        i === index ? { ...itemPrev, quantidade_devolvida: quantidade } : itemPrev
      )
    );
  };

  const handleSubmitDevolucao = async () => {
    if (!user || !userData || !requisicaoSelecionada) {
      toast({
        title: "Erro",
        description: "Dados insuficientes para processar devolução",
        variant: "destructive",
      });
      return;
    }

    const itensSelecionados = itensDevolucao.filter(item => item.quantidade_devolvida > 0);

    if (itensSelecionados.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um produto com quantidade para devolução",
        variant: "destructive",
      });
      return;
    }

    if (!devolucao.motivo) {
      toast({
        title: "Atenção",
        description: "Informe o motivo da devolução",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Registrar na coleção "devolucao"
      await addDoc(collection(db, "devolucao"), {
        requisicao_id: devolucao.requisicao_id,
        requisicao_original: requisicaoSelecionada.id,
        motivo: devolucao.motivo,
        observacoes: devolucao.observacoes,
        data: devolucao.data,
        itens: itensSelecionados,
        usuarioId: user.uid,
        usuarioNome: userData.nome,
        usuarioCargo: userData.cargo,
        dataRegistro: serverTimestamp()
      });

      // Registrar na coleção "relatorios" com status "devolução"
      await addDoc(collection(db, "relatorios"), {
        tipo: "devolucao",
        status: "devolução",
        requisicao_id: devolucao.requisicao_id,
        itens: itensSelecionados,
        usuarioId: user.uid,
        usuarioNome: userData.nome,
        usuarioCargo: userData.cargo,
        data: devolucao.data,
        motivo: devolucao.motivo,
        observacoes: devolucao.observacoes,
        valor_total: itensSelecionados.reduce((total, item) => 
          total + (item.valor_unitario * item.quantidade_devolvida), 0
        ),
        dataRegistro: serverTimestamp()
      });

      // Incrementar quantidade nos produtos
      const updatePromises = itensSelecionados.map(async (item) => {
        // Buscar o produto pelo codigo_material
        const produtosCollection = collection(db, "produtos");
        const produtoQuery = query(produtosCollection, where("codigo_material", "==", item.codigo_material));
        const produtoSnapshot = await getDocs(produtoQuery);
        
        if (!produtoSnapshot.empty) {
          const produtoDoc = produtoSnapshot.docs[0];
          const produtoAtual = produtoDoc.data();
          
          await updateDoc(doc(db, "produtos", produtoDoc.id), {
            quantidade: (produtoAtual.quantidade || 0) + item.quantidade_devolvida
          });
        }
      });

      await Promise.all(updatePromises);

      toast({
        title: "Sucesso",
        description: "Devolução registrada com sucesso!",
      });

      // Voltar para a lista
      setView("lista");
      setRequisicaoSelecionada(null);
      setItensDevolucao([]);
      setDevolucao({
        requisicao_id: "",
        motivo: "",
        observacoes: "",
        data: new Date().toISOString().split('T')[0],
      });

    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
      toast({
        title: "Erro",
        description: "Falha ao registrar devolução",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Filtrar requisições por termo de pesquisa
  const requisicoesFiltered = requisicoes.filter(requisicao => {
    if (!searchTerm) return true;
    
    const termo = searchTerm.toLowerCase();
    return (
      requisicao.requisicao_id.toLowerCase().includes(termo) ||
      requisicao.solicitante.nome.toLowerCase().includes(termo) ||
      requisicao.solicitante.cargo.toLowerCase().includes(termo) ||
      requisicao.status.toLowerCase().includes(termo) ||
      requisicao.itens.some(item => 
        item.nome.toLowerCase().includes(termo) ||
        item.codigo_material.toLowerCase().includes(termo)
      )
    );
  });

  // Filtrar histórico de devoluções por termo de pesquisa
  const historicoFiltered = historicoDevolucoes.filter(devolucao => {
    if (!searchTermHistorico) return true;
    
    const termo = searchTermHistorico.toLowerCase();
    return (
      devolucao.requisicao_id.toLowerCase().includes(termo) ||
      devolucao.usuarioNome.toLowerCase().includes(termo) ||
      devolucao.motivo.toLowerCase().includes(termo) ||
      devolucao.itens.some(item => 
        item.nome.toLowerCase().includes(termo) ||
        (item.codigo_material && item.codigo_material.toLowerCase().includes(termo))
      )
    );
  });

  const renderListaRequisicoes = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold">Selecione uma Requisição para Devolução</h2>
        <Button
          variant="outline"
          onClick={() => setView("historico")}
          className="flex items-center gap-2"
        >
          <ClipboardList size={16} />
          Ver Histórico
        </Button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por ID, solicitante, produto ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {requisicoesFiltered.map((requisicao) => {
          const devolucoesExistentes = devolucoesRequisicoes[requisicao.requisicao_id] || [];
          const temDevolucoes = devolucoesExistentes.length > 0;
          const temProdutosDisponiveis = requisicao.itens.some(item => {
            const quantidadeDevolvida = devolucoesExistentes
              .filter(d => d.codigo_material === item.codigo_material)
              .reduce((total, d) => total + d.quantidade_devolvida, 0);
            return item.quantidade > quantidadeDevolvida;
          });

          return (
            <Card key={requisicao.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg">{requisicao.requisicao_id}</CardTitle>
                      <CardDescription>
                        Status: <span className="capitalize">{requisicao.status}</span>
                      </CardDescription>
                    </div>
                    {temDevolucoes && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        Com Devoluções
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSelecionarRequisicao(requisicao)}
                    disabled={!temProdutosDisponiveis}
                    className="flex items-center gap-2"
                    variant={temProdutosDisponiveis ? "default" : "outline"}
                  >
                    <Eye size={16} />
                    {temProdutosDisponiveis ? "Selecionar" : "Sem Produtos Disponíveis"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Solicitante:</strong> {requisicao.solicitante.nome}
                    </div>
                    <div>
                      <strong>Cargo:</strong> {requisicao.solicitante.cargo}
                    </div>
                    <div>
                      <strong>Data:</strong> {requisicao.data_criacao ? 
                        new Date(requisicao.data_criacao.toDate()).toLocaleDateString('pt-BR') : 
                        "N/A"
                      }
                    </div>
                    <div>
                      <strong>Valor Total:</strong> {formatCurrency(requisicao.valor_total)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <strong>Itens ({requisicao.itens.length}):</strong>
                      {requisicao.itens.length > 1 && (
                        <ModalProdutosRequisicao 
                          itens={requisicao.itens}
                          devolucoes={devolucoesExistentes}
                          formatCurrency={formatCurrency}
                        />
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {requisicao.itens.slice(0, 1).map((item, index) => {
                        const quantidadeDevolvida = devolucoesExistentes
                          .filter(d => d.codigo_material === item.codigo_material)
                          .reduce((total, d) => total + d.quantidade_devolvida, 0);
                        const quantidadeDisponivel = item.quantidade - quantidadeDevolvida;
                        
                        return (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">
                                • {item.nome}
                              </span>
                              <div className="flex items-center gap-2">
                                {quantidadeDevolvida > 0 && (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs">
                                    {quantidadeDevolvida} devolvidos
                                  </Badge>
                                )}
                                <span className="text-muted-foreground">
                                  Qtd: {quantidadeDisponivel} {item.unidade}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {requisicao.itens.length > 1 && (
                        <div className="text-sm text-muted-foreground">
                          + {requisicao.itens.length - 1} outros itens
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {requisicoesFiltered.length === 0 && (
        <div className="text-center py-12 border rounded-md">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-2">
            {searchTerm ? "Nenhuma requisição encontrada para o termo pesquisado" : "Nenhuma requisição encontrada"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Tente alterar o termo de pesquisa." : "Não há requisições disponíveis para devolução."}
          </p>
        </div>
      )}
    </div>
  );

  const renderFormDevolucao = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setView("lista")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <h2 className="text-xl font-bold">Devolução - {requisicaoSelecionada?.requisicao_id}</h2>
      </div>

      {/* Informações da Requisição */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Requisição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Solicitante:</strong> {requisicaoSelecionada?.solicitante.nome}</div>
            <div><strong>Cargo:</strong> {requisicaoSelecionada?.solicitante.cargo}</div>
            <div><strong>Data:</strong> {requisicaoSelecionada?.data_criacao ? 
              new Date(requisicaoSelecionada.data_criacao.toDate()).toLocaleDateString('pt-BR') : "N/A"
            }</div>
            <div><strong>Valor Total:</strong> {formatCurrency(requisicaoSelecionada?.valor_total || 0)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Devolução */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Motivo da Devolução*</Label>
          <Select
            value={devolucao.motivo}
            onValueChange={(value) => setDevolucao({...devolucao, motivo: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Produto não utilizado">Produto não utilizado</SelectItem>
              <SelectItem value="Quantidade em excesso">Quantidade em excesso</SelectItem>
              <SelectItem value="Produto com defeito">Produto com defeito</SelectItem>
              <SelectItem value="Especificação incorreta">Especificação incorreta</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data da Devolução</Label>
          <Input
            type="date"
            value={devolucao.data}
            onChange={(e) => setDevolucao({...devolucao, data: e.target.value})}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Observações</Label>
          <Textarea
            placeholder="Detalhes adicionais sobre a devolução..."
            value={devolucao.observacoes}
            onChange={(e) => setDevolucao({...devolucao, observacoes: e.target.value})}
            rows={3}
          />
        </div>
      </div>

      {/* Produtos para Devolução */}
      <div className="space-y-4">
        <Label>Produtos para Devolução</Label>
        
        <div className="border rounded-md divide-y">
          {itensDevolucao.map((item, index) => {
            const quantidadeJaDevolvida = (item as any).quantidade_ja_devolvida || 0;
            const quantidadeDisponivel = (item as any).quantidade_disponivel || item.quantidade_original;
            
            return (
              <div key={index} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      Código: {item.codigo_material} | Unidade: {item.unidade}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Quantidade Original: {item.quantidade_original}</div>
                      {quantidadeJaDevolvida > 0 && (
                        <div className="text-orange-600">
                          Quantidade Já Devolvida: {quantidadeJaDevolvida}
                        </div>
                      )}
                      <div className="text-green-600 font-medium">
                        Quantidade Disponível: {quantidadeDisponivel}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Label className="text-sm">Devolver:</Label>
                    <Input
                      type="number"
                      min="0"
                      max={quantidadeDisponivel}
                      value={item.quantidade_devolvida}
                      onChange={(e) => handleQuantidadeDevolucaoChange(index, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setView("lista")}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmitDevolucao} 
          disabled={isLoading || !devolucao.motivo}
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Registrar Devolução
        </Button>
      </div>
    </div>
  );

  const renderHistorico = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setView("lista")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <h2 className="text-xl font-bold">Histórico de Devoluções</h2>
        <div></div>
      </div>

      {/* Barra de Pesquisa do Histórico */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por ID da requisição, usuário, motivo ou produto..."
          value={searchTermHistorico}
          onChange={(e) => setSearchTermHistorico(e.target.value)}
          className="pl-9"
        />
      </div>

      {historicoFiltered.length > 0 ? (
        <div className="grid gap-4">
          {historicoFiltered.map((devolucao) => (
            <Card key={devolucao.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Devolução - {devolucao.requisicao_id}
                    </CardTitle>
                    <CardDescription>
                      {new Date(devolucao.dataRegistro).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <div>Registrado por:</div>
                    <div>{devolucao.usuarioNome}</div>
                    <div>({devolucao.usuarioCargo})</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <strong>Motivo:</strong> {devolucao.motivo}
                  </div>
                  
                  {devolucao.observacoes && (
                    <div className="text-sm">
                      <strong>Observações:</strong> {devolucao.observacoes}
                    </div>
                  )}

                  <div>
                    <strong className="text-sm">Produtos devolvidos:</strong>
                    <div className="mt-2 border rounded-md divide-y">
                      {devolucao.itens.map((item, index) => (
                        <div key={index} className="p-3 flex justify-between">
                          <div>
                            <div className="font-medium">{item.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              Código: {item.codigo_material || item.codigo_estoque}
                            </div>
                          </div>
                          <div className="text-right">
                            <div>{item.quantidade_devolvida} {item.unidade}</div>
                            {item.valor_unitario && (
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(item.valor_unitario)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">
              {searchTermHistorico ? "Nenhuma devolução encontrada para o termo pesquisado" : "Nenhuma devolução registrada"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTermHistorico ? "Tente alterar o termo de pesquisa." : "Ainda não foram realizadas devoluções no sistema."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (authLoading) {
    return (
      <AppLayout title="Devolução de Materiais">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Devolução de Materiais">
        <div className="flex justify-center items-center h-full">
          <p>Redirecionando para login...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Devolução de Materiais">
      <div className="h-full flex flex-col p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
            <Button 
              className="mt-4"
              onClick={fetchRequisicoes}
            >
              Tentar novamente
            </Button>
          </div>
        ) : view === "lista" ? (
          renderListaRequisicoes()
        ) : view === "devolucao" ? (
          renderFormDevolucao()
        ) : (
          renderHistorico()
        )}
      </div>
    </AppLayout>
  );
};

export default DevolucaoMateriais;