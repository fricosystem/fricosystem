import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus, Package, AlertCircle, Calendar, DollarSign, Wrench } from "lucide-react";
import { useState } from "react";
import { AddSubPecaModal } from "./AddSubPecaModal";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";

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

interface Peca {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  categoria: "Mecânica" | "Elétrica" | "Hidráulica" | "Pneumática" | "Eletrônica" | "Estrutural" | "Rolamentos" | "Vedação" | "Lubrificação" | "Transmissão" | "Instrumentação" | "Refrigeração" | "Controle";
  status: "Normal" | "Atenção" | "Crítico";
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
  subPecas?: SubPeca[];
  x: number;
  y: number;
  equipamentoId: string;
  maquinaId?: string;
  conectadoCom?: string[];
}

interface PecaDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peca: Peca | null;
  equipamentoId: string;
  sistemaId: string;
  sistemas: any[];
  onSuccess: () => void;
  onEditPeca: (peca: Peca) => void;
  onSelectSubPeca?: (subPeca: SubPeca) => void;
}

export const PecaDetailsModal = ({
  open,
  onOpenChange,
  peca,
  equipamentoId,
  sistemaId,
  sistemas,
  onSuccess,
  onEditPeca,
  onSelectSubPeca,
}: PecaDetailsModalProps) => {
  const { toast } = useToast();
  const [showAddSubPeca, setShowAddSubPeca] = useState(false);
  const [editingSubPeca, setEditingSubPeca] = useState<SubPeca | null>(null);

  if (!peca) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Normal": return "bg-green-500";
      case "Atenção": return "bg-yellow-500";
      case "Crítico": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleDeleteSubPeca = async (subPecaId: string) => {
    if (!confirm("Deseja realmente excluir esta sub-peça?")) return;

    try {
      const novosSistemas = sistemas.map(sistema => {
        if (sistema.id === sistemaId) {
          return {
            ...sistema,
            pecas: (sistema.pecas || []).map((p: any) => {
              if (p.id === peca.id) {
                return {
                  ...p,
                  subPecas: (p.subPecas || []).filter((sp: any) => sp.id !== subPecaId)
                };
              }
              return p;
            })
          };
        }
        return sistema;
      });

      await updateDoc(doc(db, "equipamentos", equipamentoId), {
        sistemas: novosSistemas
      });

      toast({
        title: "Sucesso",
        description: "Sub-peça excluída com sucesso!",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao excluir sub-peça:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sub-peça.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubPeca = (subPeca: SubPeca) => {
    setEditingSubPeca(subPeca);
    setShowAddSubPeca(true);
  };

  const subPecas = peca.subPecas || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              Detalhes da Peça: {peca.nome}
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
                    <p className="font-medium">{peca.codigo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <Badge variant="outline">{peca.categoria}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(peca.status)}>{peca.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fornecedor</p>
                    <p className="font-medium">{peca.fornecedor || "Não informado"}</p>
                  </div>
                </div>
                {peca.descricao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-sm">{peca.descricao}</p>
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
                    <p className="text-2xl font-bold">{peca.emEstoque}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                    <p className="text-2xl font-bold text-yellow-600">{peca.estoqueMinimo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Unitário</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {peca.valorUnitario?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
                {peca.emEstoque <= peca.estoqueMinimo && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Estoque abaixo do mínimo!</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manutenção e Vida Útil */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Manutenção e Vida Útil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vida Útil Total</p>
                    <p className="font-medium">{peca.vidaUtil} horas</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vida Útil Restante</p>
                    <p className="font-medium">{peca.vidaUtilRestante} horas</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Última Manutenção
                    </p>
                    <p className="font-medium">
                      {peca.ultimaManutencao ? new Date(peca.ultimaManutencao).toLocaleDateString('pt-BR') : "Não realizada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Próxima Manutenção
                    </p>
                    <p className="font-medium">
                      {peca.proximaManutencao ? new Date(peca.proximaManutencao).toLocaleDateString('pt-BR') : "Não agendada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Custo de Manutenção</p>
                    <p className="font-medium">R$ {peca.custoManutencao?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Crítico</p>
                    <p className="font-medium">{peca.tempoCritico} horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sub-peças */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Sub-peças ({subPecas.length})</CardTitle>
                <Button 
                  size="sm"
                  onClick={() => {
                    setEditingSubPeca(null);
                    setShowAddSubPeca(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sub-peça
                </Button>
              </CardHeader>
              <CardContent>
                {subPecas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma sub-peça cadastrada
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subPecas.map((subPeca) => (
                      <div
                        key={subPeca.id}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onSelectSubPeca?.(subPeca)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{subPeca.nome}</h4>
                              <Badge className={getStatusColor(subPeca.status)} variant="outline">
                                {subPeca.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Código: {subPeca.codigo} • Estoque: {subPeca.emEstoque}/{subPeca.estoqueMinimo}
                            </p>
                          </div>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSubPeca(subPeca)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSubPeca(subPeca.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => onEditPeca(peca)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Peça
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddSubPecaModal
        open={showAddSubPeca}
        onOpenChange={(open) => {
          setShowAddSubPeca(open);
          if (!open) setEditingSubPeca(null);
        }}
        equipamentoId={equipamentoId}
        sistemaId={sistemaId}
        pecaId={peca.id}
        sistemas={sistemas}
        editingSubPeca={editingSubPeca}
        onSuccess={() => {
          setShowAddSubPeca(false);
          setEditingSubPeca(null);
          onSuccess();
        }}
      />
    </>
  );
};
