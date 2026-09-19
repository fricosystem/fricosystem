import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ImportedEquipment } from "@/types/typesImportarPlanilha";
import { Database, Trash2, Edit, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EquipmentTableProps {
  equipments: ImportedEquipment[];
  onRemoveEquipment: (index: number) => void;
  onUpdateEquipment: (index: number, updatedEquipment: ImportedEquipment) => void;
  onUploadEquipment: (index: number, equipment: ImportedEquipment) => Promise<void>;
}

const columns = [
  { key: "patrimonio", label: "Patrimônio", type: "text" },
  { key: "equipamento", label: "Equipamento", type: "text" },
  { key: "setor", label: "Setor", type: "text" },
  { key: "tag", label: "Tag", type: "text" },
];

export function EquipmentTable({
  equipments,
  onRemoveEquipment,
  onUpdateEquipment,
  onUploadEquipment,
}: EquipmentTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<ImportedEquipment | null>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const { toast } = useToast();

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...equipments[index] });
  };

  const handleSave = (index: number) => {
    if (editData) {
      onUpdateEquipment(index, editData);
      setEditingIndex(null);
      setEditData(null);
      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso.",
      });
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const handleChange = (key: keyof ImportedEquipment, value: string) => {
    setEditData(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  const handleUpload = async (index: number, equipment: ImportedEquipment) => {
    setIsUploading(index);
    try {
      await onUploadEquipment(index, equipment);
      toast({
        title: "Sucesso",
        description: "Equipamento enviado para o Firestore.",
      });
    } catch (error) {
      console.error("Erro ao enviar equipamento:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar equipamento para o Firestore.",
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
          {equipments.map((equipment, index) => (
            <TableRow key={index} className="hover:bg-gray-800">
              {columns.map((column) => (
                <TableCell key={`${index}-${column.key}`} className="text-gray-300">
                  {editingIndex === index ? (
                    <Input
                      type={column.type || 'text'}
                      value={editData?.[column.key as keyof ImportedEquipment] || ''}
                      onChange={(e) => handleChange(column.key as keyof ImportedEquipment, e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  ) : (
                    equipment[column.key as keyof ImportedEquipment] || '-'
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
                        onClick={() => onRemoveEquipment(index)}
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 border-red-700"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpload(index, equipment)}
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
}