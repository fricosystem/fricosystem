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
import UsuarioForm from '@/components/UsuarioForm';
import { Unidade } from '@/types/unidade';
import AppLayout from '@/layouts/AppLayout';

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
}

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

  const { toast } = useToast();

  useEffect(() => {
    carregarUsuarios();
    carregarUnidades();
  }, []);

  useEffect(() => {
    const filtered = usuarios.filter(usuario => {
      const nome = usuario.nome || '';
      const email = usuario.email || '';
      const unidade = usuario.unidade || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = nome.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower) ||
             unidade.toLowerCase().includes(searchLower);

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
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredUsuarios.map((usuario) => (
                        <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.nome}</TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell className="capitalize">{usuario.perfil}</TableCell>
                        <TableCell>{usuario.unidade}</TableCell>
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
        <DialogContent className="max-w-2xl">
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