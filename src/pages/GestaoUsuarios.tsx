import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { Perfil } from './GestaoPerfis';
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
  unidade?: string;
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
  // Ordenado alfabeticamente por label
  { id: 'backup_dados', label: 'Backup/Restauração' },
  { id: 'calendario_recebimento', label: 'Calendário de Recebimento' },
  { id: 'carrinho', label: 'Carrinho' },
  { id: 'centro_custo', label: 'Centro de Custo' },
  { id: 'chat', label: 'Chat' },
  { id: 'compras', label: 'Compras' },
  { id: 'cotacoes_orcamentos', label: 'Cotações e Orçamentos' },
  { id: 'medida_lenha', label: 'Cubagem e Medida de Lenha' },
  { id: 'dashboard', label: 'Dashboard Geral' },
  { id: 'manutencoes_dashboard', label: 'Dashboard Manutenção' },
  { id: 'devolucoes', label: 'Devoluções' },
  { id: 'email', label: 'Email' },
  { id: 'enderecamento', label: 'Endereçamento' },
  { id: 'entrada_manual', label: 'Entrada Manual' },
  { id: 'execucao_preventiva', label: 'Execução Preventiva' },
  { id: 'exportar_dados', label: 'Exportar dados' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'gestao_manutencao', label: 'Gestão de Manutenção' },
  { id: 'gestao_perfis', label: 'Gestão de Perfis' },
  { id: 'gestao_produtos', label: 'Gestão de Produtos' },
  { id: 'gestao_tarefas', label: 'Gestão de Tarefas' },
  { id: 'gestao_unidades', label: 'Gestão de Unidades' },
  { id: 'gestao_usuarios', label: 'Gestão de Usuários' },
  { id: 'ide', label: 'IDE - Ambiente de Desenvolvimento' },
  { id: 'importar_dados', label: 'Importar dados' },
  { id: 'inventario', label: 'Inventário' },
  { id: 'inventario_ciclico', label: 'Inventário Cíclico' },
  { id: 'manuais', label: 'Manuais' },
  { id: 'manutencao_preventiva', label: 'Manutenção Preventiva' },
  { id: 'maquinas', label: 'Máquinas' },
  { id: 'notas_fiscais', label: 'NF - Entrada XML' },
  { id: 'notas_fiscais_lancamento', label: 'NF - Lançamento' },
  { id: 'ordens_compra', label: 'Ordens de Compra' },
  { id: 'ordens_servico', label: 'Ordens de Serviço' },
  { id: 'parada_maquina', label: 'Parada de Máquina' },
  { id: 'pcp', label: 'PCP - Planejamento e Controle de Produção' },
  { id: 'planejamento_desenvolvimento', label: 'Planejamento de Desenvolvimento' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'rastreamento_entregas', label: 'Rastreamento de Entregas' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'relatorios_financeiros', label: 'Relatórios Financeiros' },
  { id: 'requisicoes', label: 'Requisições' },
  { id: 'reunioes', label: 'Reuniões' },
  { id: 'transferencia', label: 'Transferência' },
  // Acesso Total sempre no final
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
    const centros = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CentroCusto));
    return centros.sort((a, b) => a.nome.localeCompare(b.nome));
  },
};

const perfilService = {
  async buscarTodos(): Promise<Perfil[]> {
    const querySnapshot = await getDocs(collection(db, "perfis"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Perfil));
  },
};

const UsuarioForm = ({
  usuario,
  onSubmit,
  onCancel,
  isLoading,
  unidades,
  centrosCusto,
  perfis,
}: {
  usuario?: Usuario;
  onSubmit: (usuario: Omit<Usuario, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  unidades: Unidade[];
  centrosCusto: CentroCusto[];
  perfis: Perfil[];
}) => {
  const [formData, setFormData] = useState<Omit<Usuario, 'id'>>({
    ativo: usuario?.ativo || 'sim',
    email: usuario?.email || '',
    imagem_perfil: usuario?.imagem_perfil || '',
    nome: usuario?.nome || '',
    perfil: usuario?.perfil || '',
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
    
    // Carregar configurações do perfil selecionado
    const perfilSelecionado = perfis.find(p => p.nome === value);
    if (perfilSelecionado) {
      setFormData(prev => ({
        ...prev,
        perfil: value,
        unidade: perfilSelecionado.unidade || prev.unidade,
        centro_de_custo: perfilSelecionado.centro_de_custo || prev.centro_de_custo,
        ativo: perfilSelecionado.ativo ? 'sim' : 'nao',
      }));
      setSelectedPermissoes(perfilSelecionado.permissoes || []);
    }
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
              {perfis.filter(p => p.ativo).map(perfil => (
                <SelectItem key={perfil.id} value={perfil.nome}>
                  {perfil.nome}
                </SelectItem>
              ))}
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
                  {centro.unidade ? `${centro.unidade} - ${centro.nome}` : centro.nome}
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
  const [perfis, setPerfis] = useState<Perfil[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    carregarUsuarios();
    carregarUnidades();
    carregarCentrosCusto();
    carregarPerfis();
  }, []);

  useEffect(() => {
    const filtered = usuarios.filter(usuario => {
      const nome = usuario.nome || '';
      const email = usuario.email || '';
      const unidade = usuario.unidade || '';
      const centroCusto = usuario.centro_de_custo || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = nome.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower) ||
             unidade.toLowerCase().includes(searchLower) ||
             centroCusto.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'todos' || usuario.ativo === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    setFilteredUsuarios(filtered);
  }, [usuarios, searchTerm, statusFilter]);

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

  const carregarPerfis = async () => {
    try {
      const data = await perfilService.buscarTodos();
      setPerfis(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis",
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
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Ativo</SelectItem>
                    <SelectItem value="nao">Inativo</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
                </Button>
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
            perfis={perfis}
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