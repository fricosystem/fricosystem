import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/Cloudinary/cloudinaryUploadProdutos";
import {
  Search,
  Edit,
  Save,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Package,
  Loader2,
  Calculator,
  Percent,
  Check,
  RefreshCw,
  Camera
} from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
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

const ImageUploader = ({ currentImageUrl, onImageUploaded }: ImageUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const imageUrl = await uploadImageToCloudinary(file);
      onImageUploaded(imageUrl);
      toast({
        title: "Sucesso",
        description: "Imagem carregada com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao carregar imagem:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar imagem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCamera = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    fileInput.onchange = (e) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    fileInput.click();
  };

  const triggerFileSelector = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    fileInput.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {currentImageUrl && (
        <div className="relative">
          <img
            src={getOptimizedImageUrl(currentImageUrl, 200, 200)}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-md"
          />
          <button
            type="button"
            onClick={() => onImageUploaded("")}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={triggerCamera}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Camera className="h-4 w-4" />
              {currentImageUrl ? "Tirar Nova Foto" : "Tirar Foto"}
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={triggerFileSelector}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Package className="h-4 w-4" />
              {currentImageUrl ? "Escolher Outra" : "Escolher Imagem"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const GestaoProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedProduto, setEditedProduto] = useState<Partial<Produto>>({});
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorSearch, setFornecedorSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fornecedorPopoverOpen, setFornecedorPopoverOpen] = useState(false);
  const [calcularMinimo, setCalcularMinimo] = useState(false);
  const rowsPerPage = 10;
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProdutos();
    fetchFornecedores();
  }, []);

  useEffect(() => {
    if (!produtos) return;
    
    const filtered = produtos.filter(produto => {
      const nome = produto?.nome || "";
      const codigoEstoque = produto?.codigo_estoque || "";
      const codigoMaterial = produto?.codigo_material || "";

      return (
        nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoEstoque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        codigoMaterial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredProdutos(filtered);
    setPage(1);
  }, [searchTerm, produtos]);

  const fetchProdutos = async () => {
    try {
      setIsLoading(true);
      const produtosCollection = collection(db, "produtos");
      const produtosQuery = query(produtosCollection, orderBy("nome"));
      const produtosSnapshot = await getDocs(produtosQuery);
      
      const produtosData = produtosSnapshot.docs.map(doc => ({
        id: doc.id,
        codigo_estoque: doc.data().codigo_estoque || "",
        codigo_material: doc.data().codigo_material || "",
        nome: doc.data().nome || "",
        quantidade: doc.data().quantidade || 0,
        quantidade_minima: doc.data().quantidade_minima || 0,
        valor_unitario: doc.data().valor_unitario || 0,
        unidade_de_medida: doc.data().unidade_de_medida || "",
        deposito: doc.data().deposito || "",
        prateleira: doc.data().prateleira || "",
        unidade: doc.data().unidade || "",
        detalhes: doc.data().detalhes || "",
        imagem: doc.data().imagem || "",
        data_criacao: doc.data().data_criacao || "",
        data_vencimento: doc.data().data_vencimento || "",
        fornecedor_id: doc.data().fornecedor_id || null,
        fornecedor_nome: doc.data().fornecedor_nome || null,
        fornecedor_cnpj: doc.data().fornecedor_cnpj || null
      })) as Produto[];
      
      setProdutos(produtosData);
      setFilteredProdutos(produtosData);
      setError(null);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setError("Falha ao carregar produtos");
      toast({
        title: "Erro",
        description: "Falha ao carregar produtos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleEdit = (produto: Produto) => {
    setEditingId(produto.id);
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
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    try {
      const produtoRef = doc(db, "produtos", editingId);
      await updateDoc(produtoRef, editedProduto);
      
      setProdutos(produtos.map(produto => 
        produto.id === editingId ? { ...produto, ...editedProduto } : produto
      ));
      
      setEditingId(null);
      setIsEditModalOpen(false);
      toast({
        description: "Produto atualizado com sucesso!",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast({
        description: "Erro ao atualizar produto. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedProduto({});
    setIsEditModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setProdutoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!produtoToDelete) return;
    
    try {
      setProdutos(produtos.filter(produto => produto.id !== produtoToDelete));
      setFilteredProdutos(filteredProdutos.filter(produto => produto.id !== produtoToDelete));
      
      toast({
        description: "Produto excluído com sucesso!",
        duration: 2000,
      });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({
        description: "Erro ao excluir produto. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setProdutoToDelete(null);
      setIsDeleteModalOpen(false);
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

  const formatarValorUnitario = (valor: number) => {
    return valor?.toFixed(2).replace(".", ",") || "0,00";
  };

  const paginatedProdutos = filteredProdutos.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 dark:text-blue-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
            {error}
          </div>
          <button 
            className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
            onClick={fetchProdutos}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    if (produtos.length === 0) {
      return (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Nenhum produto encontrado</p>
          <button 
            className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800"
            onClick={() => navigate("/produtos/novo")}
          >
            <Plus size={18} className="inline mr-2" />
            Adicionar primeiro produto
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IMAGEM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CÓDIGO</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">NOME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">QUANTIDADE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VALOR UNIT.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FORNECEDOR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProdutos.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {produto.imagem ? (
                      <img
                        src={produto.imagem}
                        alt={produto.nome}
                        className="w-10 h-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-md flex items-center justify-center">
                        <Package size={20} className="text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {produto.codigo_estoque}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{produto.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    <div>
                      {produto.quantidade}
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(min: {produto.quantidade_minima})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    R$ {produto.valor_unitario?.toFixed(2).replace(".", ",") || "0,00"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{produto.fornecedor_nome || "-"}</span>
                      {produto.fornecedor_cnpj && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          CNPJ: {produto.fornecedor_cnpj}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-1 bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-800"
                        onClick={() => handleEdit(produto)}
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        className="flex items-center gap-1 bg-red-600 dark:bg-red-700 text-white px-3 py-1 rounded text-sm hover:bg-red-700 dark:hover:bg-red-800"
                        onClick={() => handleDeleteClick(produto.id)}
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </button>
            <span className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded">
              {page}
            </span>
            <button
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={page * rowsPerPage >= filteredProdutos.length}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <AppLayout title="Gestão de Produtos">
      <div className="h-full flex flex-col">
        {renderContent()}
        
        {/* Modal de confirmação de exclusão */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full text-gray-100">
              <h3 className="text-lg font-bold mb-4">Confirmar Exclusão</h3>
              <p className="mb-6 text-gray-300">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 text-gray-100"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={handleDelete}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de edição */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-gray-100">
              <h3 className="text-lg font-bold mb-4">Editar Produto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Código do Produto */}
                <div className="space-y-2">
                  <Label>Código do produto*</Label>
                  <Input
                    placeholder="Presente no item da Nota Fiscal"
                    value={editedProduto.codigo_material || ""}
                    onChange={(e) => setEditedProduto({...editedProduto, codigo_material: e.target.value})}
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Código Estoque */}
                <div className="space-y-2">
                  <Label>Código Estoque*</Label>
                  <Input
                    placeholder="Ex: 1"
                    value={editedProduto.codigo_estoque || ""}
                    onChange={(e) => setEditedProduto({...editedProduto, codigo_estoque: e.target.value})}
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Nome do Produto */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Nome do Produto*</Label>
                  <Input
                    placeholder="Nome do produto"
                    value={editedProduto.nome || ""}
                    onChange={(e) => setEditedProduto({...editedProduto, nome: e.target.value})}
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Unidade de Medida */}
                <div className="space-y-2">
                  <Label>Unidade de Medida*</Label>
                  <Select
                    value={editedProduto.unidade_de_medida || ""}
                    onValueChange={(value) => setEditedProduto({...editedProduto, unidade_de_medida: value})}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                      {unidadesDeMedida.map((unidade) => (
                        <SelectItem key={unidade.value} value={unidade.value}>
                          {unidade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Unidade da Empresa */}
                <div className="space-y-2">
                  <Label>Unidade da empresa*</Label>
                  <Input
                    placeholder="Ex: FR01"
                    value={editedProduto.unidade || ""}
                    onChange={(e) => setEditedProduto({...editedProduto, unidade: e.target.value})}
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Quantidade */}
                <div className="space-y-2">
                  <Label>Quantidade*</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="NF/Físico"
                    value={editedProduto.quantidade?.toString() || ""}
                    onChange={(e) => setEditedProduto({
                      ...editedProduto, 
                      quantidade: Number(e.target.value),
                      ...(calcularMinimo && {
                        quantidade_minima: Math.round(Number(e.target.value) * (editedProduto.quantidade_minima || 0) / 100)
                      })
                    })}
                    required
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Valor Unitário */}
                <div className="space-y-2">
                  <Label>Valor Unitário*</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
                    <Input
                      type="text"
                      placeholder="Ex: 15,75"
                      value={formatarValorUnitario(editedProduto.valor_unitario || 0)}
                      onChange={(e) => {
                        const valor = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                        setEditedProduto({
                          ...editedProduto,
                          valor_unitario: parseFloat(valor) || 0
                        });
                      }}
                      required
                      className="bg-gray-800 border-gray-700 text-gray-100 pl-8"
                    />
                  </div>
                </div>
                
                {/* Cálculo de Quantidade Mínima */}
                <div className="md:col-span-2 border rounded-md p-4 border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Cálculo de Quantidade Mínima</Label>
                    <div className="flex items-center space-x-2">
                      <Label>Calcular automaticamente</Label>
                      <Switch
                        checked={calcularMinimo}
                        onCheckedChange={handleToggleCalcMinimo}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Percentual (%)</Label>
                      <div className="flex">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          placeholder="Ex: 25"
                          value={editedProduto.quantidade_minima?.toString() || ""}
                          onChange={(e) => setEditedProduto({
                            ...editedProduto,
                            quantidade_minima: Number(e.target.value),
                            ...(calcularMinimo && {
                              quantidade_minima: Math.round(Number(e.target.value))
                            })
                          })}
                          className="bg-gray-800 border-gray-700 text-gray-100 rounded-r-none"
                        />
                        <div className="flex items-center justify-center bg-gray-700 px-3 border border-l-0 rounded-r-md">
                          <Percent className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantidade Mínima*</Label>
                      <div className="flex">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Ex: 10"
                          value={editedProduto.quantidade_minima?.toString() || ""}
                          onChange={(e) => setEditedProduto({
                            ...editedProduto,
                            quantidade_minima: Number(e.target.value)
                          })}
                          disabled={calcularMinimo}
                          required
                          className="bg-gray-800 border-gray-700 text-gray-100"
                        />
                        {!calcularMinimo && (
                          <button
                            type="button"
                            className="ml-2 px-3 border border-gray-700 rounded hover:bg-gray-800 flex items-center"
                            onClick={handleCalcMinimo}
                            title="Calcular com o percentual definido"
                          >
                            <Calculator className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Fornecedor */}
                <div className="space-y-2">
                  <Label>Fornecedor Atual</Label>
                  <Popover open={fornecedorPopoverOpen} onOpenChange={setFornecedorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-2 text-left hover:bg-gray-700"
                      >
                        <span className="truncate">
                          {editedProduto.fornecedor_nome ? (
                            <div className="flex flex-col">
                              <span>{editedProduto.fornecedor_nome}</span>
                              <span className="text-xs text-gray-400">CNPJ: {editedProduto.fornecedor_cnpj}</span>
                            </div>
                          ) : "Selecione o fornecedor"}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[95vw] sm:w-[400px] p-0 bg-gray-800 border-gray-700">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar fornecedor..." 
                          className="h-9 bg-gray-800 border-gray-700"
                          value={fornecedorSearch}
                          onValueChange={setFornecedorSearch}
                        />
                        <CommandList className="max-h-[50vh] sm:max-h-[300px]">
                          <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              className="hover:bg-gray-700"
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
                                className="hover:bg-gray-700"
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
                                  <span className="text-xs text-gray-400">
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
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Depósito */}
                <div className="space-y-2">
                  <Label>Depósito/Localização*</Label>
                  <Select
                    value={editedProduto.deposito || ""}
                    onValueChange={(value) => setEditedProduto({...editedProduto, deposito: value})}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                      <SelectValue placeholder="Selecione o depósito" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
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
                    className="bg-gray-800 border-gray-700 text-gray-100"
                  />
                </div>
                
                {/* Detalhes */}
                <div className="md:col-span-2 space-y-2">
                  <Label>Detalhes</Label>
                  <Textarea
                    placeholder="Descrição, detalhes do produto, onde será utilizado, etc."
                    value={editedProduto.detalhes || ""}
                    onChange={(e) => setEditedProduto({...editedProduto, detalhes: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-gray-100"
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
                  className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 text-gray-100"
                  onClick={handleCancel}
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
        )}
      </div>
    </AppLayout>
  );
};

export default GestaoProdutos;