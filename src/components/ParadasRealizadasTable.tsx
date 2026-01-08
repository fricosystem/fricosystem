import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ImportedParadaRealizada } from "@/types/typesImportarPlanilha";
import { Database, Trash2, Edit, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ParadasRealizadasTableProps {
  paradas: ImportedParadaRealizada[];
  onRemoveParada: (index: number) => void;
  onUpdateParada: (index: number, updatedParada: ImportedParadaRealizada) => void;
  onUploadParada: (index: number, parada: ImportedParadaRealizada) => Promise<void>;
}

const columns = [
  { key: "setor", label: "Setor", type: "text" },
  { key: "patrimonio", label: "Patrimônio", type: "text" },
  { key: "equipamento", label: "Equipamento", type: "text" },
  { key: "tipoManutencao", label: "Tipo Manutenção", type: "text" },
  { key: "dataProgramada", label: "Data Programada", type: "text" },
  { key: "dataConclusao", label: "Data Conclusão", type: "text" },
  { key: "hrInicial", label: "Hr Inicial", type: "text" },
  { key: "hrFinal", label: "Hr Final", type: "text" },
  { key: "manutentorI", label: "Manutentor I", type: "text" },
  { key: "manutentorII", label: "Manutentor II", type: "text" },
  { key: "manutentorIII", label: "Manutentor III", type: "text" },
  { key: "manutentorIIII", label: "Manutentor IIII", type: "text" },
  { key: "tipoFalha", label: "Tipo Falha", type: "text" },
  { key: "descricaoMotivo", label: "Descrição Motivo", type: "text" },
  { key: "resolucao", label: "Resolução", type: "text" },
];

export function ParadasRealizadasTable({
  paradas,
  onRemoveParada,
  onUpdateParada,
  onUploadParada,
}: ParadasRealizadasTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<ImportedParadaRealizada | null>(null);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const { toast } = useToast();

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...paradas[index] });
  };

  const handleSave = (index: number) => {
    if (editData) {
      onUpdateParada(index, editData);
      setEditingIndex(null);
      setEditData(null);
      toast({
        title: "Sucesso",
        description: "Parada atualizada com sucesso.",
      });
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const handleChange = (key: keyof ImportedParadaRealizada, value: string) => {
    setEditData(prev => ({
      ...prev!,
      [key]: value
    }));
  };

  const handleUpload = async (index: number, parada: ImportedParadaRealizada) => {
    setIsUploading(index);
    try {
      await onUploadParada(index, parada);
      toast({
        title: "Sucesso",
        description: "Parada enviada para o Firestore.",
      });
    } catch (error) {
      console.error("Erro ao enviar parada:", error);
      toast({
        title: "Erro",
        description: "Falha ao enviar parada para o Firestore.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  return (
    <div className="rounded-md border border-gray-700 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-800">
            {columns.map((column) => (
              <TableHead key={column.key} className="text-gray-300 whitespace-nowrap">
                {column.label}
              </TableHead>
            ))}
            <TableHead className="text-right text-gray-300">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paradas.map((parada, index) => (
            <TableRow key={index} className="hover:bg-gray-800">
              {columns.map((column) => (
                <TableCell key={`${index}-${column.key}`} className="text-gray-300">
                  {editingIndex === index ? (
                    <Input
                      type={column.type || 'text'}
                      value={editData?.[column.key as keyof ImportedParadaRealizada] || ''}
                      onChange={(e) => handleChange(column.key as keyof ImportedParadaRealizada, e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-w-[100px]"
                    />
                  ) : (
                    <span className="whitespace-nowrap">
                      {parada[column.key as keyof ImportedParadaRealizada] || '-'}
                    </span>
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
                        onClick={() => onRemoveParada(index)}
                        className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 border-red-700"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpload(index, parada)}
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
