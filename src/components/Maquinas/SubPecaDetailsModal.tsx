import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Package, AlertCircle, DollarSign } from "lucide-react";

interface SubPeca {
  id: string;
  nome: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  emEstoque: number;
  estoqueMinimo: number;
  pecaId: string;
  pecaPaiId: string;
  valorUnitario: number;
  fornecedor: string;
  descricao: string;
}

interface SubPecaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subPeca: SubPeca | null;
  onEdit: (subPeca: SubPeca) => void;
}

export const SubPecaDetailsModal = ({
  open,
  onOpenChange,
  subPeca,
  onEdit,
}: SubPecaDetailsModalProps) => {
  if (!subPeca) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "bg-green-500";
      case "Atenção": return "bg-yellow-500";
      case "Crítico": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            Detalhes da Sub-peça: {subPeca.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-medium">{subPeca.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(subPeca.status)}>{subPeca.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{subPeca.fornecedor || "Não informado"}</p>
                </div>
              </div>
              {subPeca.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p className="text-sm">{subPeca.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estoque e Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estoque e Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Em Estoque</p>
                  <p className="text-2xl font-bold">{subPeca.emEstoque}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                  <p className="text-2xl font-bold text-yellow-600">{subPeca.estoqueMinimo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Unitário</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {subPeca.valorUnitario?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
              {subPeca.emEstoque <= subPeca.estoqueMinimo && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Estoque abaixo do mínimo!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={() => onEdit(subPeca)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Sub-peça
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
