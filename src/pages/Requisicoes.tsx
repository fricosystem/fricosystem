import React, { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query, where, Timestamp, doc, updateDoc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { toPng } from 'html-to-image';
import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarIcon, FileTextIcon, SearchIcon, RefreshCw, Download, User, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/layouts/AppLayout";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  unidade_medida?: string;
  unidade_de_medida?: string;
  deposito?: string;
  prateleira?: string;
  detalhes?: string;
  imagem?: string;
  centroDeCusto?: string;
  centro_de_custo?: string;
  unidade?: string;
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
  perfil?: string;
}
interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  codigo_material?: string;
  valor_unitario?: number;
  preco?: number;
  deposito?: string;
  prateleira?: string;
  centro_de_custo?: string;
  unidade?: string;
}
interface CentroDeCusto {
  id: string;
  nome: string;
  unidade: string;
}
interface ProdutoCarrinho {
  id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  codigo_material?: string;
  deposito?: string;
  prateleira?: string;
  centroDeCusto?: string;
  centro_de_custo?: string;
  unidade?: string;
  tipo: string; // Campo adicionado
}
const Requisicoes = () => {
  const {
    user
  } = useAuth();
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
  const [centrosDeCusto, setCentrosDeCusto] = useState<CentroDeCusto[]>([]);
  const [solicitanteSelecionado, setSolicitanteSelecionado] = useState<Solicitante | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const criarRelatorioSaida = async (requisicaoId: string, itens: ProdutoCarrinho[]) => {
    try {
      // Criar um relatório para cada item do carrinho
      for (const item of itens) {
        const centroDeCustoSelecionado = centrosDeCusto.find(c => c.id === (item.centroDeCusto || item.centro_de_custo));

        // Buscar informações completas do produto no Firestore
        let produtoInfo: Partial<Produto> = {};
        if (item.codigo_material) {
          try {
            const produtosRef = collection(db, "produtos");
            const q = query(produtosRef, where("codigo_material", "==", item.codigo_material));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const produtoDoc = querySnapshot.docs[0];
              produtoInfo = produtoDoc.data();
            }
          } catch (error) {
            console.error("Erro ao buscar informações do produto:", error);
          }
        }
        const relatorioData = {
          requisicao_id: requisicaoId,
          produto_id: item.id || produtoInfo.id || "",
          codigo_material: item.codigo_material || produtoInfo.codigo_material || "",
          nome_produto: item.nome || produtoInfo.nome || "",
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario || produtoInfo.valor_unitario || produtoInfo.preco || 0,
          valor_total: (item.valor_unitario || produtoInfo.valor_unitario || produtoInfo.preco || 0) * item.quantidade,
          tipo: "Requisição",
          // Adicionar este campo
          status: "saida" as const,
          solicitante: {
            id: solicitanteSelecionado?.id || selectedRequisicao?.solicitante?.id || "",
            nome: solicitanteSelecionado?.nome || selectedRequisicao?.solicitante?.nome || selectedRequisicao?.usuario.nome || "",
            cargo: solicitanteSelecionado?.cargo || selectedRequisicao?.solicitante?.cargo || selectedRequisicao?.usuario.cargo || ""
          },
          usuario: {
            id: user?.uid || "",
            email: user?.email || "",
            nome: userData?.nome || selectedRequisicao?.usuario.nome || ""
          },
          deposito: item.deposito || produtoInfo.deposito || "",
          prateleira: item.prateleira || produtoInfo.prateleira || "",
          centro_de_custo: centroDeCustoSelecionado?.nome || item.centro_de_custo || produtoInfo.centro_de_custo || "",
          unidade: centroDeCustoSelecionado?.unidade || item.unidade || produtoInfo.unidade || "",
          data_saida: serverTimestamp(),
          data_registro: serverTimestamp()
        };
        await addDoc(collection(db, "relatorios"), relatorioData);
      }
      toast({
        title: "Relatórios criados",
        description: `Relatórios de saída criados para a requisição ${requisicaoId}.`
      });
    } catch (error) {
      console.error("Erro ao criar relatório de saída:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar os relatórios de saída",
        variant: "destructive"
      });
      throw error;
    }
  };
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
  const fetchCentrosDeCusto = async () => {
    try {
      const centrosRef = collection(db, "centros_de_custo");
      const querySnapshot = await getDocs(centrosRef);
      const centrosList: CentroDeCusto[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        centrosList.push({
          id: doc.id,
          nome: data.nome || "",
          unidade: data.unidade || ""
        });
      });
      setCentrosDeCusto(centrosList);
    } catch (error) {
      console.error("Erro ao carregar centros de custo:", error);
    }
  };
  const fetchUserData = async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  };
  const fetchRequisicoes = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const requisicaoRef = collection(db, "requisicoes");

      // Query simplificada para todos os usuários
      const q = query(requisicaoRef, orderBy("data_criacao", "desc"));
      const querySnapshot = await getDocs(q);
      const requisicoesList: Requisicao[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data() as RequisicaoFirestore;
        const requisicao: Requisicao = {
          id: doc.id,
          requisicao_id: data.requisicao_id || "Sem ID",
          status: data.status || "pendente",
          data_criacao: data.data_criacao instanceof Timestamp ? new Date(data.data_criacao.toMillis()).toLocaleString('pt-BR') : "Data inválida",
          itens: data.itens?.map(item => ({
            ...item,
            preco: item.valor_unitario || item.preco || 0,
            centro_de_custo: item.centroDeCusto || item.centro_de_custo,
            unidade: item.unidade
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
      setRequisicoes(requisicoesList);
      applyFilters(requisicoesList, searchTerm, statusFilter);
      if (requisicoesList.length > 0 && !selectedRequisicao) {
        setSelectedRequisicao(requisicoesList[0]);
        if (requisicoesList[0].solicitante) {
          setSolicitanteSelecionado(requisicoesList[0].solicitante);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar requisições:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as requisições",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchCentrosDeCusto();
    fetchUserData();
    fetchRequisicoes();
  }, [user]);
  const applyFilters = (reqs = requisicoes, search = searchTerm, status = statusFilter) => {
    let filtered = [...reqs];

    // Aplicar filtro de busca
    if (search) {
      filtered = filtered.filter(req => req.requisicao_id.toLowerCase().includes(search.toLowerCase()) || req.usuario.nome.toLowerCase().includes(search.toLowerCase()) || req.usuario.email.toLowerCase().includes(search.toLowerCase()) || req.solicitante && req.solicitante.nome.toLowerCase().includes(search.toLowerCase()));
    }

    // Aplicar filtro de status
    if (status !== "todos") {
      filtered = filtered.filter(req => req.status.toLowerCase() === status.toLowerCase());
    }
    setFilteredRequisicoes(filtered);

    // Se a requisição selecionada atual não está mais na lista filtrada, selecionar a primeira
    if (filtered.length > 0 && selectedRequisicao && !filtered.some(req => req.id === selectedRequisicao.id)) {
      setSelectedRequisicao(filtered[0]);
      if (filtered[0].solicitante) {
        setSolicitanteSelecionado(filtered[0].solicitante);
      }
    }
  };
  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, requisicoes]);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const getStatusColor = (status: string) => {
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
      const updatedRequisicoes = requisicoes.map(req => req.id === selectedRequisicao.id ? updatedRequisicao : req);
      setRequisicoes(updatedRequisicoes);
      toast({
        title: "Requisição cancelada",
        description: `A requisição ${selectedRequisicao.requisicao_id} foi cancelada com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao cancelar requisição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a requisição",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
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
        variant: "destructive"
      });
      return false;
    }
  };
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
        }
      }
      return true;
    } catch (error) {
      console.error("Erro ao baixar estoque:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque dos produtos",
        variant: "destructive"
      });
      return false;
    }
  };
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
        variant: "destructive"
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

      // Criar relatório de saída
      const produtosCarrinho: ProdutoCarrinho[] = selectedRequisicao.itens.map(item => ({
        id: item.codigo_material || "",
        nome: item.nome,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario || item.preco || 0,
        codigo_material: item.codigo_material,
        deposito: item.deposito,
        prateleira: item.prateleira,
        centroDeCusto: item.centroDeCusto,
        centro_de_custo: item.centro_de_custo,
        unidade: item.unidade,
        tipo: "Requisição"
      }));
      await criarRelatorioSaida(selectedRequisicao.requisicao_id, produtosCarrinho);

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
      const updatedRequisicoes = requisicoes.map(req => req.id === selectedRequisicao.id ? updatedRequisicao : req);
      setRequisicoes(updatedRequisicoes);
      toast({
        title: "Requisição concluída",
        description: `A requisição ${selectedRequisicao.requisicao_id} foi concluída com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao finalizar requisição:", error);
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a requisição",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
      setIsFinalizarDialogOpen(false);
    }
  };
  const handleExportImage = async () => {
    if (!selectedRequisicao) return;
    try {
      // Criar um elemento HTML para o comprovante
      const comprovanteElement = document.createElement('div');
      comprovanteElement.style.width = '800px';
      comprovanteElement.style.padding = '20px';
      comprovanteElement.style.backgroundColor = 'white';
      comprovanteElement.style.color = 'black';
      comprovanteElement.style.fontFamily = 'Arial, sans-serif';
      comprovanteElement.style.boxSizing = 'border-box';
      comprovanteElement.style.border = '2px solid #374151';
      comprovanteElement.style.borderRadius = '8px';

      // Formatar a data
      const dataFormatada = selectedRequisicao.data_criacao;

      // Função para obter cores do status
      const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
          case 'aprovado':
          case 'concluida':
            return 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;';
          case 'pendente':
            return 'background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a;';
          case 'recusado':
          case 'cancelada':
            return 'background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca;';
          default:
            return 'background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db;';
        }
      };

      // Construir o HTML do comprovante
      comprovanteElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #374151;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="/Uploads/IconeFrico3D.png" alt="Fricó Logo" style="width: 48px; height: 48px; object-fit: contain;" />
            <div>
              <h1 style="font-size: 24px; margin-bottom: 5px; font-weight: bold; margin: 0; color: #111827;">Requisição ${selectedRequisicao.requisicao_id}</h1>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">Criada em ${dataFormatada}</p>
            </div>
          </div>
          <div style="padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 600; ${getStatusStyle(selectedRequisicao.status)}">
            ${selectedRequisicao.status.toUpperCase()}
          </div>
        </div>
        
        <div style="background-color: #f8fafc; border: 2px solid #374151; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 16px; font-weight: 600; color: #111827;">
            Informações da Requisição
          </h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
            ${selectedRequisicao.solicitante ? `
              <div>
                <h3 style="font-size: 12px; font-weight: 500; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Solicitante</h3>
                <p style="margin: 0; font-weight: 600; font-size: 14px;">${selectedRequisicao.solicitante.nome}</p>
                ${selectedRequisicao.solicitante.perfil ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">${selectedRequisicao.solicitante.perfil}</p>` : ''}
                ${selectedRequisicao.solicitante.email ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #374151;">${selectedRequisicao.solicitante.email}</p>` : ''}
              </div>
              
              <div>
                <h3 style="font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Registrado por</h3>
                <p style="margin: 0; font-weight: 600; font-size: 14px;">${selectedRequisicao.usuario.nome}</p>
                ${selectedRequisicao.usuario.cargo ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">${selectedRequisicao.usuario.cargo}</p>` : ''}
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #374151;">${selectedRequisicao.usuario.email}</p>
              </div>
            ` : `
              <div>
                <h3 style="font-size: 12px; font-weight: 500; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Solicitante</h3>
                <p style="margin: 0; font-weight: 600; font-size: 14px;">${selectedRequisicao.usuario.nome}</p>
                ${selectedRequisicao.usuario.cargo ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">${selectedRequisicao.usuario.cargo}</p>` : ''}
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #374151;">${selectedRequisicao.usuario.email}</p>
              </div>
            `}
            
            <div>
              <h3 style="font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Data de Criação</h3>
              <p style="margin: 0; font-weight: 600; font-size: 14px;">${dataFormatada}</p>
            </div>
            
            <div>
              <h3 style="font-size: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Valor Total</h3>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #3b82f6;">${formatCurrency(selectedRequisicao.valor_total)}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h2 style="font-size: 18px; margin-bottom: 16px; font-weight: 600; color: #111827;">
            Itens da Requisição
          </h2>
          
          <div style="border: 2px solid #374151; border-radius: 8px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <th style="text-align: left; padding: 12px; font-weight: 600; color: #374151;">Produto</th>
                  <th style="text-align: left; padding: 12px; font-weight: 600; color: #374151;">Centro de Custo</th>
                  <th style="text-align: center; padding: 12px; font-weight: 600; color: #374151;">Qtd.</th>
                  <th style="text-align: right; padding: 12px; font-weight: 600; color: #374151;">Preço Unit.</th>
                  <th style="text-align: right; padding: 12px; font-weight: 600; color: #374151;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${selectedRequisicao.itens.map((item, index) => {
          const centroDeCusto = centrosDeCusto.find(c => c.id === (item.centroDeCusto || item.centro_de_custo));
          const subtotal = (item.valor_unitario || item.preco || 0) * item.quantidade;
          return `
                  <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;'}">
                    <td style="padding: 12px; vertical-align: top;">
                      <div style="font-weight: 500; margin-bottom: 2px;">${item.nome}</div>
                      ${item.codigo_material ? `<div style="font-size: 12px; color: #6b7280;">Código: ${item.codigo_material}</div>` : ''}
                    </td>
                    <td style="padding: 12px; vertical-align: top;">
                      <div style="font-weight: 500;">${centroDeCusto?.nome || item.centro_de_custo || 'Não informado'}</div>
                      ${centroDeCusto?.unidade ? `<div style="font-size: 12px; color: #6b7280;">${centroDeCusto.unidade}</div>` : ''}
                    </td>
                    <td style="text-align: center; padding: 12px; vertical-align: top; font-weight: 500;">
                      ${item.quantidade} ${item.unidade_de_medida || 'un'}
                    </td>
                    <td style="text-align: right; padding: 12px; vertical-align: top; font-weight: 500;">
                      ${formatCurrency(item.valor_unitario || item.preco || 0)}
                    </td>
                    <td style="text-align: right; padding: 12px; vertical-align: top; font-weight: 600;">
                      ${formatCurrency(subtotal)}
                    </td>
                  </tr>
                `;
        }).join('')}
              </tbody>
              <tfoot>
                <tr style="background-color: #f3f4f6; border-top: 2px solid #e5e7eb;">
                  <td colspan="2" style="text-align: right; padding: 12px; font-weight: 600; color: #374151;">Total</td>
                  <td style="text-align: center; padding: 12px; font-weight: 600; color: #374151;">${selectedRequisicao.itens.reduce((sum, item) => sum + item.quantidade, 0)}</td>
                  <td style="text-align: right; padding: 12px; font-weight: 600; color: #374151;">-</td>
                  <td style="text-align: right; padding: 12px; font-weight: bold; font-size: 16px; color: #3b82f6;">${formatCurrency(selectedRequisicao.valor_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;

      // Adicionar ao DOM temporariamente
      document.body.appendChild(comprovanteElement);

      // Configurações para ignorar erros
      const options = {
        skipFonts: true,
        filter: (node: Node) => {
          if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
            return false;
          }
          return true;
        },
        backgroundColor: 'white',
        cacheBust: true
      };

      // Converter para PNG ignorando erros
      const dataUrl = await toPng(comprovanteElement, options);

      // Remover o elemento temporário
      document.body.removeChild(comprovanteElement);

      // Criar link de download
      const link = document.createElement('a');
      link.download = `requisicao-${selectedRequisicao.requisicao_id}.png`;
      link.href = dataUrl;
      link.click();
      toast({
        title: "Comprovante exportado",
        description: `O comprovante da requisição ${selectedRequisicao.requisicao_id} foi gerado com sucesso.`
      });
    } catch (error) {
      console.error("Erro ao exportar comprovante:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o comprovante",
        variant: "destructive"
      });
    }
  };
  return <AppLayout title="Requisições">
      <div className="w-full h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 flex-1">
        {/* Sidebar lateral da página (lista de requisições) */}
        <div className="w-full md:w-[30%] lg:w-[25%] xl:w-96 space-y-4 flex flex-col h-full">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Requisições</h2>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar requisições..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          
          {/* Filtros de status */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={statusFilter === "todos" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("todos")} className="rounded-full">
              Todos
            </Button>
            <Button variant={statusFilter === "pendente" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("pendente")} className="rounded-full">
              Pendente
            </Button>
            <Button variant={statusFilter === "concluida" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("concluida")} className="rounded-full">
              Concluída
            </Button>
            <Button variant={statusFilter === "cancelada" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("cancelada")} className="rounded-full">
              Cancelada
            </Button>
          </div>

          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Total: {requisicoes.length}</span>
            
          </div>

          <ScrollArea className="h-full border rounded-md p-2 flex-1">
            {isLoading ? <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="p-3 border rounded-md">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>)}
              </div> : filteredRequisicoes.length === 0 ? <div className="text-center text-muted-foreground py-4">
                Nenhuma requisição encontrada
              </div> : <div className="space-y-2">
                {filteredRequisicoes.map(requisicao => <div key={requisicao.id} className={`p-3 border rounded-md cursor-pointer transition-all hover:bg-muted/50 ${selectedRequisicao?.id === requisicao.id ? "border-primary bg-primary/10 dark:bg-primary/20" : "border-border"}`} onClick={() => {
              setSelectedRequisicao(requisicao);
              if (requisicao.solicitante) {
                setSolicitanteSelecionado(requisicao.solicitante);
              }
            }}>
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
                  </div>)}
              </div>}
          </ScrollArea>
        </div>

        {/* Conteúdo principal da requisição selecionada */}
        <div className="flex-1 h-full overflow-auto">
          {!selectedRequisicao && !isLoading ? <Card className="w-full h-full flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <FileTextIcon className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-medium text-center">Nenhuma requisição selecionada</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Selecione uma requisição na lista para ver os detalhes.
                </p>
              </CardContent>
            </Card> : isLoading ? <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                  <Skeleton className="h-40 w-full" />
                </div>
              </CardContent>
            </Card> : <Card className="h-full">
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
              <CardContent className="flex-1 flex flex-col space-y-6">
                {/* Seção de Informações */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informações da Requisição
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Informações do solicitante */}
                    {selectedRequisicao.solicitante ? (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solicitante</Label>
                        <p className="font-semibold">{selectedRequisicao.solicitante.nome}</p>
                        {selectedRequisicao.solicitante.perfil && (
                          <p className="text-xs text-muted-foreground">{selectedRequisicao.solicitante.perfil}</p>
                        )}
                        {selectedRequisicao.solicitante.email && (
                          <p className="text-xs">{selectedRequisicao.solicitante.email}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-primary uppercase tracking-wide">Solicitante</Label>
                        <p className="font-semibold">{selectedRequisicao.usuario.nome}</p>
                        <p className="text-xs">{selectedRequisicao.usuario.email}</p>
                      </div>
                    )}
                    
                    {/* Informações do registrante (se diferente do solicitante) */}
                    {selectedRequisicao.solicitante && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registrado por</Label>
                        <p className="font-semibold">{selectedRequisicao.usuario.nome}</p>
                        {selectedRequisicao.usuario.cargo && (
                          <p className="text-xs text-muted-foreground">{selectedRequisicao.usuario.cargo}</p>
                        )}
                        <p className="text-xs">{selectedRequisicao.usuario.email}</p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data de Criação</Label>
                      <p className="font-semibold">{selectedRequisicao.data_criacao}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor Total</Label>
                      <p className="font-bold text-lg text-primary">
                        {formatCurrency(selectedRequisicao.valor_total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seção de Itens da Requisição */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-primary" />
                    Itens da Requisição ({selectedRequisicao.itens.length})
                  </h3>
                  {selectedRequisicao.itens.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                      <div>
                        <FileTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum item encontrado nesta requisição</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 border rounded-lg overflow-hidden">
                      <ScrollArea className="h-full max-h-[400px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-[35%]">Produto</TableHead>
                              <TableHead className="w-[20%]">Centro de Custo</TableHead>
                              <TableHead className="w-[15%]">Unidade</TableHead>
                              <TableHead className="w-[15%] text-right">Quantidade</TableHead>
                              <TableHead className="w-[15%] text-right">Valor Unit.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedRequisicao.itens.map((item, index) => {
                              const centroDeCusto = centrosDeCusto.find(c => c.id === (item.centroDeCusto || item.centro_de_custo));
                              return (
                                <TableRow key={`${item.nome}-${index}`} className="hover:bg-muted/50">
                                  <TableCell className="py-3">
                                    <div>
                                      <p className="font-medium">{item.nome}</p>
                                      {item.codigo_material && (
                                        <p className="text-xs text-muted-foreground">
                                          Código: {item.codigo_material}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <span className="text-sm">
                                      {centroDeCusto?.nome || item.centro_de_custo || 'Não informado'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <span className="text-sm">
                                      {centroDeCusto?.unidade || item.unidade || 'Não informado'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right py-3">
                                    <span className="font-medium">
                                      {item.quantidade}
                                      {item.unidade_de_medida && <span className="text-xs text-muted-foreground ml-1">{item.unidade_de_medida}</span>}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right py-3">
                                    <span className="font-medium">
                                      {formatCurrency(item.valor_unitario || item.preco || 0)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                          <TableFooter className="bg-muted/50">
                            <TableRow>
                              <TableCell colSpan={3} className="font-semibold">Total da Requisição</TableCell>
                              <TableCell className="text-right font-bold">
                                {selectedRequisicao.itens.reduce((sum, item) => sum + item.quantidade, 0)} itens
                              </TableCell>
                              <TableCell className="text-right font-bold text-primary">
                                {formatCurrency(selectedRequisicao.valor_total)}
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                {/* Seção de Ações */}
                <div className="flex-shrink-0 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleExportImage} 
                      className="flex items-center justify-center gap-2" 
                      disabled={isUpdating}
                    >
                      <Download className="h-4 w-4" />
                      Exportar Comprovante
                    </Button>
                    {selectedRequisicao.status === "pendente" && (
                      <>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelar} 
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-2"
                        >
                          {isUpdating ? "Processando..." : "Cancelar"}
                        </Button>
                        <Button 
                          variant="default" 
                          onClick={openFinalizarDialog} 
                          disabled={isUpdating}
                          className="flex items-center justify-center gap-2"
                        >
                          {isUpdating ? "Processando..." : "Finalizar"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>}
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
          
          {errosEstoque.length > 0 && <div className="bg-red-50 border border-red-200 rounded-md p-3 my-2 dark:bg-red-950 dark:border-red-900">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-600 dark:text-red-400">Problemas encontrados:</span>
              </div>
              <ul className="text-sm list-disc pl-5 text-red-600 dark:text-red-400">
                {errosEstoque.map((erro, index) => <li key={index}>{erro}</li>)}
              </ul>
            </div>}
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2 dark:bg-amber-950 dark:border-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-600 dark:text-amber-400">Itens que serão baixados do estoque:</span>
            </div>
            <ul className="text-sm mt-2 space-y-1">
              {selectedRequisicao?.itens.map((item, index) => <li key={index} className="flex justify-between">
                  <span>
                    {item.nome} ({item.codigo_material || "Sem código"})
                  </span>
                  <span className="font-medium">
                    {item.quantidade} {item.unidade || "un"}
                  </span>
                </li>)}
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
    </AppLayout>;
};
export default Requisicoes;