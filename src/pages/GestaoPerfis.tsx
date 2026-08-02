import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
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
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/AppLayout';

export interface Perfil {
  id?: string;
  nome: string;
  ativo: boolean;
  unidade: string;
  centro_de_custo: string;
  permissoes: string[];
}

interface Unidade {
  id: string;
  nome: string;
}

interface CentroCusto {
  id: string;
  nome: string;
  unidade?: string;
}

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
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'maquinas', label: 'Máquinas' },
  { id: 'manutencao_preventiva', label: 'Manutenção Preventiva' },
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
  { id: 'centro_custo', label: 'Centro de Custo' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'relatorios_financeiros', label: 'Relatórios Financeiros' },
  { id: 'importar_dados', label: 'Importar dados' },
  { id: 'exportar_dados', label: 'Exportar dados' },
  { id: 'backup_dados', label: 'Backup/Restauração' },
  { id: 'chat', label: 'Chat' },
  { id: 'email', label: 'Email' },
  { id: 'reunioes', label: 'Reuniões' },
  { id: 'gestao_usuarios', label: 'Gestão de Usuários' },
  { id: 'gestao_perfis', label: 'Gestão de Perfis' },
  { id: 'gestao_produtos', label: 'Gestão de Produtos' },
  { id: 'gestao_unidades', label: 'Gestão de Unidades' },
  { id: 'gestao_tarefas', label: 'Gestão de Tarefas' },
  { id: 'planejamento_desenvolvimento', label: 'Planejamento de Desenvolvimento' },
  { id: 'ide', label: 'IDE - Ambiente de Desenvolvimento' },
  { id: 'tudo', label: 'Acesso Total (todas as permissões)' },
];

const perfilService = {
  async buscarTodos(): Promise<Perfil[]> {
    const querySnapshot = await getDocs(collection(db, "perfis"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Perfil));
  },

  async criar(perfil: Omit<Perfil, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, "perfis"), perfil);
    return docRef.id;
  },

  async atualizar(id: string, perfil: Partial<Perfil>): Promise<void> {
    const docRef = doc(db, "perfis", id);
    await updateDoc(docRef, perfil);
  },

  async deletar(id: string): Promise<void> {
    const docRef = doc(db, "perfis", id);
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

const PerfilForm = ({
  perfil,
  onSubmit,
  onCancel,
  isLoading,
  unidades,
  centrosCusto,
}: {
  perfil?: Perfil;
  onSubmit: (perfil: Omit<Perfil, 'id'>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  unidades: Unidade[];
  centrosCusto: CentroCusto[];
}) => {
  const [formData, setFormData] = useState<Omit<Perfil, 'id'>>({
    nome: perfil?.nome || '',
    ativo: perfil?.ativo ?? true,
    unidade: perfil?.unidade || '',
    centro_de_custo: perfil?.centro_de_custo || '',
    permissoes: perfil?.permissoes || [],
  });

  const [selectedPermissoes, setSelectedPermissoes] = useState<string[]>(perfil?.permissoes || []);

  useEffect(() => {
    if (perfil) {
      setFormData({
        nome: perfil.nome,
        ativo: perfil.ativo,
        unidade: perfil.unidade,
        centro_de_custo: perfil.centro_de_custo,
        permissoes: perfil.permissoes,
      });
      setSelectedPermissoes(perfil.permissoes || []);
    }
  }, [perfil]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUnidadeChange = (value: string) => {
    setFormData(prev => ({ ...prev, unidade: value }));
  };

  const handleCentroCustoChange = (value: string) => {
    setFormData(prev => ({ ...prev, centro_de_custo: value }));
  };

  const handleAtivoChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, ativo: checked }));
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
          <Label htmlFor="nome">Nome do Perfil</Label>
          <Input
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: DESENVOLVEDOR, ADMINISTRATIVO..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade Padrão</Label>
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
          <Label htmlFor="centro_de_custo">Centro de Custo Padrão</Label>
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
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={handleAtivoChange}
            />
            <Label htmlFor="ativo" className="cursor-pointer">
              {formData.ativo ? 'Ativo' : 'Inativo'}
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Permissões Padrão</Label>
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

const GestaoPerfis = () => {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [filteredPerfis, setFilteredPerfis] = useState<Perfil[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPerfilId, setDeletingPerfilId] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    carregarPerfis();
    carregarUnidades();
    carregarCentrosCusto();
  }, []);

  useEffect(() => {
    const filtered = perfis.filter(perfil => {
      const nome = perfil.nome || '';
      const searchLower = searchTerm.toLowerCase();
      return nome.toLowerCase().includes(searchLower);
    });
    setFilteredPerfis(filtered);
  }, [perfis, searchTerm]);

  const carregarPerfis = async () => {
    try {
      setIsLoading(true);
      const data = await perfilService.buscarTodos();
      setPerfis(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar perfis",
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

  const handleSubmitForm = async (dadosPerfil: Omit<Perfil, 'id'>) => {
    try {
      setIsSubmitting(true);
      
      if (editingPerfil) {
        await perfilService.atualizar(editingPerfil.id!, dadosPerfil);
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!"
        });
      } else {
        await perfilService.criar(dadosPerfil);
        toast({
          title: "Sucesso",
          description: "Perfil criado com sucesso!"
        });
      }
      
      await carregarPerfis();
      setIsFormOpen(false);
      setEditingPerfil(undefined);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar perfil",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (perfil: Perfil) => {
    setEditingPerfil(perfil);
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingPerfilId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPerfilId) return;
    try {
      await perfilService.deletar(deletingPerfilId);
      toast({
        title: "Sucesso",
        description: "Perfil excluído com sucesso!"
      });
      await carregarPerfis();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir perfil",
        variant: "destructive"
      });
    } finally {
      setDeletingPerfilId(null);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingPerfil(undefined);
  };

  return (
    <AppLayout title="Gestão de Perfis">
      <div className="h-full px-4 py-6 lg:px-8">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Lista de Perfis</CardTitle>
            <CardDescription>
              Gerencie os perfis de usuário e suas configurações padrão
            </CardDescription>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar perfis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Perfil
              </Button>
            </div>
          </CardHeader>

          <CardContent className="h-[calc(100%-180px)] overflow-auto">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">Carregando perfis...</div>
            ) : (
              <div className="h-full overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Unidade Padrão</TableHead>
                      <TableHead>Centro de Custo Padrão</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPerfis.map((perfil) => (
                      <TableRow key={perfil.id}>
                        <TableCell className="font-medium uppercase">{perfil.nome}</TableCell>
                        <TableCell>{perfil.unidade || '-'}</TableCell>
                        <TableCell>{perfil.centro_de_custo || '-'}</TableCell>
                        <TableCell>
                          {perfil.permissoes?.includes('tudo') 
                            ? 'Acesso Total' 
                            : `${perfil.permissoes?.length || 0} permissões`}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            perfil.ativo 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {perfil.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(perfil)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRequest(perfil.id!)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredPerfis.length === 0 && !isLoading && (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Nenhum perfil encontrado
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingPerfil ? 'Editar Perfil' : 'Novo Perfil'}
            </DialogTitle>
            <DialogDescription>
              {editingPerfil 
                ? 'Edite as configurações do perfil abaixo' 
                : 'Preencha os dados para criar um novo perfil'
              }
            </DialogDescription>
          </DialogHeader>
          <PerfilForm
            perfil={editingPerfil}
            onSubmit={handleSubmitForm}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            unidades={unidades}
            centrosCusto={centrosCusto}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPerfilId} onOpenChange={(open) => !open && setDeletingPerfilId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPerfilId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default GestaoPerfis;
