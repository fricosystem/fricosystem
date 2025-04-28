import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import {
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  CalendarIcon, 
  FileTextIcon, 
  SearchIcon, 
  RefreshCw, 
  Download, 
  User, 
  AlertTriangle 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/layouts/AppLayout";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => any;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface Requisicao {
  id: string;
  requisicao_id: string;
  status: string;
  data_criacao: any;
  itens: Item[];
  usuario: Usuario;
  solicitante?: Solicitante;
  valor_total: number;
}

interface RequisicaoFirestore {
  requisicao_id?: string;
  status?: string;
  data_criacao: any;
  itens?: Item[];
  usuario?: Usuario;
  solicitante?: Solicitante;
  valor_total?: number;
}

interface Item {
  nome: string;
  quantidade: number;
  preco?: number;
  valor_unitario?: number;
  codigo_material?: string;
  codigo_estoque?: string;
  unidade?: string;
  unidade_de_medida?: string;
  deposito?: string;
  prateleira?: string;
  detalhes?: string;
  imagem?: string;
}

interface Usuario {
  email: string;
  nome: string;
  cargo?: string;
}

interface Solicitante {
  id?: string;
  email?: string;
  nome: string;
  cargo?: string;
}

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  codigo_material?: string;
  // outros campos
}

const Requisicoes = () => {
  const { user } = useAuth();
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [filteredRequisicoes, setFilteredRequisicoes] = useState<Requisicao[]>([]);
  const [selectedRequisicao, setSelectedRequisicao] = useState<Requisicao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [errosEstoque, setErrosEstoque] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchRequisicoes = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const requisicaoRef = collection(db, "requisicoes");
      
      let q;
      
      const isAdmin = user.email?.includes("admin");
      
      if (isAdmin) {
        // Para admin, manter o orderBy
        q = query(requisicaoRef, orderBy("data_criacao", "desc"));
      } else {
        // SOLUÇÃO 1: Para usuários normais, recuperar todos os documentos do usuário e ordenar manualmente
        // Isso evita a necessidade do índice composto
        q = query(
          requisicaoRef,
          where("usuario.email", "==", user.email)
        );
      }
      
      const querySnapshot = await getDocs(q);
      const requisicoesList: Requisicao[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as RequisicaoFirestore;
        
        const requisicao: Requisicao = {
          id: doc.id,
          requisicao_id: data.requisicao_id || "Sem ID",
          status: data.status || "pendente",
          data_criacao: data.data_criacao instanceof Timestamp 
            ? new Date(data.data_criacao.toMillis()).toLocaleString('pt-BR')
            : "Data inválida",
          itens: data.itens?.map(item => ({
            ...item,
            preco: item.valor_unitario || item.preco || 0,
          })) || [],
          usuario: data.usuario || { 
            email: user?.email || "Email não informado",
            nome: "Usuário"
          },
          solicitante: data.solicitante,
          valor_total: data.valor_total || 0
        };
        
        requisicoesList.push(requisicao);
      });
      
      // Ordenar manualmente os resultados se não for admin (já que não usamos orderBy na consulta)
      if (!isAdmin) {
        requisicoesList.sort((a, b) => {
          // Converter strings de data em objetos Date para comparação correta
          const dateA = new Date(a.data_criacao.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
          const dateB = new Date(b.data_criacao.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'));
          return dateB.getTime() - dateA.getTime(); // Ordem decrescente
        });
      }
      
      setRequisicoes(requisicoesList);
      applyFilters(requisicoesList, searchTerm, statusFilter);
      
      if (requisicoesList.length > 0 && !selectedRequisicao) {
        setSelectedRequisicao(requisicoesList[0]);
      }
      
      console.log("Requisições carregadas:", requisicoesList.length);
    } catch (error) {
      console.error("Erro ao carregar requisições:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as requisições",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisicoes();
  }, [user]);

  const applyFilters = (reqs = requisicoes, search = searchTerm, status = statusFilter) => {
    let filtered = [...reqs];
    
    // Aplicar filtro de busca
    if (search) {
      filtered = filtered.filter(req => 
        req.requisicao_id.toLowerCase().includes(search.toLowerCase()) ||
        req.usuario.nome.toLowerCase().includes(search.toLowerCase()) ||
        req.usuario.email.toLowerCase().includes(search.toLowerCase()) ||
        (req.solicitante && req.solicitante.nome.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    // Aplicar filtro de status
    if (status !== "todos") {
      filtered = filtered.filter(req => 
        req.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    setFilteredRequisicoes(filtered);
    
    // Se a requisição selecionada atual não está mais na lista filtrada, selecionar a primeira
    if (filtered.length > 0 && selectedRequisicao && 
        !filtered.some(req => req.id === selectedRequisicao.id)) {
      setSelectedRequisicao(filtered[0]);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, requisicoes]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
      case 'concluida':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'recusado':
      case 'cancelada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const handleRefresh = () => {
    fetchRequisicoes();
  };

  const handleCancelar = async () => {
    if (!selectedRequisicao) return;
    
    try {
      setIsUpdating(true);
      
      const requisicaoRef = doc(db, "requisicoes", selectedRequisicao.id);
      await updateDoc(requisicaoRef, {
        status: "cancelada"
      });
      
      // Atualizar o estado local
      const updatedRequisicao = {
        ...selectedRequisicao,
        status: "cancelada"
      };
      
      setSelectedRequisicao(updatedRequisicao);
      
      // Atualizar a lista de requisições
      const updatedRequisicoes = requisicoes.map(req => 
        req.id === selectedRequisicao.id ? updatedRequisicao : req
      );
      
      setRequisicoes(updatedRequisicoes);
      
      toast({
        title: "Requisição cancelada",
        description: `A requisição ${selectedRequisicao.requisicao_id} foi cancelada com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao cancelar requisição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a requisição",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para verificar se há estoque suficiente
  const verificarEstoque = async () => {
    if (!selectedRequisicao) return false;
    
    try {
      const erros: string[] = [];
      const produtosRef = collection(db, "produtos");
      
      // Para cada item na requisição
      for (const item of selectedRequisicao.itens) {
        // Buscar o produto pelo código de material
        if (!item.codigo_material) {
          erros.push(`O item "${item.nome}" não possui código de material.`);
          continue;
        }
        
        const q = query(produtosRef, where("codigo_material", "==", item.codigo_material));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          erros.push(`Produto "${item.nome}" (código: ${item.codigo_material}) não encontrado no estoque.`);
          continue;
        }
        
        const produtoDoc = querySnapshot.docs[0];
        const produtoData = produtoDoc.data() as Produto;
        
        // Verificar quantidade
        if (produtoData.quantidade < item.quantidade) {
          erros.push(`Quantidade insuficiente do produto "${item.nome}" (código: ${item.codigo_material}). Disponível: ${produtoData.quantidade}, Necessário: ${item.quantidade}`);
        }
      }
      
      setErrosEstoque(erros);
      return erros.length === 0;
    } catch (error) {
      console.error("Erro ao verificar estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o estoque dos produtos",
        variant: "destructive",
      });
      return false;
    }
  };

  // Função para baixar do estoque
  const baixarEstoque = async () => {
    if (!selectedRequisicao) return false;
    
    try {
      const produtosRef = collection(db, "produtos");
      
      // Para cada item na requisição
      for (const item of selectedRequisicao.itens) {
        if (!item.codigo_material) continue;
        
        const q = query(produtosRef, where("codigo_material", "==", item.codigo_material));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const produtoDoc = querySnapshot.docs[0];
          const produtoData = produtoDoc.data() as Produto;
          
          // Atualizar quantidade (subtrair)
          const novaQuantidade = produtoData.quantidade - item.quantidade;
          await updateDoc(produtoDoc.ref, {
            quantidade: novaQuantidade
          });
          
          console.log(`Produto ${item.nome} atualizado. Nova quantidade: ${novaQuantidade}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao baixar estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque dos produtos",
        variant: "destructive",
      });
      return false;
    }
  };

  // Função para abrir diálogo de finalização
  const openFinalizarDialog = async () => {
    if (!selectedRequisicao) return;
    
    // Verificar estoque antes de abrir o diálogo
    const estoqueOk = await verificarEstoque();
    
    if (estoqueOk) {
      setIsFinalizarDialogOpen(true);
    } else {
      // Mostrar erros encontrados
      toast({
        title: "Problemas de estoque detectados",
        description: "Não é possível finalizar a requisição devido a problemas de estoque.",
        variant: "destructive",
      });
    }
  };

  const handleFinalizar = async () => {
    if (!selectedRequisicao) return;
    
    try {
      setIsUpdating(true);
      
      // Baixar estoque
      const baixaOk = await baixarEstoque();
      
      if (!baixaOk) {
        setIsUpdating(false);
        return;
      }
      
      // Atualizar status da requisição
      const requisicaoRef = doc(db, "requisicoes", selectedRequisicao.id);
      await updateDoc(requisicaoRef, {
        status: "concluida"
      });
      
      // Atualizar o estado local
      const updatedRequisicao = {
        ...selectedRequisicao,
        status: "concluida"
      };
      
      setSelectedRequisicao(updatedRequisicao);
      
      // Atualizar a lista de requisições
      const updatedRequisicoes = requisicoes.map(req => 
        req.id === selectedRequisicao.id ? updatedRequisicao : req
      );
      
      setRequisicoes(updatedRequisicoes);
      
      toast({
        title: "Requisição concluída",
        description: `A requisição ${selectedRequisicao.requisicao_id} foi concluída com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao finalizar requisição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a requisição",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setIsFinalizarDialogOpen(false);
    }
  };

  const handleExportPDF = () => {
    if (!selectedRequisicao) return;
    
    try {
      // Criar nova instância do jsPDF
      const doc = new jsPDF();
      
      // Adicionar cabeçalho
      doc.setFontSize(18);
      doc.text(`Requisição: ${selectedRequisicao.requisicao_id}`, 15, 20);
      
      doc.setFontSize(12);
      doc.text(`Status: ${selectedRequisicao.status.toUpperCase()}`, 15, 30);
      doc.text(`Data: ${selectedRequisicao.data_criacao}`, 15, 40);
      
      // Informações do usuário solicitante
      doc.text(`Solicitante: ${selectedRequisicao.solicitante?.nome || selectedRequisicao.usuario.nome}`, 15, 50);
      doc.text(`Email: ${selectedRequisicao.solicitante?.email || selectedRequisicao.usuario.email}`, 15, 60);
      if (selectedRequisicao.solicitante?.cargo || selectedRequisicao.usuario.cargo) {
        doc.text(`Cargo: ${selectedRequisicao.solicitante?.cargo || selectedRequisicao.usuario.cargo}`, 15, 70);
      }
      
      // Adicionar tabela de itens
      const tableColumn = ["Item", "Código", "Quantidade", "Preço Unit.", "Total"];
      const tableRows = [];
      
      selectedRequisicao.itens.forEach(item => {
        const itemData = [
          item.nome,
          item.codigo_material || "N/A",
          item.quantidade,
          formatCurrency(item.valor_unitario || item.preco || 0),
          formatCurrency((item.valor_unitario || item.preco || 0) * item.quantidade)
        ];
        tableRows.push(itemData);
      });
      
      // Adicionar a tabela ao PDF
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'striped',
        styles: { fontSize: 10 }
      });
      
      // Adicionar valor total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Valor Total: ${formatCurrency(selectedRequisicao.valor_total)}`, 15, finalY);
      
      // Gerar e baixar o PDF
      doc.save(`requisicao-${selectedRequisicao.requisicao_id}.pdf`);
      
      toast({
        title: "PDF exportado",
        description: `O PDF da requisição ${selectedRequisicao.requisicao_id} foi gerado com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Requisições">
      <div className="w-full h-full flex flex-col md:flex-row gap-6 p-4 md:p-6">
        {/* Sidebar lateral da página (lista de requisições) */}
        <div className="w-full md:w-[30%] lg:w-[25%] xl:w-96 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Requisições</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
  
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar requisições..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filtros de status */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button 
              variant={statusFilter === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("todos")}
              className="rounded-full"
            >
              Todos
            </Button>
            <Button 
              variant={statusFilter === "pendente" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pendente")}
              className="rounded-full"
            >
              Pendente
            </Button>
            <Button 
              variant={statusFilter === "concluida" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("concluida")}
              className="rounded-full"
            >
              Concluída
            </Button>
            <Button 
              variant={statusFilter === "cancelada" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("cancelada")}
              className="rounded-full"
            >
              Cancelada
            </Button>
          </div>
  
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Total: {requisicoes.length}</span>
            <span>Filtrados: {filteredRequisicoes.length}</span>
          </div>
  
          <ScrollArea className="h-[calc(100vh-200px)] border rounded-md p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 border rounded-md">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : filteredRequisicoes.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Nenhuma requisição encontrada
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequisicoes.map((requisicao) => (
                  <div
                    key={requisicao.id}
                    className={`p-3 border rounded-md cursor-pointer transition-all hover:bg-muted/50 ${
                      selectedRequisicao?.id === requisicao.id
                        ? "border-primary bg-primary/10 dark:bg-primary/20"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedRequisicao(requisicao)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{requisicao.requisicao_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {requisicao.solicitante?.nome || requisicao.usuario.nome}
                        </p>
                      </div>
                      <Badge className={getStatusColor(requisicao.status)}>
                        {requisicao.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {requisicao.data_criacao}
                      </div>
                      <div>{formatCurrency(requisicao.valor_total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
  
        {/* Conteúdo principal da requisição selecionada */}
        <div className="flex-1 h-full overflow-auto">
          {!selectedRequisicao && !isLoading ? (
            <Card className="w-full h-full flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileTextIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-medium text-center">Nenhuma requisição selecionada</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Selecione uma requisição na lista para ver os detalhes.
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                  <Skeleton className="h-40 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="text-2xl">
                      Requisição {selectedRequisicao.requisicao_id}
                    </CardTitle>
                    <CardDescription>
                      Criada em {selectedRequisicao.data_criacao}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(selectedRequisicao.status)} text-sm px-3 py-1`}>
                    {selectedRequisicao.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informações</h3>
                    <div className="space-y-4 text-sm">
                      {/* Informações do solicitante */}
                      {selectedRequisicao.solicitante ? (
                        <div className="bg-muted/30 p-3 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-primary" />
                            <Label className="text-primary font-medium">Solicitante</Label>
                          </div>
                          <p className="font-medium">{selectedRequisicao.solicitante.nome}</p>
                          {selectedRequisicao.solicitante.cargo && (
                            <p className="text-xs text-muted-foreground mt-1">{selectedRequisicao.solicitante.cargo}</p>
                          )}
                          {selectedRequisicao.solicitante.email && (
                            <p className="text-xs mt-1">{selectedRequisicao.solicitante.email}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <Label className="text-muted-foreground">Solicitante</Label>
                          <p className="font-medium">{selectedRequisicao.usuario.nome}</p>
                        </div>
                      )}
                      
                      {/* Informações do registrante (se diferente do solicitante) */}
                      {selectedRequisicao.solicitante && (
                        <div>
                          <Label className="text-muted-foreground">Registrado por</Label>
                          <p className="font-medium">{selectedRequisicao.usuario.nome}</p>
                          {selectedRequisicao.usuario.cargo && (
                            <p className="text-xs text-muted-foreground">{selectedRequisicao.usuario.cargo}</p>
                          )}
                          <p className="text-xs">{selectedRequisicao.usuario.email}</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-muted-foreground">Data de Criação</Label>
                        <p className="font-medium">{selectedRequisicao.data_criacao}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Valor Total</Label>
                        <p className="font-medium text-lg">
                          {formatCurrency(selectedRequisicao.valor_total)}
                        </p>
                      </div>
                    </div>
                  </div>
  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Itens da Requisição</h3>
                    {selectedRequisicao.itens.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground border rounded-md dark:border-border">
                        Nenhum item encontrado nesta requisição
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden dark:border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-full">Nome</TableHead>
                              <TableHead className="text-right">Qtd.</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRequisicao.itens.map((item, index) => (
                              <TableRow key={`${item.nome}-${index}`}>
                                <TableCell className="font-medium">
                                  {item.nome}
                                  {item.codigo_material && (
                                    <p className="text-xs text-muted-foreground">
                                      Código: {item.codigo_material}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantidade}
                                  {item.unidade && <span> {item.unidade_de_medida}</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.valor_unitario || item.preco || 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={2}>Total</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(selectedRequisicao.valor_total)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
  
                <Separator className="my-6" />
  
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2"
                    disabled={isUpdating}
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  {selectedRequisicao.status === "pendente" && (
                    <>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelar}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Processando..." : "Cancelar"}
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={openFinalizarDialog}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Processando..." : "Finalizar"}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de confirmação para finalizar requisição */}
      <AlertDialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar requisição</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá baixar automaticamente as quantidades dos produtos no estoque.{' '}
              <span className="font-medium">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {errosEstoque.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 my-2 dark:bg-red-950 dark:border-red-900">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-600 dark:text-red-400">Problemas encontrados:</span>
              </div>
              <ul className="text-sm list-disc pl-5 text-red-600 dark:text-red-400">
                {errosEstoque.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2 dark:bg-amber-950 dark:border-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-600 dark:text-amber-400">Itens que serão baixados do estoque:</span>
            </div>
            <ul className="text-sm mt-2 space-y-1">
              {selectedRequisicao?.itens.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>
                    {item.nome} ({item.codigo_material || "Sem código"})
                  </span>
                  <span className="font-medium">
                    {item.quantidade} {item.unidade || "un"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizar} disabled={isUpdating || errosEstoque.length > 0}>
              {isUpdating ? "Processando..." : "Confirmar e baixar estoque"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Requisicoes;