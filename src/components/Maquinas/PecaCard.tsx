import { useState } from "react";
import { Edit, Trash2, Plus, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface SubPeca {
  id: string;
  nome: string;
  codigo: string;
  status: "Normal" | "Atenção" | "Crítico";
  emEstoque: number;
  estoqueMinimo: number;
}

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  categoria: "Mecânica" | "Elétrica" | "Hidráulica" | "Pneumática" | "Eletrônica" | "Estrutural" | "Rolamentos" | "Vedação" | "Lubrificação" | "Transmissão" | "Instrumentação" | "Refrigeração" | "Controle";
  status: "Normal" | "Atenção" | "Crítico";
  vidaUtil: number;
  vidaUtilRestante: number;
  proximaManutencao: string;
  emEstoque: number;
  estoqueMinimo: number;
  custoManutencao: number;
  fornecedor: string;
  x?: number;
  y?: number;
  ultimaManutencao?: string;
  tempoCritico?: number;
  valorUnitario?: number;
  dataUltimaCompra?: string;
  equipamentoId?: string;
  maquinaId?: string;
}

interface PecaCardProps {
  peca: Peca;
  subPecas: SubPeca[];
  onEdit: (peca: Peca) => void;
  onDelete: (id: string) => void;
  onAddSubPeca: (pecaId: string) => void;
  onEditSubPeca: (subPeca: SubPeca) => void;
  onDeleteSubPeca: (id: string) => void;
}

export const PecaCard = ({ peca, subPecas, onEdit, onDelete, onAddSubPeca, onEditSubPeca, onDeleteSubPeca }: PecaCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-green-500";
      case "Atenção":
        return "bg-yellow-500";
      case "Crítico":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Crítico":
        return "destructive";
      case "Atenção":
        return "secondary";
      default:
        return "default";
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "Mecânica":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Elétrica":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Hidráulica":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "";
    }
  };

  const vidaUtilPercentual = peca.vidaUtil > 0 ? (peca.vidaUtilRestante / peca.vidaUtil) * 100 : 0;
  const isEstoqueBaixo = peca.emEstoque < peca.estoqueMinimo;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{peca.nome}</CardTitle>
              <Badge className={getCategoriaColor(peca.categoria)}>{peca.categoria}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Código: {peca.codigo}</p>
          </div>
          <Badge variant={getStatusVariant(peca.status)}>{peca.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {peca.descricao && (
          <p className="text-sm text-muted-foreground">{peca.descricao}</p>
        )}

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Vida Útil Restante</span>
              <span className="font-medium">{vidaUtilPercentual.toFixed(0)}%</span>
            </div>
            <Progress value={vidaUtilPercentual} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Estoque</p>
              <p className={`font-medium ${isEstoqueBaixo ? "text-red-600" : ""}`}>
                {peca.emEstoque} / {peca.estoqueMinimo}
                {isEstoqueBaixo && <AlertTriangle className="inline h-3 w-3 ml-1" />}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Próxima Manutenção</p>
              <p className="font-medium">
                {peca.proximaManutencao ? new Date(peca.proximaManutencao).toLocaleDateString() : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Custo Manutenção</p>
              <p className="font-medium">R$ {peca.custoManutencao.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fornecedor</p>
              <p className="font-medium truncate">{peca.fornecedor || "-"}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Sub-peças ({subPecas.length})
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(peca)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir esta peça?")) {
                  onDelete(peca.id);
                }
              }}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSubPeca(peca.id)}
              className="w-full gap-2"
            >
              <Plus className="h-3 w-3" />
              Adicionar Sub-peça
            </Button>
            
            {subPecas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma sub-peça cadastrada
              </p>
            ) : (
              <div className="space-y-2">
                {subPecas.map((subPeca) => {
                  const isSubEstoqueBaixo = subPeca.emEstoque < subPeca.estoqueMinimo;
                  return (
                    <div
                      key={subPeca.id}
                      className="flex items-center justify-between p-2 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{subPeca.nome}</p>
                          <Badge variant={getStatusVariant(subPeca.status)} className="text-xs">
                            {subPeca.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{subPeca.codigo}</p>
                        <p className={`text-xs ${isSubEstoqueBaixo ? "text-red-600" : "text-muted-foreground"}`}>
                          Estoque: {subPeca.emEstoque} / {subPeca.estoqueMinimo}
                          {isSubEstoqueBaixo && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSubPeca(subPeca)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja excluir esta sub-peça?")) {
                              onDeleteSubPeca(subPeca.id);
                            }
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
