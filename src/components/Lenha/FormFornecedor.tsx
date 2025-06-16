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

// Função para formatar telefone
const formatPhone = (value: string) => {
  if (!value) return "";
  
  // Remove tudo que não é dígito
  const cleaned = value.replace(/\D/g, '');
  
  // Aplica a formatação (00) 0 0000-0000
  const match = cleaned.match(/^(\d{0,2})(\d{0,1})(\d{0,4})(\d{0,4})$/);
  if (!match) return value;
  
  let formatted = "";
  if (match[1]) formatted += `(${match[1]}`;
  if (match[2]) formatted += `) ${match[2]}`;
  if (match[3]) formatted += ` ${match[3]}`;
  if (match[4]) formatted += `-${match[4]}`;
  
  return formatted;
};

interface FormFornecedorProps {
  onSaveSuccess: () => void;
  onCancel?: () => void;
}

const FormFornecedor = ({ onSaveSuccess, onCancel }: FormFornecedorProps) => {
  const [nome, setNome] = useState("");
  const [valorUnitario, setValorUnitario] = useState<number>(0);
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados para edição
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editValorUnitario, setEditValorUnitario] = useState<number>(0);
  const [editCnpj, setEditCnpj] = useState("");
  const [editContato, setEditContato] = useState("");
  const [editChavePix, setEditChavePix] = useState("");
  
  // Estado para confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<string>("");
  
  const { userData } = useAuth();
  const { toast } = useToast();
  
  // Lista de fornecedores existentes
  const { data: fornecedores = [], refetch } = useQuery({
    queryKey: ["fornecedoreslenha"],
    queryFn: async () => {
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
  
  // Manipulador de mudança para o campo de telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const formatted = formatPhone(e.target.value);
    if (isEdit) {
      setEditContato(formatted);
    } else {
      setContato(formatted);
    }
  };
  
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
        cnpj,
        contato,
        chavePix,
        dataCadastro: new Date(),
        usuarioCadastro: userData?.nome || "Usuário não identificado",
      };
      
      await addDoc(collection(db, "fornecedoreslenha"), novoFornecedor);
      
      toast({
        title: "Fornecedor salvo com sucesso!",
        description: `${nome} foi adicionado à lista de fornecedores.`,
      });
      
      // Limpa o formulário
      setNome("");
      setValorUnitario(0);
      setCnpj("");
      setContato("");
      setChavePix("");
      
      refetch();
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
    setEditCnpj(fornecedor.cnpj || "");
    setEditContato(fornecedor.contato || "");
    setEditChavePix(fornecedor.chavePix || "");
  };
  
  // Cancelar edição
  const handleEditCancel = () => {
    setEditId(null);
    setEditNome("");
    setEditValorUnitario(0);
    setEditCnpj("");
    setEditContato("");
    setEditChavePix("");
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
        valorUnitario: editValorUnitario,
        cnpj: editCnpj,
        contato: editContato,
        chavePix: editChavePix
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
      <div className="w-full max-w-4xl mx-auto space-y-8">
        {/* Card do formulário de cadastro */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Novo Fornecedor</CardTitle>
          </CardHeader>
          
          <CardContent className="pb-6">
            <form onSubmit={handleSalvar} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-base">CNPJ</Label>
                    <Input 
                      id="cnpj"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contato" className="text-base">Contato (Telefone)*</Label>
                    <Input 
                      id="contato"
                      value={contato}
                      onChange={(e) => handlePhoneChange(e)}
                      placeholder="(00) 0 0000-0000"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Nova linha para a Chave Pix */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="chavePix" className="text-base">Chave Pix para Pagamento</Label>
                  <Input 
                    id="chavePix"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="Chave Pix (CPF/CNPJ, telefone, e-mail ou chave aleatória)"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  * Campos obrigatórios
                </p>
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

        {/* Card da lista de fornecedores - Layout ajustado conforme solicitado */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">Fornecedores Cadastrados</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="bg-muted p-6 rounded-lg">
              <div className="max-h-96 overflow-y-auto scroll-smooth">
                {fornecedores.length > 0 ? (
                  <ul className="space-y-0">
                    {fornecedores.map((fornecedor) => (
                      <li key={fornecedor.id} className="border-b border-gray-300 py-4 last:border-b-0">
                        {editId === fornecedor.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Nome</Label>
                                <Input 
                                  value={editNome}
                                  onChange={(e) => setEditNome(e.target.value)}
                                  className="h-10 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">Valor (R$/m³)</Label>
                                <Input 
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editValorUnitario || ""}
                                  onChange={(e) => setEditValorUnitario(Number(e.target.value))}
                                  className="h-10 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">CNPJ</Label>
                                <Input 
                                  value={editCnpj}
                                  onChange={(e) => setEditCnpj(e.target.value)}
                                  className="h-10 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm">Telefone</Label>
                                <Input 
                                  value={editContato}
                                  onChange={(e) => handlePhoneChange(e, true)}
                                  className="h-10 text-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm">Chave Pix</Label>
                                <Input 
                                  value={editChavePix}
                                  onChange={(e) => setEditChavePix(e.target.value)}
                                  className="h-10 text-sm"
                                  placeholder="Chave Pix para pagamento"
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end pt-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSave(fornecedor.id || "")}
                                disabled={loading}
                              >
                                <Save className="h-3 w-3 mr-1" /> Salvar
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={handleEditCancel}
                              >
                                <X className="h-3 w-3 mr-1" /> Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="font-medium text-lg">{fornecedor.nome}</div>
                                <div className="text-sm text-muted-foreground">
                                  CNPJ: {fornecedor.cnpj || "Não informado"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Contato: {fornecedor.contato || "Não informado"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Valor Unitário: R$ {(fornecedor.valorUnitario ?? 0).toFixed(2)}/m³
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Chave Pix: {fornecedor.chavePix || "Não informada"}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleEditStart(fornecedor)}
                                  className="h-8 w-8 hover:bg-gray-200"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleConfirmDelete(fornecedor.id || "", fornecedor.nome)}
                                  className="h-8 w-8 text-red-500 hover:bg-red-50"
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
          </CardContent>
        </Card>
      </div>
      
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