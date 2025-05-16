import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Fornecedor } from "@/types/typesLenha";

interface FormFornecedorProps {
  onSaveSuccess: () => void;
  onCancel?: () => void;
}

const FormFornecedor = ({ onSaveSuccess, onCancel }: FormFornecedorProps) => {
  const [nome, setNome] = useState("");
  const [valorUnitario, setValorUnitario] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
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
  
  // Salva no Firestore
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
  
  return (
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
                        <li key={fornecedor.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                          <span className="font-medium">{fornecedor.nome}</span>
                          <span className="text-sm bg-primary/10 px-2 py-1 rounded">
                            R$ {(fornecedor.valorUnitario ?? 0).toFixed(2)}/m³
                          </span>
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
  );
};

export default FormFornecedor;