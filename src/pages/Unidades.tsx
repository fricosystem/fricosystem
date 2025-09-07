import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, Building2, Users, MapPin, Phone, RefreshCw } from "lucide-react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useUnidades } from "@/hooks/useUnidades";

interface Unidade {
  id: string;
  cnpj: string;
  criado_em: any;
  endereco: string;
  nome: string;
  razao_social: string;
  responsavel: string;
  telefone: string;
  status?: "Ativa" | "Inativa";
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Unidades = () => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [filteredUnidades, setFilteredUnidades] = useState<Unidade[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);
  const [formData, setFormData] = useState({
    cnpj: "",
    endereco: "",
    nome: "",
    razao_social: "",
    responsavel: "",
    telefone: "",
    status: "Ativa" as "Ativa" | "Inativa",
  });
  const { toast } = useToast();
  const { unidadesStats, loadingStats } = useUnidades();

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const unidadesRef = collection(db, "unidades");
      const q = query(unidadesRef, orderBy("criado_em", "desc"));
      const snapshot = await getDocs(q);
      
      const unidadesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "Ativa", // Status padrão
      } as Unidade));
      
      setUnidades(unidadesData);
      setFilteredUnidades(unidadesData);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    fetchUnidades();
  }, []);

  useEffect(() => {
    let filtered = unidades;

    if (searchTerm) {
      filtered = filtered.filter(unidade => 
        unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unidade.cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unidade.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unidade.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "todas") {
      filtered = filtered.filter(unidade => unidade.status === statusFilter);
    }

    setFilteredUnidades(filtered);
  }, [unidades, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = unidades.length;
    const ativas = unidades.filter(u => u.status === "Ativa").length;
    const inativas = unidades.filter(u => u.status === "Inativa").length;
    const comResponsavel = unidades.filter(u => u.responsavel && u.responsavel.trim() !== "").length;

    return {
      total,
      ativas,
      inativas,
      comResponsavel,
      semResponsavel: total - comResponsavel,
    };
  }, [unidades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUnidade) {
        const unidadeRef = doc(db, "unidades", editingUnidade.id);
        await updateDoc(unidadeRef, {
          ...formData,
        });
        toast({
          title: "Sucesso",
          description: "Unidade atualizada com sucesso!",
        });
      } else {
        await addDoc(collection(db, "unidades"), {
          ...formData,
          criado_em: serverTimestamp(),
        });
        toast({
          title: "Sucesso",
          description: "Unidade criada com sucesso!",
        });
      }
      
      setIsModalOpen(false);
      setEditingUnidade(null);
      resetForm();
      fetchUnidades();
    } catch (error) {
      console.error("Erro ao salvar unidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a unidade.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cnpj: "",
      endereco: "",
      nome: "",
      razao_social: "",
      responsavel: "",
      telefone: "",
      status: "Ativa",
    });
  };

  const handleEdit = (unidade: Unidade) => {
    setEditingUnidade(unidade);
    setFormData({
      cnpj: unidade.cnpj,
      endereco: unidade.endereco,
      nome: unidade.nome,
      razao_social: unidade.razao_social,
      responsavel: unidade.responsavel,
      telefone: unidade.telefone,
      status: unidade.status || "Ativa",
    });
    fetchUsuarios();
    setIsModalOpen(true);
  };

  const handleStatusChange = async (unidade: Unidade, newStatus: "Ativa" | "Inativa") => {
    try {
      const unidadeRef = doc(db, "unidades", unidade.id);
      await updateDoc(unidadeRef, {
        status: newStatus,
      });
      
      toast({
        title: "Sucesso",
        description: `Unidade ${newStatus === "Ativa" ? "ativada" : "desativada"} com sucesso!`,
      });
      
      fetchUnidades();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatTelefone = (telefone: string) => {
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  const renderUnidadeCard = (unidade: Unidade) => {
    return (
      <Card key={unidade.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{unidade.nome}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {unidade.razao_social}
              </p>
            </div>
            <Badge variant={unidade.status === "Ativa" ? "default" : "secondary"}>
              {unidade.status || "Ativa"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">CNPJ:</span>
              <span className="font-mono">{formatCNPJ(unidade.cnpj)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Telefone:</span>
              <span>{formatTelefone(unidade.telefone)}</span>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Endereço:</span>
                <p className="text-muted-foreground mt-1">{unidade.endereco}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Responsável:</span>
              <span>{unidade.responsavel}</span>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEdit(unidade)}
                className="flex-1"
              >
                Editar
              </Button>
              <Button 
                variant={unidade.status === "Ativa" ? "secondary" : "default"}
                size="sm" 
                onClick={() => handleStatusChange(unidade, unidade.status === "Ativa" ? "Inativa" : "Ativa")}
                className="flex-1"
              >
                {unidade.status === "Ativa" ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const chartData = unidadesStats?.distributionData || [];

  return (
    <AppLayout title="Gestão de Unidades">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total de Unidades"
            value={stats.total.toString()}
            icon={<Building2 className="h-4 w-4" />}
            description="Unidades cadastradas"
          />
          <StatsCard
            title="Unidades Ativas"
            value={stats.ativas.toString()}
            icon={<Building2 className="h-4 w-4" />}
            description="Em funcionamento"
          />
          <StatsCard
            title="Unidades Inativas"
            value={stats.inativas.toString()}
            icon={<Building2 className="h-4 w-4" />}
            description="Desativadas"
          />
          <StatsCard
            title="Com Responsável"
            value={stats.comResponsavel.toString()}
            icon={<Users className="h-4 w-4" />}
            description="Possuem responsável"
          />
          <StatsCard
            title="Sem Responsável"
            value={stats.semResponsavel.toString()}
            icon={<Users className="h-4 w-4" />}
            description="Necessitam atribuição"
          />
        </div>

        {/* Relatórios */}
        {!loadingStats && chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="transition-all duration-300 hover:bg-gray-900 dark:hover:bg-gray-800 hover:shadow-lg group cursor-pointer">
              <CardHeader>
                <CardTitle className="group-hover:text-white transition-colors duration-300">Distribuição de Produtos por Unidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="group-hover:opacity-50" />
                    <XAxis dataKey="unidade" className="group-hover:text-white" />
                    <YAxis className="group-hover:text-white" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="produtos" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="transition-all duration-300 hover:bg-gray-900 dark:hover:bg-gray-800 hover:shadow-lg group cursor-pointer">
              <CardHeader>
                <CardTitle className="group-hover:text-white transition-colors duration-300">Status das Unidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Ativas', value: stats.ativas },
                        { name: 'Inativas', value: stats.inativas }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {[
                        { name: 'Ativas', value: stats.ativas },
                        { name: 'Inativas', value: stats.inativas }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CNPJ, razão social..."
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
                <SelectItem value="todas">📋 Todas as Unidades</SelectItem>
                <SelectItem value="Ativa">✅ Unidades Ativas</SelectItem>
                <SelectItem value="Inativa">❌ Unidades Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchUnidades}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingUnidade(null);
                  resetForm();
                  fetchUsuarios();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Unidade
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingUnidade ? "Editar Unidade" : "Nova Unidade"}
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
                      <Label htmlFor="razao_social">Razão Social *</Label>
                      <Input
                        id="razao_social"
                        value={formData.razao_social}
                        onChange={(e) => setFormData({...formData, razao_social: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                        placeholder="00.000.000/0000-00"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                        placeholder="(00) 00000-0000"
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
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status}
                        onValueChange={(value: "Ativa" | "Inativa") => setFormData({...formData, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativa">Ativa</SelectItem>
                          <SelectItem value="Inativa">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Textarea
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingUnidade ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Unidades Grid */}
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredUnidades.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma unidade encontrada</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== "todas"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece criando sua primeira unidade."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnidades.map(renderUnidadeCard)}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Unidades;