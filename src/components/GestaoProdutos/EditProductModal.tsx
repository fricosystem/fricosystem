import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import {
  ChevronDown,
  Plus,
  X,
  Calculator,
  Percent,
  Check,
  RefreshCw,
  Search
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Produto {
  id: string;
  codigo_estoque: string;
  codigo_material: string;
  nome: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number;
  unidade_de_medida: string;
  deposito: string;
  prateleira: string;
  unidade: string;
  detalhes: string;
  imagem: string;
  data_criacao: string;
  data_vencimento: string;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  fornecedor_cnpj: string | null;
}

interface Fornecedor {
  id: string;
  razaoSocial: string;
  cnpj: string;
}

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageUploaded: (url: string) => void;
}

interface EditProductModalProps {
  isOpen: boolean;
  produto: Produto | null;
  onClose: () => void;
  onSave: (produto: Partial<Produto>) => void;
  ImageUploader: React.ComponentType<ImageUploaderProps>;
}

export const EditProductModal = ({ 
  isOpen, 
  produto, 
  onClose, 
  onSave, 
  ImageUploader 
}: EditProductModalProps) => {
  const [editedProduto, setEditedProduto] = useState<Partial<Produto>>({});
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorSearch, setFornecedorSearch] = useState("");
  const [fornecedorPopoverOpen, setFornecedorPopoverOpen] = useState(false);
  const [calcularMinimo, setCalcularMinimo] = useState(false);
  const navigate = useNavigate();

  const unidadesDeMedida = [
    { value: "UN", label: "Unidade (UN)" },
    { value: "KG", label: "Quilograma (KG)" },
    { value: "GR", label: "Grama (GR)" },
    { value: "MG", label: "Miligrama (MG)" },
    { value: "LT", label: "Litro (LT)" },
    { value: "ML", label: "Mililitro (ML)" },
    { value: "CX", label: "Caixa (CX)" },
    { value: "PC", label: "Peça (PC)" },
    { value: "MT", label: "Metro (MT)" },
    { value: "CM", label: "Centímetro (CM)" },
    { value: "MM", label: "Milímetro (MM)" },
    { value: "M2", label: "Metro Quadrado (M²)" },
    { value: "M3", label: "Metro Cúbico (M³)" },
    { value: "PCT", label: "Pacote (PCT)" },
    { value: "FD", label: "Fardo (FD)" },
    { value: "AMP", label: "Ampola (AMP)" },
    { value: "FR", label: "Frasco (FR)" },
    { value: "RL", label: "Rolo (RL)" },
    { value: "KIT", label: "Kit (KIT)" },
    { value: "TN", label: "Tonelada (TN)" },
    { value: "SC", label: "Saco (SC)" },
    { value: "BL", label: "Bloco (BL)" },
    { value: "CT", label: "Cartela (CT)" },
    { value: "JG", label: "Jogo (JG)" },
  ];

  useEffect(() => {
    if (produto && isOpen) {
      setEditedProduto({
        codigo_estoque: produto.codigo_estoque || "",
        codigo_material: produto.codigo_material || "",
        nome: produto.nome || "",
        quantidade: produto.quantidade || 0,
        quantidade_minima: produto.quantidade_minima || 0,
        valor_unitario: produto.valor_unitario || 0,
        unidade_de_medida: produto.unidade_de_medida || "",
        deposito: produto.deposito || "",
        prateleira: produto.prateleira || "",
        unidade: produto.unidade || "",
        detalhes: produto.detalhes || "",
        imagem: produto.imagem || "",
        data_vencimento: produto.data_vencimento || "",
        fornecedor_id: produto.fornecedor_id || null,
        fornecedor_nome: produto.fornecedor_nome || null,
        fornecedor_cnpj: produto.fornecedor_cnpj || null
      });
    }
  }, [produto, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchFornecedores();
    }
  }, [isOpen]);

  const fetchFornecedores = async () => {
    try {
      const fornecedoresCollection = collection(db, "fornecedores");
      const fornecedoresSnapshot = await getDocs(fornecedoresCollection);
      
      const fornecedoresData = fornecedoresSnapshot.docs.map(doc => ({
        id: doc.id,
        razaoSocial: doc.data().razaoSocial || "",
        cnpj: doc.data().cnpj || ""
      })) as Fornecedor[];
      
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    }
  };

  const handleFornecedorSelect = (fornecedor: Fornecedor) => {
    setEditedProduto({
      ...editedProduto,
      fornecedor_id: fornecedor.id,
      fornecedor_nome: fornecedor.razaoSocial,
      fornecedor_cnpj: fornecedor.cnpj
    });
  };

  const handleRemoveFornecedor = () => {
    setEditedProduto({
      ...editedProduto,
      fornecedor_id: null,
      fornecedor_nome: null,
      fornecedor_cnpj: null
    });
  };

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const nome = fornecedor?.razaoSocial || "";
    const cnpj = fornecedor?.cnpj || "";
    
    return (
      nome.toLowerCase().includes(fornecedorSearch.toLowerCase()) ||
      cnpj.includes(fornecedorSearch)
    );
  });

  const getSelectedFornecedorName = () => {
    if (!editedProduto.fornecedor_id) return null;
    
    const selectedFornecedor = fornecedores.find(f => f.id === editedProduto.fornecedor_id);
    return selectedFornecedor ? `${selectedFornecedor.razaoSocial} - ${selectedFornecedor.cnpj}` : null;
  };

  const handleCalcMinimo = () => {
    if (editedProduto.quantidade && editedProduto.quantidade_minima) {
      const percent = (editedProduto.quantidade_minima / editedProduto.quantidade) * 100;
      setEditedProduto({
        ...editedProduto,
        quantidade_minima: Math.round(percent)
      });
    }
  };

  const handleToggleCalcMinimo = (checked: boolean) => {
    setCalcularMinimo(checked);
    if (checked && editedProduto.quantidade && editedProduto.quantidade_minima) {
      handleCalcMinimo();
    }
  };

  const handleSave = () => {
    onSave(editedProduto);
  };

  if (!isOpen || !produto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Editar Produto</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Código do Produto */}
          <div className="space-y-2">
            <Label>Código do produto*</Label>
            <Input
              placeholder="Presente no item da Nota Fiscal"
              value={editedProduto.codigo_estoque || ""}
              onChange={(e) => setEditedProduto({...editedProduto, codigo_estoque: e.target.value})}
              required
            />
          </div>

          {/* Código Material */}
          <div className="space-y-2">
            <Label>Código Material (Casa)</Label>
            <Input
              placeholder="Material específico da casa"
              value={editedProduto.codigo_material || ""}
              onChange={(e) => setEditedProduto({...editedProduto, codigo_material: e.target.value})}
              required
            />
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label>Nome do produto*</Label>
            <Input
              placeholder="Digite o nome do produto"
              value={editedProduto.nome || ""}
              onChange={(e) => setEditedProduto({...editedProduto, nome: e.target.value})}
              required
            />
          </div>

          {/* Unidade de Medida */}
          <div className="space-y-2">
            <Label>Unidade de Medida*</Label>
            <Select
              value={editedProduto.unidade_de_medida || ""}
              onValueChange={(value) => setEditedProduto({...editedProduto, unidade_de_medida: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidadesDeMedida.map((unidade) => (
                  <SelectItem key={unidade.value} value={unidade.value}>
                    {unidade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label>Quantidade*</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={editedProduto.quantidade || ""}
              onChange={(e) => setEditedProduto({...editedProduto, quantidade: Number(e.target.value)})}
              required
            />
          </div>

          {/* Valor Unitário */}
          <div className="space-y-2">
            <Label>Valor Unitário (R$)*</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={editedProduto.valor_unitario || ""}
              onChange={(e) => setEditedProduto({...editedProduto, valor_unitario: Number(e.target.value)})}
              required
            />
          </div>

          {/* Estoque Mínimo */}
          <div className="md:col-span-2 border rounded-md p-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="calc-minimo"
                checked={calcularMinimo}
                onCheckedChange={handleToggleCalcMinimo}
              />
              <Label htmlFor="calc-minimo">Calcular estoque mínimo em %</Label>
            </div>
            <div className="mt-4">
              {!calcularMinimo ? (
                <div className="relative space-y-2">
                  <Label>Quantidade Mínima</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Mínimo"
                      value={editedProduto.quantidade_minima || ""}
                      onChange={(e) => setEditedProduto({...editedProduto, quantidade_minima: Number(e.target.value)})}
                      className="pl-8"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calculator size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Percentual do Estoque (%)</Label>
                  <div className="flex">
                    <Input
                      type="number"
                      placeholder="% Alerta"
                      value={editedProduto.quantidade_minima || ""}
                      onChange={(e) => setEditedProduto({...editedProduto, quantidade_minima: Number(e.target.value)})}
                      className="rounded-r-none"
                    />
                    <div className="flex items-center justify-center bg-muted px-3 border border-l-0 rounded-r-md">
                      <Percent size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-2 px-3 border rounded hover:bg-muted flex items-center"
                    onClick={handleCalcMinimo}
                  >
                    <Calculator size={16} className="text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Unidade */}
          <div className="space-y-2">
            <Label>Unidade/Tag (Opcional)</Label>
            <div className="flex">
              <Input
                placeholder="Ex: ET0001"
                value={editedProduto.unidade || ""}
                onChange={(e) => setEditedProduto({...editedProduto, unidade: e.target.value})}
                required
              />
              <button
                type="button"
                onClick={() => setEditedProduto({...editedProduto, unidade: `ET${Date.now().toString().slice(-4)}`})}
                className="ml-2 px-3 border rounded hover:bg-muted flex items-center"
              >
                <RefreshCw size={16} className="text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor (Opcional)</Label>
            <Popover open={fornecedorPopoverOpen} onOpenChange={setFornecedorPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between border rounded px-3 py-2 text-left hover:bg-muted"
                >
                  <span>
                    {editedProduto.fornecedor_nome ? (
                      <div className="flex flex-col">
                        <span>{editedProduto.fornecedor_nome}</span>
                        <span className="text-xs text-muted-foreground">CNPJ: {editedProduto.fornecedor_cnpj}</span>
                      </div>
                    ) : "Selecione o fornecedor"}
                  </span>
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[95vw] sm:w-[400px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Buscar fornecedor..." 
                    className="h-9"
                    value={fornecedorSearch}
                    onValueChange={setFornecedorSearch}
                  />
                  <CommandList className="max-h-[50vh] sm:max-h-[300px]">
                    <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          handleRemoveFornecedor();
                          setFornecedorPopoverOpen(false);
                        }}
                      >
                        <X className="mr-2 h-4 w-4 text-red-400" />
                        Remover fornecedor
                      </CommandItem>
                      {filteredFornecedores.map((fornecedor) => (
                        <CommandItem
                          key={fornecedor.id}
                          value={`${fornecedor.razaoSocial} ${fornecedor.cnpj}`}
                          onSelect={() => {
                            handleFornecedorSelect(fornecedor);
                            setFornecedorPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              editedProduto.fornecedor_id === fornecedor.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{fornecedor.razaoSocial}</span>
                            <span className="text-xs text-muted-foreground">
                              CNPJ: {fornecedor.cnpj}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Input
              type="date"
              value={editedProduto.data_vencimento || ""}
              onChange={(e) => setEditedProduto({...editedProduto, data_vencimento: e.target.value})}
            />
          </div>
          
          {/* Depósito */}
          <div className="space-y-2">
            <Label>Depósito/Localização*</Label>
            <Select
              value={editedProduto.deposito || ""}
              onValueChange={(value) => setEditedProduto({...editedProduto, deposito: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manutenção">MANUTENÇÃO</SelectItem>
                <SelectItem value="Cozinha">COZINHA</SelectItem>
                <SelectItem value="Produção">PRODUÇÃO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Prateleira */}
          <div className="space-y-2">
            <Label>Prateleira (Opcional)</Label>
            <Input
              placeholder="Ex: A3"
              value={editedProduto.prateleira || ""}
              onChange={(e) => setEditedProduto({...editedProduto, prateleira: e.target.value})}
            />
          </div>
          
          {/* Detalhes */}
          <div className="md:col-span-2 space-y-2">
            <Label>Detalhes</Label>
            <Textarea
              placeholder="Descrição, detalhes do produto, onde será utilizado, etc."
              value={editedProduto.detalhes || ""}
              onChange={(e) => setEditedProduto({...editedProduto, detalhes: e.target.value})}
              rows={4}
            />
          </div>
          
          {/* Upload de Imagem */}
          <div className="md:col-span-2 space-y-2">
            <Label>Imagem do Produto</Label>
            <ImageUploader 
              currentImageUrl={editedProduto.imagem || ""}
              onImageUploaded={(url) => setEditedProduto({...editedProduto, imagem: url})}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <button
            className="px-4 py-2 border rounded hover:bg-muted"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};