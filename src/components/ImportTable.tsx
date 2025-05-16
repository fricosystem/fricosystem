import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UploadCloud } from "lucide-react";
import { ImportedProduct } from "@/types/typesImportarPlanilha";
import EditProductModal from "@/components/EditProductModal";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";

interface ImportTableProps {
  products: ImportedProduct[];
  onRemoveProduct: (index: number) => void;
  onUpdateProduct: (index: number, updatedProduct: ImportedProduct) => void;
}

const ImportTable: React.FC<ImportTableProps> = ({ 
  products, 
  onRemoveProduct,
  onUpdateProduct 
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ImportedProduct | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  
  const { toast } = useToast();

  const handleEdit = (product: ImportedProduct, index: number) => {
    setSelectedProduct(product);
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const handleSaveEdit = (product: ImportedProduct) => {
    if (selectedIndex !== null) {
      onUpdateProduct(selectedIndex, product);
    }
    setIsModalOpen(false);
  };
  
  const handleUploadSingle = async (product: ImportedProduct, index: number) => {
    setLoading(index);
    
    try {
      const productsRef = collection(db, "produtos");
      await addDoc(productsRef, {
        ...product,
        quantidade: Number(product.quantidade) || 0 // Ensure number conversion
      });
      
      toast({
        title: "Produto enviado",
        description: `Produto "${product.nome}" enviado com sucesso para o Firestore.`,
      });
    } catch (error) {
      console.error("Erro ao enviar produto:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar produto para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Safe number display with fallback
  const displayQuantity = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toString();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código Estoque</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.codigo_estoque || '-'}</TableCell>
                <TableCell>{product.nome || '-'}</TableCell>
                <TableCell>
                  {displayQuantity(product.quantidade)}
                </TableCell>
                <TableCell>{product.unidade_de_medida || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {product.detalhes || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(product, index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onRemoveProduct(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUploadSingle(product, index)}
                      disabled={loading === index}
                    >
                      <UploadCloud className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <EditProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ImportTable;