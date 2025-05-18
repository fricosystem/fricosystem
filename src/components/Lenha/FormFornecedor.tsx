import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Fornecedor } from "@/types/typesLenha";
import { Pencil, Trash2, Save, X } from "lucide-react";
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

interface FormFornecedorProps {
  onSaveSuccess: () => void;
  onCancel?: () => void;
}

const FormFornecedor = ({ onSaveSuccess, onCancel }: FormFornecedorProps) => {
  const [nome, setNome] = useState("");
  const [valorUnitario, setValorUnitario] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  // Estados para edição
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editValorUnitario, setEditValorUnitario] = useState<number>(0);
  
  // Estado para confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<string>("");
  
  const { userData } = useAuth();
  const { toast } = useToast();
  
  // Lista de fornecedores existentes
  const { data: fornecedores = [], refetch } = useQuery({
    queryKey: ["fornecedoreslenha"],
    queryFn: async () => {
      // Verificar se a coleção existe
      try {
        const querySnapshot = await getDocs(collection(db, "fornecedoreslenha"));
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Fornecedor[];
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        return [];
      }
    }
  });
  
  // Salva novo fornecedor no Firestore
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (!nome || valorUnitario <= 0) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    // Verifica se o fornecedor com mesmo nome já existe
    if (fornecedores.some(f => f.nome.toLowerCase() === nome.toLowerCase())) {
      toast({
        variant: "destructive",
        title: "Fornecedor já existe",
        description: "Já existe um fornecedor com este nome.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const novoFornecedor = {
        nome,
        valorUnitario,
        dataCadastro: new Date(),
        usuarioCadastro: userData?.nome || "Usuário não identificado",
      };
      
      // Salva no Firestore
      await addDoc(collection(db, "fornecedoreslenha"), novoFornecedor);
      
      toast({
        title: "Fornecedor salvo com sucesso!",
        description: `${nome} foi adicionado à lista de fornecedores.`,
      });
      
      // Limpa o formulário
      setNome("");
      setValorUnitario(0);
      
      // Atualiza a lista
      refetch();
      
      // Notifica componente pai sobre sucesso
      onSaveSuccess();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o fornecedor. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Iniciar edição de fornecedor
  const handleEditStart = (fornecedor: Fornecedor) => {
    setEditId(fornecedor.id);
    setEditNome(fornecedor.nome);
    setEditValorUnitario(fornecedor.valorUnitario);
  };
  
  // Cancelar edição
  const handleEditCancel = () => {
    setEditId(null);
    setEditNome("");
    setEditValorUnitario(0);
  };
  
  // Salvar edição de fornecedor
  const handleEditSave = async (fornecedorId: string) => {
    if (!editNome || editValorUnitario <= 0) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }
    
    // Verifica se o novo nome já existe (exceto o próprio fornecedor sendo editado)
    if (fornecedores.some(f => 
      f.nome.toLowerCase() === editNome.toLowerCase() && f.id !== fornecedorId
    )) {
      toast({
        variant: "destructive",
        title: "Fornecedor já existe",
        description: "Já existe outro fornecedor com este nome.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const fornecedorRef = doc(db, "fornecedoreslenha", fornecedorId);
      await updateDoc(fornecedorRef, {
        nome: editNome,
        valorUnitario: editValorUnitario
      });
      
      toast({
        title: "Fornecedor atualizado com sucesso!",
        description: `Os dados de ${editNome} foram atualizados.`,
      });
      
      setEditId(null);
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o fornecedor. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Confirmar exclusão de fornecedor
  const handleConfirmDelete = (id: string, nome: string) => {
    setDeleteId(id);
    setFornecedorParaExcluir(nome);
  };
  
  // Cancelar exclusão
  const handleCancelDelete = () => {
    setDeleteId(null);
    setFornecedorParaExcluir("");
  };
  
  // Excluir fornecedor
  const handleDelete = async () => {
    if (!deleteId) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "fornecedoreslenha", deleteId));
      
      toast({
        title: "Fornecedor excluído com sucesso!",
        description: `${fornecedorParaExcluir} foi removido da lista de fornecedores.`,
      });
      
      setDeleteId(null);
      setFornecedorParaExcluir("");
      refetch();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o fornecedor. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Novo Fornecedor</CardTitle>
        </CardHeader>
        
        <CardContent className="pb-6">
          <form onSubmit={handleSalvar} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-base">Nome do Fornecedor*</Label>
                  <Input 
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do fornecedor"
                    required
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valorUnitario" className="text-base">Valor Unitário (R$/m³)*</Label>
                  <Input 
                    id="valorUnitario"
                    type="number" 
                    min="0.01"
                    step="0.01"
                    value={valorUnitario || ""}
                    onChange={(e) => setValorUnitario(Number(e.target.value))}
                    placeholder="0,00"
                    required
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    * Campos obrigatórios
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-muted p-6 rounded-lg h-full">
                  <h3 className="font-medium text-lg mb-4">Fornecedores Cadastrados</h3>
                  <div className="max-h-60 overflow-y-auto pr-2">
                    {fornecedores.length > 0 ? (
                      <ul className="space-y-3">
                        {fornecedores.map((fornecedor) => (
                          <li key={fornecedor.id} className="border-b pb-2 last:border-0">
                            {editId === fornecedor.id ? (
                              <div className="space-y-2 py-1">
                                <Input 
                                  value={editNome}
                                  onChange={(e) => setEditNome(e.target.value)}
                                  placeholder="Nome do fornecedor"
                                  className="h-10 text-sm mb-2"
                                />
                                <div className="flex gap-2 items-center">
                                  <Input 
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={editValorUnitario || ""}
                                    onChange={(e) => setEditValorUnitario(Number(e.target.value))}
                                    placeholder="0,00"
                                    className="h-10 text-sm"
                                  />
                                  <div className="flex gap-1">
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="icon" 
                                      onClick={() => handleEditSave(fornecedor.id || "")}
                                      disabled={loading}
                                      className="h-8 w-8"
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      size="icon" 
                                      onClick={handleEditCancel}
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{fornecedor.nome}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm bg-primary/10 px-2 py-1 rounded">
                                    R$ {(fornecedor.valorUnitario ?? 0).toFixed(2)}/m³
                                  </span>
                                  <div className="flex gap-1">
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleEditStart(fornecedor)}
                                      className="h-8 w-8"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleConfirmDelete(fornecedor.id || "", fornecedor.nome)}
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground py-4 text-center">
                        Nenhum fornecedor cadastrado.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <CardFooter className="flex justify-end p-0 pt-6 gap-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onCancel}
                  className="h-12 px-6 text-base"
                >
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 px-6 text-base"
              >
                {loading ? "Salvando..." : "Cadastrar Fornecedor"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => !loading && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor <strong>{fornecedorParaExcluir}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FormFornecedor;