import { useState, useEffect } from "react";
import { Plus, Upload, Check, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp, updateDoc, doc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { cn } from "@/lib/utils";

interface Peca {
  id?: string;
  nome: string;
  codigo: string;
  descricao: string;
  categoria: "Mecânica" | "Elétrica" | "Hidráulica" | "Pneumática" | "Eletrônica" | "Estrutural" | "Rolamentos" | "Vedação" | "Lubrificação" | "Transmissão" | "Instrumentação" | "Refrigeração" | "Controle";
  status: "Normal" | "Atenção" | "Crítico";
  equipamentoId: string;
  vidaUtil: number;
  vidaUtilRestante: number;
  ultimaManutencao: string;
  proximaManutencao: string;
  custoManutencao: number;
  emEstoque: number;
  estoqueMinimo: number;
  fornecedor: string;
  tempoCritico: number;
  valorUnitario: number;
  dataUltimaCompra: string;
  x: number;
  y: number;
}

interface Produto {
  id: string;
  nome: string;
  codigo_estoque: string;
  codigo_material: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number;
  fornecedor_nome?: string;
  detalhes?: string;
}

interface AddPecaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamentoId: string;
  sistemaId: string;
  sistemas: any[];
  editingPeca?: Peca | null;
  onSuccess: () => void;
}

export const AddPecaModal = ({ 
  open, 
  onOpenChange, 
  equipamentoId, 
  sistemaId,
  sistemas,
  editingPeca, 
  onSuccess 
}: AddPecaModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosLoading, setProdutosLoading] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState<Partial<Peca>>(
    editingPeca || {
      nome: "",
      codigo: "",
      descricao: "",
      categoria: "Mecânica",
      status: "Normal",
      equipamentoId,
      vidaUtil: 0,
      vidaUtilRestante: 0,
      ultimaManutencao: "",
      proximaManutencao: "",
      custoManutencao: 0,
      emEstoque: 0,
      estoqueMinimo: 0,
      fornecedor: "",
      tempoCritico: 0,
      valorUnitario: 0,
      dataUltimaCompra: "",
      x: 400,
      y: 150,
    }
  );

  // Buscar produtos quando o modal abrir
  useEffect(() => {
    if (open && produtos.length === 0) {
      fetchProdutos();
    }
  }, [open]);

  const fetchProdutos = async () => {
    setProdutosLoading(true);
    try {
      const produtosCollection = collection(db, "produtos");
      const produtosQuery = query(produtosCollection, orderBy("nome"));
      const snapshot = await getDocs(produtosQuery);
      
      const produtosData = snapshot.docs.map(doc => ({
        id: doc.id,
        nome: doc.data().nome || "",
        codigo_estoque: doc.data().codigo_estoque || "",
        codigo_material: doc.data().codigo_material || "",
        quantidade: doc.data().quantidade || 0,
        quantidade_minima: doc.data().quantidade_minima || 0,
        valor_unitario: doc.data().valor_unitario || 0,
        fornecedor_nome: doc.data().fornecedor_nome || "",
        detalhes: doc.data().detalhes || "",
      })) as Produto[];
      
      setProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar produtos.",
        variant: "destructive",
      });
    } finally {
      setProdutosLoading(false);
    }
  };

  const handleProdutoSelect = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      setSelectedProdutoId(produtoId);
      // Preencher os campos com os dados do produto
      setFormData({
        ...formData,
        nome: produto.nome,
        codigo: produto.codigo_estoque || produto.codigo_material,
        descricao: produto.detalhes || "",
        emEstoque: produto.quantidade,
        estoqueMinimo: produto.quantidade_minima,
        valorUnitario: produto.valor_unitario,
        fornecedor: produto.fornecedor_nome || "",
      });
      toast({
        title: "Produto selecionado",
        description: `Campos preenchidos com dados de ${produto.nome}`,
      });
    }
  };

  // Filtrar produtos baseado na pesquisa
  const filteredProdutos = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    produto.codigo_estoque.toLowerCase().includes(searchQuery.toLowerCase()) ||
    produto.codigo_material.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (produto.fornecedor_nome && produto.fornecedor_nome.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.codigo) {
      toast({
        title: "Erro",
        description: "Nome e código são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const novosSistemas = sistemas.map(sistema => {
        if (sistema.id === sistemaId) {
          const pecas = sistema.pecas || [];
          
          if (editingPeca?.id) {
            // Atualizar peça existente
            return {
              ...sistema,
              pecas: pecas.map((p: any) => 
                p.id === editingPeca.id ? { ...p, ...formData } : p
              ),
              totalPecas: pecas.length
            };
          } else {
            // Adicionar nova peça
            const novaPeca = {
              id: `peca-${Date.now()}`,
              ...formData,
              subPecas: []
            };
            return {
              ...sistema,
              pecas: [...pecas, novaPeca],
              totalPecas: pecas.length + 1
            };
          }
        }
        return sistema;
      });

      // Atualizar documento no Firestore
      await updateDoc(doc(db, "equipamentos", equipamentoId), {
        sistemas: novosSistemas
      });

      toast({
        title: "Sucesso",
        description: editingPeca ? "Peça atualizada com sucesso!" : "Peça cadastrada com sucesso!",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar peça:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a peça.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPeca ? "Editar Peça" : "Adicionar Nova Peça"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropdown de seleção de produto */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
            <Label>Buscar Produto Existente (Opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between",
                    !selectedProdutoId && "text-muted-foreground"
                  )}
                  disabled={produtosLoading}
                >
                  {produtosLoading
                    ? "Carregando produtos..."
                    : selectedProdutoId
                      ? produtos.find((p) => p.id === selectedProdutoId)?.nome
                      : "Selecione um produto para preencher os campos..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[95vw] sm:w-[400px] p-0" align="start">
                <Command className="border rounded-lg">
                  <CommandInput 
                    placeholder="Buscar produto por nome, código ou fornecedor..." 
                    className="h-9 border-0 focus:ring-0"
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty className="py-6 text-center text-sm">
                      {produtosLoading ? "Carregando produtos..." : "Nenhum produto encontrado."}
                    </CommandEmpty>
                    <CommandGroup className="overflow-auto">
                      {filteredProdutos.map((produto) => (
                        <CommandItem
                          key={produto.id}
                          value={produto.id}
                          onSelect={() => handleProdutoSelect(produto.id)}
                          className="cursor-pointer py-2 px-3 flex items-center justify-between hover:bg-accent"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <Check
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                selectedProdutoId === produto.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-medium truncate">{produto.nome}</span>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                {produto.codigo_estoque && (
                                  <span>Estoque: {produto.codigo_estoque}</span>
                                )}
                                {produto.codigo_material && (
                                  <span>Material: {produto.codigo_material}</span>
                                )}
                                <span>Qtd: {produto.quantidade}</span>
                                {produto.fornecedor_nome && (
                                  <span className="truncate">Fornecedor: {produto.fornecedor_nome}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Selecione um produto da lista para preencher automaticamente os campos abaixo
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Peça *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Motor Principal"
                required
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: MOT-001"
                required
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada da peça"
              rows={3}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, categoria: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mecânica">Mecânica</SelectItem>
                  <SelectItem value="Elétrica">Elétrica</SelectItem>
                  <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                  <SelectItem value="Pneumática">Pneumática</SelectItem>
                  <SelectItem value="Eletrônica">Eletrônica</SelectItem>
                  <SelectItem value="Estrutural">Estrutural</SelectItem>
                  <SelectItem value="Rolamentos">Rolamentos</SelectItem>
                  <SelectItem value="Vedação">Vedação</SelectItem>
                  <SelectItem value="Lubrificação">Lubrificação</SelectItem>
                  <SelectItem value="Transmissão">Transmissão</SelectItem>
                  <SelectItem value="Instrumentação">Instrumentação</SelectItem>
                  <SelectItem value="Refrigeração">Refrigeração</SelectItem>
                  <SelectItem value="Controle">Controle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "Normal" | "Atenção" | "Crítico") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Atenção">Atenção</SelectItem>
                  <SelectItem value="Crítico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vidaUtil">Vida Útil (horas)</Label>
              <Input
                id="vidaUtil"
                type="number"
                value={formData.vidaUtil}
                onChange={(e) => setFormData({ ...formData, vidaUtil: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vidaUtilRestante">Vida Útil Restante</Label>
              <Input
                id="vidaUtilRestante"
                type="number"
                value={formData.vidaUtilRestante}
                onChange={(e) => setFormData({ ...formData, vidaUtilRestante: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempoCritico">Tempo Crítico (h)</Label>
              <Input
                id="tempoCritico"
                type="number"
                value={formData.tempoCritico}
                onChange={(e) => setFormData({ ...formData, tempoCritico: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ultimaManutencao">Última Manutenção</Label>
              <Input
                id="ultimaManutencao"
                type="date"
                value={formData.ultimaManutencao}
                onChange={(e) => setFormData({ ...formData, ultimaManutencao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proximaManutencao">Próxima Manutenção</Label>
              <Input
                id="proximaManutencao"
                type="date"
                value={formData.proximaManutencao}
                onChange={(e) => setFormData({ ...formData, proximaManutencao: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emEstoque">Em Estoque</Label>
              <Input
                id="emEstoque"
                type="number"
                value={formData.emEstoque}
                onChange={(e) => setFormData({ ...formData, emEstoque: Number(e.target.value) })}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({ ...formData, estoqueMinimo: Number(e.target.value) })}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
              <Input
                id="valorUnitario"
                type="number"
                step="0.01"
                value={formData.valorUnitario}
                onChange={(e) => setFormData({ ...formData, valorUnitario: Number(e.target.value) })}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custoManutencao">Custo Manutenção (R$)</Label>
              <Input
                id="custoManutencao"
                type="number"
                step="0.01"
                value={formData.custoManutencao}
                onChange={(e) => setFormData({ ...formData, custoManutencao: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataUltimaCompra">Última Compra</Label>
              <Input
                id="dataUltimaCompra"
                type="date"
                value={formData.dataUltimaCompra}
                onChange={(e) => setFormData({ ...formData, dataUltimaCompra: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Input
              id="fornecedor"
              value={formData.fornecedor}
              onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
              placeholder="Nome do fornecedor"
              disabled
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingPeca ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};