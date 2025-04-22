import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/firebase/firebase";

interface AddProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  codigo: string;
  codigoEstoque: string;
  nome: string;
  unidade: string;
  deposito: string;
  quantidade: string;
  quantidadeMinima: string;
  detalhes: string;
  imagem: string;
  unidadeMedida: string;
  valorUnitario: string;
}

const AddProdutoModal = ({ open, onOpenChange, onSuccess }: AddProdutoModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize react-hook-form
  const form = useForm<FormData>({
    defaultValues: {
      codigo: "",
      codigoEstoque: "",
      nome: "",
      unidade: "",
      deposito: "",
      quantidade: "",
      quantidadeMinima: "",
      detalhes: "",
      imagem: "",
      unidadeMedida: "",
      valorUnitario: "",
    },
  });

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Convert numeric fields to numbers
      const produtoData = {
        codigo_material: formData.codigo,
        codigo_estoque: formData.codigoEstoque,
        nome: formData.nome,
        unidade: formData.unidadeMedida,
        deposito: formData.deposito,
        quantidade: parseFloat(formData.quantidade),
        quantidade_minima: parseFloat(formData.quantidadeMinima),
        detalhes: formData.detalhes,
        imagem: formData.imagem || "/placeholder.svg",
        valor_unitario: parseFloat(formData.valorUnitario),
        data_criacao: new Date().toISOString(),
      };

      // Add the product to Firestore
      await addDoc(collection(db, "produtos"), produtoData);

      // Show success message
      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado com sucesso ao Firestore.",
      });

      // Close modal and reset form
      onOpenChange(false);
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao Firestore.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os dados do produto para adicionar ao inventário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 04-000.001" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigoEstoque"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Estoque*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: FR01" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidadeMedida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida*</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UN">Unidade (UN)</SelectItem>
                        <SelectItem value="KG">Quilograma (KG)</SelectItem>
                        <SelectItem value="GR">Grama (GR)</SelectItem>
                        <SelectItem value="MG">Miligrama (MG)</SelectItem>
                        <SelectItem value="LT">Litro (LT)</SelectItem>
                        <SelectItem value="ML">Mililitro (ML)</SelectItem>
                        <SelectItem value="CX">Caixa (CX)</SelectItem>
                        <SelectItem value="PC">Peça (PC)</SelectItem>
                        <SelectItem value="MT">Metro (MT)</SelectItem>
                        <SelectItem value="CM">Centímetro (CM)</SelectItem>
                        <SelectItem value="MM">Milímetro (MM)</SelectItem>
                        <SelectItem value="M2">Metro Quadrado (M²)</SelectItem>
                        <SelectItem value="M3">Metro Cúbico (M³)</SelectItem>
                        <SelectItem value="PCT">Pacote (PCT)</SelectItem>
                        <SelectItem value="FD">Fardo (FD)</SelectItem>
                        <SelectItem value="AMP">Ampola (AMP)</SelectItem>
                        <SelectItem value="FR">Frasco (FR)</SelectItem>
                        <SelectItem value="RL">Rolo (RL)</SelectItem>
                        <SelectItem value="KIT">Kit (KIT)</SelectItem>
                        <SelectItem value="TN">Tonelada (TN)</SelectItem>
                        <SelectItem value="SC">Saco (SC)</SelectItem>
                        <SelectItem value="BL">Bloco (BL)</SelectItem>
                        <SelectItem value="CT">Cartela (CT)</SelectItem>
                        <SelectItem value="JG">Jogo (JG)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Atual*</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="Ex: 100" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantidadeMinima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima*</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="Ex: 10" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="deposito"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depósito/Localização*</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o depósito" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Manutenção">MANUTENÇÃO</SelectItem>
                      <SelectItem value="Cozinha">COZINHA</SelectItem>
                      <SelectItem value="Produção">PRODUÇÃO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valorUnitario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Unitário*</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Ex: 15,75" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="detalhes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição ou detalhes do produto"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2 border rounded-md p-2 w-32 h-32 flex items-center justify-center overflow-hidden">
                      <img
                        src={field.value}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Produto
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProdutoModal;