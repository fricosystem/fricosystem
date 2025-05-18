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
import { Input } from "@/components/ui/input";
import { Database, Trash2, Edit, Check, X } from "lucide-react";
import { ImportedProduct } from "@/types/typesImportarPlanilha";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useToast } from "@/components/ui/use-toast";

interface ImportarPlanilhasProps {
  products: ImportedProduct[];
  onRemoveProduct: (index: number) => void;
  onUpdateProduct: (index: number, updatedProduct: ImportedProduct) => void;
}

const columns = [
  { key: "codigo_estoque", label: "Código Estoque", type: "text" },
  { key: "nome", label: "Nome", type: "text" },
  { key: "quantidade", label: "Quantidade", type: "number" },
  { key: "unidade_de_medida", label: "Unidade", type: "text" },
  { key: "detalhes", label: "Detalhes", type: "text" },
];

const ImportarPlanilhas: React.FC<ImportarPlanilhasProps> = ({ 
  products, 
  onRemoveProduct,
  onUpdateProduct 
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<ImportedProduct | null>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const { toast } = useToast();

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...products[index] });
  };

  const handleSave = (index: number) => {
    if (editData) {
      onUpdateProduct(index, editData);
      setEditingIndex(null);
      setEditData(null);
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso.",
      });
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const handleChange = (key: keyof ImportedProduct, value: string | number) => {
    setEditData(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  const handleUploadSingle = async (index: number, product: ImportedProduct) => {
    setIsUploading(index);
    try {
      const productsRef = collection(db, "produtos");
      await addDoc(productsRef, {
        ...product,
        quantidade: Number(product.quantidade) || 0
      });
      
      toast({
        title: "Sucesso",
        description: `Produto "${product.nome}" enviado para o Firestore.`,
      });
    } catch (error) {
      console.error("Erro ao enviar produto:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar produto para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="rounded-md border border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-800">
            {columns.map((column) => (
              <TableHead key={column.key} className="text-gray-300">
                {column.label}
              </TableHead>
            ))}
            <TableHead className="text-right text-gray-300">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={index} className="hover:bg-gray-800">
              {columns.map((column) => (
                <TableCell key={`${index}-${column.key}`} className="text-gray-300">
                  {editingIndex === index ? (
                    <Input
                      type={column.type || 'text'}
                      value={editData?.[column.key as keyof ImportedProduct] || ''}
                      onChange={(e) => handleChange(
                        column.key as keyof ImportedProduct, 
                        column.type === 'number' ? Number(e.target.value) : e.target.value
                      )}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  ) : (
                    column.key === 'quantidade' 
                      ? Number(product[column.key as keyof ImportedProduct]).toString() 
                      : product[column.key as keyof ImportedProduct] || '-'
                  )}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {editingIndex === index ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(index)}
                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 border-green-700"
                      >
                        <Check className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 border-red-700"
                      >
                        <X className="h-4 w-4 text-white" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(index)}
                        className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 border-blue-700"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveProduct(index)}
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 border-red-700"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUploadSingle(index, product)}
                        disabled={isUploading === index}
                        className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 border-purple-700"
                      >
                        <Database className="h-4 w-4 text-white" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ImportarPlanilhas;