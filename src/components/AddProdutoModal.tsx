
import { useState } from "react";
import { Loader2, Save, X } from "lucide-react";
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

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfh_WWxIroAYEEEtnecpwWxk-SzZAQ6vTM99z8bvN1f3vlXmQ/formResponse";

const AddProdutoModal = ({ open, onOpenChange, onSuccess }: AddProdutoModalProps) => {
  const [formData, setFormData] = useState<FormData>({
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
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Monta a URL com os parâmetros para o Google Forms
      // Os entry.XXXXX são os IDs dos campos no formulário
      const timestamp = new Date().toISOString();
      const url = `https://docs.google.com/forms/d/e/1FAIpQLSfh_WWxIroAYEEEtnecpwWxk-SzZAQ6vTM99z8bvN1f3vlXmQ/formResponse?` +
        `entry.950738290=${encodeURIComponent(timestamp)}` +
        `&entry.1093321090=${encodeURIComponent(formData.codigo)}` +
        `&entry.289277253=${encodeURIComponent(formData.codigoEstoque)}` +
        `&entry.1094520217=${encodeURIComponent(formData.nome)}` +
        `&entry.338874101=${encodeURIComponent(formData.unidade)}` +
        `&entry.668169828=${encodeURIComponent(formData.deposito)}` +
        `&entry.1153735670=${encodeURIComponent(formData.quantidade)}` +
        `&entry.355652948=${encodeURIComponent(formData.quantidadeMinima)}` +
        `&entry.150763117=${encodeURIComponent(formData.detalhes)}` +
        `&entry.251730834=${encodeURIComponent(formData.imagem)}` +
        `&entry.1457202272=${encodeURIComponent(formData.unidadeMedida)}` +
        `&entry.917646528=${encodeURIComponent(formData.valorUnitario)}`;

      // Usamos um iframe oculto para submeter o formulário
      // Isso é necessário porque o Google Forms não permite CORS diretamente
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);
      iframe.src = url;

      // Mostramos uma mensagem de sucesso após um tempo
      setTimeout(() => {
        setLoading(false);
        toast({
          title: "Produto adicionado",
          description: "O produto foi adicionado com sucesso à planilha.",
        });
        document.body.removeChild(iframe);
        onOpenChange(false);
        onSuccess();
        
        // Limpar formulário
        setFormData({
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
        });
      }, 2000);
    } catch (error) {
      setLoading(false);
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto à planilha.",
        variant: "destructive",
      });
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
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Código*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: 04-000.001" 
                  value={formData.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value)}
                  required
                />
              </FormControl>
            </FormItem>
            
            <FormItem>
              <FormLabel>Código Estoque*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: 1" 
                  value={formData.codigoEstoque}
                  onChange={(e) => handleChange("codigoEstoque", e.target.value)}
                  required
                />
              </FormControl>
            </FormItem>
          </div>

          <FormItem>
            <FormLabel>Nome do Produto*</FormLabel>
            <FormControl>
              <Input 
                placeholder="Nome do produto" 
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
              />
            </FormControl>
          </FormItem>
          
          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Unidade*</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: FR01" 
                  value={formData.unidade}
                  onChange={(e) => handleChange("unidade", e.target.value)}
                  required
                />
              </FormControl>
            </FormItem>
            
            <FormItem>
              <FormLabel>Unidade de Medida*</FormLabel>
              <Select 
                value={formData.unidadeMedida}
                onValueChange={(value) => handleChange("unidadeMedida", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="UN">UN</SelectItem>
                  <SelectItem value="CX">CX</SelectItem>
                  <SelectItem value="PC">PC</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Quantidade Atual*</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  placeholder="Ex: 100" 
                  value={formData.quantidade}
                  onChange={(e) => handleChange("quantidade", e.target.value)}
                  required
                />
              </FormControl>
            </FormItem>
            
            <FormItem>
              <FormLabel>Quantidade Mínima*</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  placeholder="Ex: 10" 
                  value={formData.quantidadeMinima}
                  onChange={(e) => handleChange("quantidadeMinima", e.target.value)}
                  required
                />
              </FormControl>
            </FormItem>
          </div>
          
          <FormItem>
            <FormLabel>Depósito/Localização*</FormLabel>
            <Select 
              value={formData.deposito}
              onValueChange={(value) => handleChange("deposito", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Depósito A">Depósito A</SelectItem>
                <SelectItem value="Depósito B">Depósito B</SelectItem>
                <SelectItem value="Depósito C">Depósito C</SelectItem>
                <SelectItem value="Cozinha">Cozinha</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
          
          <FormItem>
            <FormLabel>Valor Unitário*</FormLabel>
            <FormControl>
              <Input 
                type="text" 
                placeholder="Ex: 15,75" 
                value={formData.valorUnitario}
                onChange={(e) => handleChange("valorUnitario", e.target.value)}
                required
              />
            </FormControl>
          </FormItem>
          
          <FormItem>
            <FormLabel>Detalhes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Descrição ou detalhes do produto" 
                className="resize-none"
                value={formData.detalhes}
                onChange={(e) => handleChange("detalhes", e.target.value)}
              />
            </FormControl>
          </FormItem>
          
          <FormItem>
            <FormLabel>URL da Imagem</FormLabel>
            <FormControl>
              <Input 
                placeholder="https://exemplo.com/imagem.jpg" 
                value={formData.imagem}
                onChange={(e) => handleChange("imagem", e.target.value)}
              />
            </FormControl>
            {formData.imagem && (
              <div className="mt-2 border rounded-md p-2 w-32 h-32 flex items-center justify-center overflow-hidden">
                <img 
                  src={formData.imagem} 
                  alt="Preview" 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
            )}
          </FormItem>
          
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
      </DialogContent>
    </Dialog>
  );
};

export default AddProdutoModal;
