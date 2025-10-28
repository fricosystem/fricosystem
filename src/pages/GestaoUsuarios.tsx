import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from '@/firebase/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/AppLayout';

// Definindo a interface Unidade
interface Unidade {
  id: string;
  nome: string;
}

// Definindo a interface CentroCusto
interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
  status: "Ativo" | "Inativo";
}

// Define Usuario interface internally
export interface Usuario {
  id?: string;
  ativo: string;
  email: string;
  imagem_perfil: string;
  nome: string;
  perfil: string;
  senha: string;
  unidade: string;
  centro_de_custo?: string;
  permissoes?: string[];
}

// Define permissions list
const PERMISSOES = [
  { id: 'dashboard', label: 'Dashboard Geral' },
  { id: 'ordens_compra', label: 'Ordens de Compra' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'inventario', label: 'Inventário' },
  { id: 'inventario_ciclico', label: 'Inventário Cíclico' },
  { id: 'entrada_manual', label: 'Entrada Manual' },
  { id: 'notas_fiscais', label: 'NF - Entrada XML' },
  { id: 'transferencia', label: 'Transferência' },
  { id: 'enderecamento', label: 'Endereçamento' },
  { id: 'medida_lenha', label: 'Medida de Lenha' },
  { id: 'pcp', label: 'PCP - Planejamento e Controle de Produção' },
  { id: 'requisicoes', label: 'Requisições' },
  { id: 'carrinho', label: 'Carrinho' },
  { id: 'ordens_servico', label: 'Ordens de Serviço' },
  { id: 'devolucoes', label: 'Devoluções' },
  { id: 'compras', label: 'Compras' },
  { id: 'cotacoes_orcamentos', label: 'Cotações e Orçamentos' },
  { id: 'rastreamento_entregas', label: 'Rastreamento de Entregas' },
  { id: 'calendario_recebimento', label: 'Calendário de Recebimento' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'notas_fiscais_lancamento', label: 'NF - Lançamento' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'relatorios_financeiros', label: 'Relatórios Financeiros' },
  { id: 'importar_dados', label: 'Importar dados' },
  { id: 'exportar_dados', label: 'Exportar dados' },
  { id: 'backup_dados', label: 'Backup/Restauração' },
  { id: 'tudo', label: 'Acesso Total (todas as permissões)' },
];

// Firebase service functions
const usuarioService = {
  async buscarTodos(): Promise<Usuario[]> {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Usuario));
  },

  async buscarPorId(id: string): Promise<Usuario | null> {
    const docRef = doc(db, "usuarios", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Usuario;
    }
    return null;
  },

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const q = query(collection(db, "usuarios"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Usuario;
    }
    return null;
  },

  async criar(usuario: Omit<Usuario, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "usuarios"), usuario);
    return docRef.id;
  },

  async atualizar(id: string, usuario: Partial<Usuario>): Promise<void> {
    const docRef = doc(db, "usuarios", id);
    await updateDoc(docRef, usuario);
  },

  async deletar(id: string): Promise<void> {
    const docRef = doc(db, "usuarios", id);
    await deleteDoc(docRef);
  }
};

const unidadeService = {
  async buscarTodos(): Promise<Unidade[]> {
    const querySnapshot = await getDocs(collection(db, "unidades"));
    const unidades = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Unidade));
    return unidades.sort((a, b) => a.nome.localeCompare(b.nome));
  },
};

const centroCustoService = {
  async buscarTodos(): Promise<CentroCusto[]> {
    const querySnapshot = await getDocs(collection(db, "centro_de_custo"));
    const centros = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CentroCusto))
      .filter(centro => centro.status === "Ativo");
    return centros.sort((a, b) => a.nome.localeCompare(b.nome));
  },
};

const UsuarioForm = ({
  usuario,
  onSubmit,
  onCancel,
  isLoading,
  unidades,
  centrosCusto,
}: {
  usuario?: Usuario;
  onSubmit: (usuario: Omit<Usuario, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  unidades: Unidade[];
  centrosCusto: CentroCusto[];
}) => {
  const [formData, setFormData] = useState<Omit<Usuario, 'id'>>({
    ativo: usuario?.ativo || 'sim',
    email: usuario?.email || '',
    imagem_perfil: usuario?.imagem_perfil || '',
    nome: usuario?.nome || '',
    perfil: usuario?.perfil || 'usuario',
    senha: usuario?.senha || '',
    unidade: usuario?.unidade || '',
    centro_de_custo: usuario?.centro_de_custo || '',
    permissoes: usuario?.permissoes || [],
  });

  const [selectedPermissoes, setSelectedPermissoes] = useState<string[]>(usuario?.permissoes || []);

  useEffect(() => {
    if (usuario) {
      setFormData({
        ativo: usuario.ativo,
        email: usuario.email,
        imagem_perfil: usuario.imagem_perfil,
        nome: usuario.nome,
        perfil: usuario.perfil,
        senha: usuario.senha,
        unidade: usuario.unidade,
        centro_de_custo: usuario.centro_de_custo || '',
        permissoes: usuario.permissoes || [],
      });
      setSelectedPermissoes(usuario.permissoes || []);
    }
  }, [usuario]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, perfil: value }));
  };

  const handleUnidadeChange = (value: string) => {
    setFormData(prev => ({ ...prev, unidade: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, ativo: value }));
  };

  const handleCentroCustoChange = (value: string) => {
    setFormData(prev => ({ ...prev, centro_de_custo: value }));
  };

  const handlePermissaoChange = (permissaoId: string, isChecked: boolean) => {
    if (permissaoId === 'tudo') {
      if (isChecked) {
        setSelectedPermissoes(['tudo']);
      } else {
        setSelectedPermissoes([]);
      }
    } else {
      if (isChecked) {
        setSelectedPermissoes(prev => [...prev.filter(p => p !== 'tudo'), permissaoId]);
      } else {
        setSelectedPermissoes(prev => prev.filter(p => p !== permissaoId));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...formData, permissoes: selectedPermissoes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            name="senha"
            type="text"
            value={formData.senha}
            onChange={handleChange}
            required={!usuario}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perfil">Perfil</Label>
          <Select value={formData.perfil} onValueChange={handleSelectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESENVOLVEDOR">DESENVOLVEDOR</SelectItem>
              <SelectItem value="ADMINISTRATIVO">ADMINISTRATIVO</SelectItem>
              <SelectItem value="ENCARREGADO">ENCARREGADO</SelectItem>
              <SelectItem value="COLABORADOR">COLABORADOR</SelectItem>
              <SelectItem value="ESTOQUISTA">ESTOQUISTA</SelectItem>
              <SelectItem value="LÍDER">LÍDER</SelectItem>
              <SelectItem value="PRESIDENTE">PRESIDENTE</SelectItem>
              <SelectItem value="GERENTE">GERENTE</SelectItem>
              <SelectItem value="FORNECEDOR">FORNECEDOR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Select value={formData.unidade} onValueChange={handleUnidadeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              {unidades.map(unidade => (
                <SelectItem key={unidade.id} value={unidade.nome}>
                  {unidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={formData.ativo} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="centro_de_custo">Centro de Custo</Label>
          <Select value={formData.centro_de_custo} onValueChange={handleCentroCustoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o centro de custo" />
            </SelectTrigger>
            <SelectContent>
              {centrosCusto.map(centro => (
                <SelectItem key={centro.id} value={centro.nome}>
                  {centro.nome} ({centro.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Permissões</Label>
        <div className="border rounded-md p-6 m-2">
          <ScrollArea className="h-64">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
              {PERMISSOES.map(permissao => (
                <div key={permissao.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`permissao-${permissao.id}`}
                    checked={
                      permissao.id === 'tudo' 
                        ? selectedPermissoes.includes('tudo')
                        : selectedPermissoes.includes(permissao.id) || selectedPermissoes.includes('tudo')
                    }
                    onCheckedChange={(checked) => 
                      handlePermissaoChange(permissao.id, checked as boolean)
                    }
                    disabled={permissao.id !== 'tudo' && selectedPermissoes.includes('tudo')}
                  />
                  <Label htmlFor={`permissao-${permissao.id}`}>{permissao.label}</Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPerfil, setFiltroPerfil] = useState<string>("todos");
  const [filtroUnidade, setFiltroUnidade] = useState<string>("todas");
  const [filtroCentroCusto, setFiltroCentroCusto] = useState<string>("todos");

  const { toast } = useToast();

  useEffect(() => {
    carregarUsuarios();
    carregarUnidades();
    carregarCentrosCusto();
  }, []);

  useEffect(() => {
    let filtered = usuarios;

    // Filtro de busca por texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(usuario => {
        const nome = usuario.nome || '';
        const email = usuario.email || '';
        const unidade = usuario.unidade || '';
        const centroCusto = usuario.centro_de_custo || '';
        
        return nome.toLowerCase().includes(searchLower) ||
               email.toLowerCase().includes(searchLower) ||
               unidade.toLowerCase().includes(searchLower) ||
               centroCusto.toLowerCase().includes(searchLower);
      });
    }

    // Filtro por Status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(usuario => usuario.ativo === statusFilter);
    }

    // Filtro por Perfil
    if (filtroPerfil !== 'todos') {
      filtered = filtered.filter(usuario => usuario.perfil === filtroPerfil);
    }

    // Filtro por Unidade
    if (filtroUnidade !== 'todas') {
      filtered = filtered.filter(usuario => usuario.unidade === filtroUnidade);
    }

    // Filtro por Centro de Custo
    if (filtroCentroCusto !== 'todos') {
      filtered = filtered.filter(usuario => usuario.centro_de_custo === filtroCentroCusto);
    }

    setFilteredUsuarios(filtered);
  }, [usuarios, searchTerm, statusFilter, filtroPerfil, filtroUnidade, filtroCentroCusto]);

  const carregarUsuarios = async () => {
    try {
      setIsLoading(true);
      const data = await usuarioService.buscarTodos();
      setUsuarios(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const carregarUnidades = async () => {
    try {
      const data = await unidadeService.buscarTodos();
      setUnidades(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar unidades",
        variant: "destructive"
      });
    }
  };

  const carregarCentrosCusto = async () => {
    try {
      const data = await centroCustoService.buscarTodos();
      setCentrosCusto(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar centros de custo",
        variant: "destructive"
      });
    }
  };

  const handleSubmitForm = async (dadosUsuario: Omit<Usuario, 'id'>) => {
    try {
      setIsSubmitting(true);
      
      if (editingUsuario) {
        await usuarioService.atualizar(editingUsuario.id!, dadosUsuario);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!"
        });
      } else {
        await usuarioService.criar(dadosUsuario);
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso!"
        });
      }
      
      await carregarUsuarios();
      setIsFormOpen(false);
      setEditingUsuario(undefined);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar usuário",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingUserId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUserId) return;
    try {
      await usuarioService.deletar(deletingUserId);
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!"
      });
      await carregarUsuarios();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive"
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingUsuario(undefined);
  };

  return (
    <AppLayout title="Gestão de Usuários">
        <div className="h-full px-4 py-6 lg:px-8">
        {/* Card principal - agora com height full */}
        <Card className="h-full">
            <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
            <CardDescription>
                Gerencie todos os usuários do sistema
            </CardDescription>
            
            {/* Controles */}
            <div className="space-y-4 pt-4">
              {/* Barra de busca e botão */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>

              {/* Filtros com labels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="filtro-status" className="text-xs text-muted-foreground mb-1.5 block">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="filtro-status" className="w-full">
                      <SelectValue placeholder="Todos os Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="sim">Ativo</SelectItem>
                      <SelectItem value="nao">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filtro-perfil" className="text-xs text-muted-foreground mb-1.5 block">
                    Perfil
                  </Label>
                  <Select value={filtroPerfil} onValueChange={setFiltroPerfil}>
                    <SelectTrigger id="filtro-perfil" className="w-full">
                      <SelectValue placeholder="Todos os Perfis" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="todos">Todos os Perfis</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="visitante">Visitante</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filtro-unidade" className="text-xs text-muted-foreground mb-1.5 block">
                    Unidade
                  </Label>
                  <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                    <SelectTrigger id="filtro-unidade" className="w-full">
                      <SelectValue placeholder="Todas as Unidades" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="todas">Todas as Unidades</SelectItem>
                      {unidades.map((unidade) => (
                        <SelectItem key={unidade.id} value={unidade.nome}>
                          {unidade.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="filtro-centro-custo" className="text-xs text-muted-foreground mb-1.5 block">
                    Centro de Custo
                  </Label>
                  <Select value={filtroCentroCusto} onValueChange={setFiltroCentroCusto}>
                    <SelectTrigger id="filtro-centro-custo" className="w-full">
                      <SelectValue placeholder="Todos os Centros" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="todos">Todos os Centros</SelectItem>
                      {centrosCusto.map((centro) => (
                        <SelectItem key={centro.id} value={centro.nome}>
                          {centro.nome} ({centro.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            </CardHeader>

            <CardContent className="h-[calc(100%-180px)] overflow-auto">
            {isLoading ? (
                <div className="h-full flex items-center justify-center">Carregando usuários...</div>
            ) : (
                <div className="h-full overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Centro de Custo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredUsuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                        <TableCell className="font-medium uppercase">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell className="capitalize">{usuario.perfil}</TableCell>
                        <TableCell>{usuario.unidade}</TableCell>
                        <TableCell className="capitalize">{usuario.centro_de_custo || '-'}</TableCell>
                        <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                            usuario.ativo === 'sim' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {usuario.ativo === 'sim' ? 'Ativo' : 'Inativo'}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(usuario)}
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRequest(usuario.id!)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                
                {filteredUsuarios.length === 0 && !isLoading && (
                    <div className="h-full flex items-center justify-center text-gray-500">
                    Nenhum usuário encontrado
                    </div>
                )}
                </div>
            )}
            </CardContent>
        </Card>
        </div>

        {/* Dialog do formulário */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
            <DialogTitle>
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
                {editingUsuario 
                ? 'Edite os dados do usuário abaixo' 
                : 'Preencha os dados para criar um novo usuário'
                }
            </DialogDescription>
            </DialogHeader>
            <UsuarioForm
          usuario={editingUsuario}
          onSubmit={handleSubmitForm}
          onCancel={handleCancel}
          isLoading={isSubmitting}
          unidades={unidades}
          centrosCusto={centrosCusto}
            />
        </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUserId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </AppLayout>
    );
};

export default GestaoUsuarios;