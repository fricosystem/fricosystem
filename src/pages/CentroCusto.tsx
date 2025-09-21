import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Briefcase, TrendingDown, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatsCard from "@/components/StatsCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useCentroCustoCalculos } from "@/hooks/useCentroCustoCalculos";

interface CentroCusto {
  id: string;
  nome: string;
  unidade: string;
  codigo: string;
  valorTotal: number;
  valorUtilizado: number;
  responsavel: string;
  status: "Ativo" | "Inativo";
  valorMinimoAlerta: number;
  dataCriacao: any;
  dataAtualizacao: any;
  descricao?: string;
}

// Gradientes para os gráficos
const GRADIENT_GREEN = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
const GRADIENT_RED = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
const GRADIENT_GREEN_SOLID = '#22c55e';
const GRADIENT_RED_SOLID = '#ef4444';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

const CentroCusto = () => {
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [filteredCentros, setFilteredCentros] = useState<CentroCusto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [unidadeFilter, setUnidadeFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCentro, setEditingCentro] = useState<CentroCusto | null>(null);
  const [atualizandoCalculos, setAtualizandoCalculos] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    unidade: "",
    codigo: "",
    valorTotal: 0,
    valorUtilizado: 0,
    responsavel: "",
    status: "Ativo" as "Ativo" | "Inativo",
    valorMinimoAlerta: 0,
    descricao: "",
  });
  const { toast } = useToast();
  const { 
    centrosCalculados, 
    loading: loadingCalculos, 
    calcularValoresEntrada,
    atualizarCentrosCustoFirestore 
  } = useCentroCustoCalculos();

  const fetchCentrosCusto = async () => {
    try {
      setLoading(true);
      const centrosRef = collection(db, "centro_de_custo");
      const q = query(centrosRef, orderBy("dataCriacao", "desc"));
      const snapshot = await getDocs(q);
      
      let centrosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        valorUtilizado: 0, // Será recalculado automaticamente
      } as CentroCusto));

      // Aplicar cálculos automáticos baseados nos relatórios
      if (centrosCalculados.length > 0) {
        centrosData = centrosData.map(centro => {
          const centroCalculado = centrosCalculados.find(calc => 
            calc.id === centro.id || 
            (calc.nome === centro.nome && calc.unidade === centro.unidade)
          );
          if (centroCalculado) {
            return {
              ...centro,
              valorUtilizado: centroCalculado.valorUtilizado
            };
          }
          return centro;
        });
      }
      
      setCentrosCusto(centrosData);
      setFilteredCentros(centrosData);
    } catch (error) {
      console.error("Erro ao buscar centros de custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os centros de custo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarCalculosAutomaticos = async () => {
    try {
      setAtualizandoCalculos(true);
      
      // Recalcular valores baseados nas entradas
      await calcularValoresEntrada();
      
      // Atualizar no Firestore
      await atualizarCentrosCustoFirestore();
      
      // Recarregar dados
      await fetchCentrosCusto();
      
      toast({
        title: "Cálculos atualizados",
        description: "Os valores utilizados foram atualizados com base nas entradas registradas.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao atualizar cálculos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os cálculos automáticos.",
        variant: "destructive",
      });
    } finally {
      setAtualizandoCalculos(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, orderBy("nome", "asc"));
      const snapshot = await getDocs(q);
      
      const usuariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || doc.data().email,
        email: doc.data().email,
        cargo: doc.data().cargo,
      } as Usuario));
      
      setUsuarios(usuariosData);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    fetchCentrosCusto();
  }, []);

  // Atualizar dados automaticamente quando os cálculos ficarem prontos
  useEffect(() => {
    if (!loadingCalculos && centrosCalculados.length > 0) {
      // Aplicar cálculos em tempo real sem nova busca no firestore
      setCentrosCusto(currentCentros => 
        currentCentros.map(centro => {
          const centroCalculado = centrosCalculados.find(calc => 
            calc.id === centro.id || 
            (calc.nome === centro.nome && calc.unidade === centro.unidade)
          );
          if (centroCalculado) {
            return {
              ...centro,
              valorUtilizado: centroCalculado.valorUtilizado
            };
          }
          return centro;
        })
      );
    }
  }, [loadingCalculos, centrosCalculados]);

  // Recalcular automaticamente ao carregar a página
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadingCalculos) {
        calcularValoresEntrada();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [calcularValoresEntrada, loadingCalculos]);

  useEffect(() => {
    let filtered = centrosCusto;

    if (searchTerm) {
      filtered = filtered.filter(centro => 
        centro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centro.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        centro.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter(centro => centro.status === statusFilter);
    }

    if (unidadeFilter !== "todas") {
      filtered = filtered.filter(centro => centro.unidade === unidadeFilter);
    }

    setFilteredCentros(filtered);
  }, [centrosCusto, searchTerm, statusFilter, unidadeFilter]);

  const stats = useMemo(() => {
    const total = centrosCusto.length;
    const ativos = centrosCusto.filter(c => c.status === "Ativo").length;
    const valorTotalGeral = centrosCusto.reduce((acc, c) => acc + c.valorTotal, 0);
    const valorUtilizadoGeral = centrosCusto.reduce((acc, c) => acc + c.valorUtilizado, 0);
    const centrosEmAlerta = centrosCusto.filter(c => 
      c.status === "Ativo" && (c.valorTotal - c.valorUtilizado) <= c.valorMinimoAlerta
    ).length;

    return {
      total,
      ativos,
      valorTotalGeral,
      valorUtilizadoGeral,
      saldoDisponivel: valorTotalGeral - valorUtilizadoGeral,
      centrosEmAlerta,
    };
  }, [centrosCusto]);

  const unidades = useMemo(() => {
    const uniqueUnidades = [...new Set(centrosCusto.map(c => c.unidade))];
    return uniqueUnidades.sort();
  }, [centrosCusto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCentro) {
        const centroRef = doc(db, "centro_de_custo", editingCentro.id);
        await updateDoc(centroRef, {
          ...formData,
          dataAtualizacao: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Centro de custo atualizado com sucesso!",
        });
      } else {
        await addDoc(collection(db, "centro_de_custo"), {
          ...formData,
          dataCriacao: serverTimestamp(),
          dataAtualizacao: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Centro de custo criado com sucesso!",
        });
      }
      
      setIsModalOpen(false);
      setEditingCentro(null);
      resetForm();
      fetchCentrosCusto();
    } catch (error) {
      console.error("Erro ao salvar centro de custo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o centro de custo.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      unidade: "",
      codigo: "",
      valorTotal: 0,
      valorUtilizado: 0,
      responsavel: "",
      status: "Ativo",
      valorMinimoAlerta: 0,
      descricao: "",
    });
  };

  const handleEdit = (centro: CentroCusto) => {
    setEditingCentro(centro);
    setFormData({
      nome: centro.nome,
      unidade: centro.unidade,
      codigo: centro.codigo,
      valorTotal: centro.valorTotal,
      valorUtilizado: centro.valorUtilizado,
      responsavel: centro.responsavel,
      status: centro.status,
      valorMinimoAlerta: centro.valorMinimoAlerta,
      descricao: centro.descricao || "",
    });
    fetchUsuarios();
    setIsModalOpen(true);
  };

  const handleStatusChange = async (centro: CentroCusto, newStatus: "Ativo" | "Inativo") => {
    try {
      const centroRef = doc(db, "centro_de_custo", centro.id);
      await updateDoc(centroRef, {
        status: newStatus,
        dataAtualizacao: serverTimestamp(),
      });
      
      toast({
        title: "Sucesso",
        description: `Centro de custo ${newStatus === "Ativo" ? "ativado" : "desativado"} com sucesso!`,
      });
      
      fetchCentrosCusto();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const renderCentroCard = (centro: CentroCusto) => {
    const saldoDisponivel = centro.valorTotal - centro.valorUtilizado;
    const percentualUtilizado = centro.valorTotal > 0 ? (centro.valorUtilizado / centro.valorTotal) * 100 : 0;
    const isEmAlerta = centro.status === "Ativo" && saldoDisponivel <= centro.valorMinimoAlerta;
    
    const chartData = [
      { name: 'Utilizado', value: centro.valorUtilizado },
      { name: 'Disponível', value: saldoDisponivel }
    ];

    return (
      <Card key={centro.id} className={`relative ${isEmAlerta ? 'border-destructive' : ''}`}>
        {isEmAlerta && (
          <div className="absolute -top-2 -right-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alerta
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{centro.nome}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {centro.codigo} • {centro.unidade}
              </p>
            </div>
            <Badge variant={centro.status === "Ativo" ? "default" : "secondary"}>
              {centro.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Valor Total</p>
              <p className="font-semibold text-lg">
                R$ {centro.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Valor Utilizado</p>
              <p className="font-semibold text-lg">
                R$ {centro.valorUtilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo Disponível</span>
              <span className={`font-semibold ${isEmAlerta ? 'text-destructive' : 'text-primary'}`}>
                R$ {saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {/* Informação do valor mínimo de alerta */}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Limite Mínimo</span>
              <span className={`${isEmAlerta ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                R$ {centro.valorMinimoAlerta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {/* Alerta visual quando em alerta */}
            {isEmAlerta && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-2 text-xs text-destructive">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Atenção!</span>
                </div>
                <p className="mt-1">
                  Saldo disponível (R$ {saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) 
                  está igual ou abaixo do limite mínimo.
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
                  <div 
                    className="h-3 rounded-full transition-all duration-300 ease-in-out"
                    style={{ 
                      width: `${Math.min(percentualUtilizado, 100)}%`,
                      background: isEmAlerta ? GRADIENT_RED : GRADIENT_RED,
                      boxShadow: isEmAlerta ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(239, 68, 68, 0.2)'
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {percentualUtilizado.toFixed(1)}% utilizado
                </p>
              </div>
              
              <div className="w-16 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={12}
                      outerRadius={24}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => {
                        // Vermelho para utilizado (index 0), Verde para disponível (index 1)
                        const fillColor = index === 0 ? 'url(#redGradient)' : 'url(#greenGradient)';
                        return <Cell key={`cell-${index}`} fill={fillColor} stroke="none" />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        ''
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Responsável:</strong> {centro.responsavel}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleEdit(centro)}
              className="flex-1"
            >
              Editar
            </Button>
            <Button 
              variant={centro.status === "Ativo" ? "secondary" : "default"}
              size="sm" 
              onClick={() => handleStatusChange(centro, centro.status === "Ativo" ? "Inativo" : "Ativo")}
              className="flex-1"
            >
              {centro.status === "Ativo" ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout title="Centro de Custo">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de Centros"
            value={stats.total.toString()}
            icon={<Briefcase className="h-4 w-4" />}
            description="Centros cadastrados"
          />
          <StatsCard
            title="Centros Ativos"
            value={stats.ativos.toString()}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Em funcionamento"
          />
          <StatsCard
            title="Valor Total"
            value={`R$ ${stats.valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Orçamento total"
          />
          <StatsCard
            title="Saldo Disponível"
            value={`R$ ${stats.saldoDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingDown className="h-4 w-4" />}
            description="Não utilizado"
          />
          <StatsCard
            title="Alertas"
            value={stats.centrosEmAlerta.toString()}
            icon={<AlertTriangle className="h-4 w-4" />}
            description="Saldo abaixo do mínimo"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, código ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-52">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Centros Ativos</SelectItem>
                <SelectItem value="Inativo">Centros Inativos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={unidadeFilter} onValueChange={setUnidadeFilter}>
              <SelectTrigger className="w-52">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Unidades</SelectItem>
                {unidades
                  .filter(unidade => unidade && unidade.trim() !== "")
                  .map(unidade => (
                    <SelectItem key={unidade} value={unidade}>
                      {unidade}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={atualizarCalculosAutomaticos}
              disabled={atualizandoCalculos}
            >
              {atualizandoCalculos ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Cálculos
            </Button>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCentro(null);
                  resetForm();
                  fetchUsuarios();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Centro de Custo
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCentro ? "Editar Centro de Custo" : "Novo Centro de Custo"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unidade">Unidade *</Label>
                      <Input
                        id="unidade"
                        value={formData.unidade}
                        onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="responsavel">Responsável *</Label>
                      <Select 
                        value={formData.responsavel}
                        onValueChange={(value) => setFormData({...formData, responsavel: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingUsuarios ? (
                            <SelectItem value="loading" disabled>Carregando...</SelectItem>
                          ) : (
                            usuarios
                              .filter(usuario => usuario.nome && usuario.nome.trim() !== "")
                              .map(usuario => (
                                <SelectItem key={usuario.id} value={usuario.nome}>
                                  {usuario.nome}
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
                      <Input
                        id="valorTotal"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valorTotal}
                        onChange={(e) => setFormData({...formData, valorTotal: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valorMinimoAlerta">Valor Mínimo de Alerta (R$)</Label>
                      <Input
                        id="valorMinimoAlerta"
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.valorTotal}
                        value={formData.valorMinimoAlerta}
                        onChange={(e) => setFormData({...formData, valorMinimoAlerta: parseFloat(e.target.value) || 0})}
                        placeholder="Ex: 400.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Alerta quando o saldo disponível for igual ou menor que este valor. 
                        {formData.valorTotal > 0 && formData.valorMinimoAlerta > 0 && (
                          <span className="block mt-1">
                            <strong>Exemplo:</strong> Com valor total de R$ {formData.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, 
                            entrará em alerta quando o saldo for ≤ R$ {formData.valorMinimoAlerta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status}
                        onValueChange={(value: "Ativo" | "Inativo") => setFormData({...formData, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCentro ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Centers Grid */}
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCentros.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum centro de custo encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "todos" || unidadeFilter !== "todas"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece criando seu primeiro centro de custo."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCentros.map(renderCentroCard)}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CentroCusto;