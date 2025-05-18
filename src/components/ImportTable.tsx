// components/ImportTable.tsx
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ImportedProduct } from "@/types/typesImportarPlanilha";
import { Database, Trash2, Edit, Check, X } from "lucide-react";
import { useState } from "react";

interface ImportTableProps {
  products: ImportedProduct[];
  onRemoveProduct: (index: number) => void;
  onUpdateProduct: (index: number, updatedProduct: ImportedProduct) => void;
  onUploadProduct: (index: number, product: ImportedProduct) => Promise<void>;
}

const columns = [
  { key: "codigo_estoque", label: "Código Estoque", type: "text" },
  { key: "nome", label: "Nome", type: "text" },
  { key: "quantidade", label: "Quantidade", type: "number" },
  { key: "unidade_de_medida", label: "U.M", type: "text" },
  { key: "detalhes", label: "Detalhes", type: "text" },
];

export function ImportTable({
  products,
  onRemoveProduct,
  onUpdateProduct,
  onUploadProduct,
}: ImportTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<ImportedProduct | null>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...products[index] });
  };

  const handleSave = (index: number) => {
    if (editData) {
      onUpdateProduct(index, editData);
      setEditingIndex(null);
      setEditData(null);
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

  const handleUpload = async (index: number, product: ImportedProduct) => {
    setIsUploading(index);
    try {
      await onUploadProduct(index, product);
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.label}</TableHead>
            ))}
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={`${index}-${column.key}`}>
                  {editingIndex === index ? (
                    <Input
                      type={column.type || 'text'}
                      value={editData?.[column.key as keyof ImportedProduct] || ''}
                      onChange={(e) => handleChange(
                        column.key as keyof ImportedProduct, 
                        column.type === 'number' ? Number(e.target.value) : e.target.value
                      )}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    column.key === 'quantidade' 
                      ? Number(product[column.key as keyof ImportedProduct]).toLocaleString() 
                      : product[column.key as keyof ImportedProduct]
                  )}
                </TableCell>
              ))}
              <TableCell className="flex space-x-2">
                {editingIndex === index ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveProduct(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpload(index, product)}
                      disabled={isUploading === index}
                      className="h-8 w-8 p-0"
                    >
                      <Database className="h-4 w-4 text-purple-500" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}