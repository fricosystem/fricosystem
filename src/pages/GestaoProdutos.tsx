import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/firebase/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { uploadImageToCloudinary, getOptimizedImageUrl } from "@/Cloudinary/cloudinaryUploadProdutos";
import {
  Plus,
  Loader2,
  Camera,
  X,
  Package
} from "lucide-react";
import AppLayout from "@/layouts/AppLayout";
import { SearchBar } from "@/components/GestaoProdutos/SearchBar";
import { ProductTable } from "@/components/GestaoProdutos/ProductTable";
import { DeleteConfirmModal } from "@/components/GestaoProdutos/DeleteConfirmModal";
import { EditProductModal } from "@/components/GestaoProdutos/EditProductModal";
import AddProdutoModal from "@/components/AddProdutoModal";
import { Button } from "@/components/ui/button";

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
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded"
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
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [page, setPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rowsPerPage = 20;
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProdutos();
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

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setIsEditModalOpen(true);
  };

  const handleSave = async (editedProduto: Partial<Produto>) => {
    if (!editingProduto) return;
    
    try {
      const produtoRef = doc(db, "produtos", editingProduto.id);
      await updateDoc(produtoRef, editedProduto);
      
      setProdutos(produtos.map(produto => 
        produto.id === editingProduto.id ? { ...produto, ...editedProduto } : produto
      ));
      
      setEditingProduto(null);
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
    setEditingProduto(null);
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
        
        <ProductTable
          produtos={filteredProdutos}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          totalProducts={filteredProdutos.length}
        />
      </>
    );
  };

  return (
    <AppLayout title="Gestão de Produtos">
      <div className="h-full flex flex-col">
        {renderContent()}
        
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
        
        <EditProductModal
          isOpen={isEditModalOpen}
          produto={editingProduto}
          onClose={handleCancel}
          onSave={handleSave}
          ImageUploader={ImageUploader}
        />

        <AddProdutoModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSuccess={fetchProdutos}
        />
      </div>
    </AppLayout>
  );
};

export default GestaoProdutos;