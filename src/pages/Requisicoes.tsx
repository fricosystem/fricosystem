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
import { CalendarIcon, FileTextIcon, SearchIcon, RefreshCw, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/layouts/AppLayout";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  valor_total: number;
}

interface RequisicaoFirestore {
  requisicao_id?: string;
  status?: string;
  data_criacao: any;
  itens?: Item[];
  usuario?: Usuario;
  valor_total?: number;
}

interface Item {
  nome: string;
  quantidade: number;
  preco: number;
  valor_unitario?: number;
}

interface Usuario {
  email: string;
  nome: string;
}

const Requisicoes = () => {
  const { user } = useAuth(); // Changed from currentUser to user to match AuthContext
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [filteredRequisicoes, setFilteredRequisicoes] = useState<Requisicao[]>([]);
  const [selectedRequisicao, setSelectedRequisicao] = useState<Requisicao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (!user?.email) { // Changed from currentUser to user
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const requisicaoRef = collection(db, "requisicoes");
      
      let q;
      
      const isAdmin = user.email?.includes("admin"); // Changed from currentUser to user
      
      if (isAdmin) {
        q = query(requisicaoRef, orderBy("data_criacao", "desc"));
      } else {
        q = query(
          requisicaoRef,
          where("usuario.email", "==", user.email), // Changed from currentUser to user
          orderBy("data_criacao", "desc")
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
            email: user?.email || "Email não informado", // Changed from currentUser to user
            nome: "Usuário"
          },
          valor_total: data.valor_total || 0
        };
        
        requisicoesList.push(requisicao);
      });
      
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
  }, [user]); // Changed from currentUser to user

  const applyFilters = (reqs = requisicoes, search = searchTerm, status = statusFilter) => {
    let filtered = [...reqs];
    
    // Aplicar filtro de busca
    if (search) {
      filtered = filtered.filter(req => 
        req.requisicao_id.toLowerCase().includes(search.toLowerCase()) ||
        req.usuario.nome.toLowerCase().includes(search.toLowerCase()) ||
        req.usuario.email.toLowerCase().includes(search.toLowerCase())
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

  const handleFinalizar = async () => {
    if (!selectedRequisicao) return;
    
    try {
      setIsUpdating(true);
      
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
      doc.text(`Solicitante: ${selectedRequisicao.usuario.nome}`, 15, 50);
      doc.text(`Email: ${selectedRequisicao.usuario.email}`, 15, 60);
      
      // Adicionar tabela de itens
      const tableColumn = ["Item", "Quantidade", "Preço Unit.", "Total"];
      const tableRows = [];
      
      selectedRequisicao.itens.forEach(item => {
        const itemData = [
          item.nome,
          item.quantidade,
          formatCurrency(item.preco),
          formatCurrency(item.quantidade * item.preco)
        ];
        tableRows.push(itemData);
      });
      
      // Adicionar a tabela ao PDF
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
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
                        <p className="text-sm text-muted-foreground">{requisicao.usuario.nome}</p>
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
                      <div>
                        <Label className="text-muted-foreground">Solicitante</Label>
                        <p className="font-medium">{selectedRequisicao.usuario.nome}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{selectedRequisicao.usuario.email}</p>
                      </div>
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
                                <TableCell className="font-medium">{item.nome}</TableCell>
                                <TableCell className="text-right">{item.quantidade}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.preco)}</TableCell>
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
                        onClick={handleFinalizar}
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
    </AppLayout>
  );
};

export default Requisicoes;