import { useState, useEffect } from "react";
import { ProductVersion } from "@/types/productVersion";
import { useProductVersioning } from "@/hooks/useProductVersioning";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductVersionHistory } from "./ProductVersionHistory";
import { ProductVersionComparison } from "./ProductVersionComparison";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  versao_atual?: number;
}

interface ProductVersionModalProps {
  isOpen: boolean;
  produto: Produto | null;
  onClose: () => void;
  onSave: () => void;
  ImageUploader?: React.ComponentType<any>;
  userId: string;
  userName: string;
  userEmail: string;
}

export const ProductVersionModal = ({
  isOpen,
  produto,
  onClose,
  onSave,
  ImageUploader,
  userId,
  userName,
  userEmail,
}: ProductVersionModalProps) => {
  const [motivo, setMotivo] = useState("");
  const [editedData, setEditedData] = useState<Partial<Produto>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [comparisonVersion, setComparisonVersion] = useState<number | null>(null);
  const { createNewVersion, loading } = useProductVersioning();

  useEffect(() => {
    if (produto) {
      setEditedData({
        codigo_estoque: produto.codigo_estoque,
        codigo_material: produto.codigo_material,
        nome: produto.nome,
        quantidade: produto.quantidade,
        quantidade_minima: produto.quantidade_minima,
        valor_unitario: produto.valor_unitario,
        unidade_de_medida: produto.unidade_de_medida,
        deposito: produto.deposito,
        prateleira: produto.prateleira,
        unidade: produto.unidade,
        detalhes: produto.detalhes,
        imagem: produto.imagem,
        data_criacao: produto.data_criacao,
        data_vencimento: produto.data_vencimento,
        fornecedor_id: produto.fornecedor_id,
        fornecedor_nome: produto.fornecedor_nome,
        fornecedor_cnpj: produto.fornecedor_cnpj,
      });
      setMotivo("");
      setShowHistory(false);
      setComparisonVersion(null);
    }
  }, [produto, isOpen]);

  const handleSaveVersion = async () => {
    if (!produto) return;

    const success = await createNewVersion(
      produto.id,
      editedData,
      motivo,
      userId,
      userName,
      userEmail
    );

    if (success) {
      onSave();
      onClose();
    }
  };

  const handleCompare = (version: ProductVersion) => {
    setComparisonVersion(version.versao);
  };

  const handleRestore = async (version: ProductVersion) => {
    if (!produto) return;
    
    setEditedData(version.dados);
    setMotivo(`Restauração da versão ${version.versao}`);
    setShowHistory(false);
  };

  if (!produto) return null;

  const currentVersion = produto.versao_atual || 1;
  const nextVersion = currentVersion + 1;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <DialogTitle className="text-xl">📝 Criar Nova Versão do Produto</DialogTitle>
            <DialogDescription>
              Você está criando a versão {nextVersion} do produto "{produto.nome}"
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-amber-800 dark:text-amber-300">
                  <strong>ATENÇÃO:</strong> Você está criando uma NOVA VERSÃO. Os dados
                  originais serão preservados para auditoria.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="motivo" className="flex items-center gap-2">
                    📋 Motivo da Alteração
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="motivo"
                    placeholder="Ex: Correção de estoque após inventário, ajuste de preço por fornecedor, atualização de dados cadastrais..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="min-h-[80px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 10 caracteres ({motivo.length}/10)
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">📦 Dados do Produto</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={editedData.nome || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, nome: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_material">Código Material</Label>
                      <Input
                        id="codigo_material"
                        value={editedData.codigo_material || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            codigo_material: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codigo_estoque">Código Estoque</Label>
                      <Input
                        id="codigo_estoque"
                        value={editedData.codigo_estoque || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            codigo_estoque: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        value={editedData.quantidade || 0}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            quantidade: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantidade_minima">Quantidade Mínima</Label>
                      <Input
                        id="quantidade_minima"
                        type="number"
                        value={editedData.quantidade_minima || 0}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            quantidade_minima: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valor_unitario">Valor Unitário</Label>
                      <Input
                        id="valor_unitario"
                        type="number"
                        step="0.01"
                        value={editedData.valor_unitario || 0}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            valor_unitario: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unidade_de_medida">Unidade de Medida</Label>
                      <Input
                        id="unidade_de_medida"
                        value={editedData.unidade_de_medida || ""}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            unidade_de_medida: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deposito">Depósito</Label>
                      <Input
                        id="deposito"
                        value={editedData.deposito || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, deposito: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prateleira">Prateleira</Label>
                      <Input
                        id="prateleira"
                        value={editedData.prateleira || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, prateleira: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="detalhes">Detalhes</Label>
                      <Textarea
                        id="detalhes"
                        value={editedData.detalhes || ""}
                        onChange={(e) =>
                          setEditedData({ ...editedData, detalhes: e.target.value })
                        }
                      />
                    </div>

                    {ImageUploader && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Imagem do Produto</Label>
                        <ImageUploader
                          currentImageUrl={editedData.imagem || ""}
                          onImageUploaded={(url: string) =>
                            setEditedData({ ...editedData, imagem: url })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Button
                    variant="outline"
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full"
                  >
                    {showHistory ? "Ocultar" : "Mostrar"} Histórico de Versões
                  </Button>

                  {showHistory && (
                    <div className="mt-4">
                      <ProductVersionHistory
                        productId={produto.id}
                        currentVersion={currentVersion}
                        onCompare={handleCompare}
                        onRestore={handleRestore}
                        maxVisible={3}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 px-6 py-4 shrink-0 border-t bg-background">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveVersion}
              disabled={loading || motivo.trim().length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Nova Versão (v{nextVersion})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {comparisonVersion && (
        <ProductVersionComparison
          isOpen={!!comparisonVersion}
          onClose={() => setComparisonVersion(null)}
          productId={produto.id}
          version1={comparisonVersion}
          version2={currentVersion}
        />
      )}
    </>
  );
};
