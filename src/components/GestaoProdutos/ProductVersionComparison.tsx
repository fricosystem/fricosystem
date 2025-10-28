import { useState, useEffect } from "react";
import { VersionComparison } from "@/types/productVersion";
import { ProductVersionService } from "@/services/productVersionService";
import { useProductVersioning } from "@/hooks/useProductVersioning";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProductVersionComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  version1: number;
  version2: number;
}

export const ProductVersionComparison = ({
  isOpen,
  onClose,
  productId,
  version1,
  version2,
}: ProductVersionComparisonProps) => {
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const { compareVersions } = useProductVersioning();

  useEffect(() => {
    if (isOpen && productId && version1 && version2) {
      loadComparison();
    }
  }, [isOpen, productId, version1, version2]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const result = await compareVersions(productId, version1, version2);
      setComparison(result);
    } catch (error) {
      console.error("Erro ao carregar comparação:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comparação de Versões
            <Badge variant="outline">v{version1}</Badge>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="default">v{version2}</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comparison ? (
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              {comparison.campos_alterados.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma alteração detectada entre estas versões.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      {comparison.campos_alterados.length} campo(s) alterado(s)
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {comparison.campos_alterados.map((campo) => (
                      <div
                        key={campo.campo}
                        className="border rounded-lg p-4 bg-card"
                      >
                        <div className="font-medium mb-3 flex items-center gap-2">
                          <Badge variant="secondary">
                            {ProductVersionService.getFieldLabel(campo.campo)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground font-medium">
                              Versão {version1} (Anterior)
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-3">
                              <span className="text-red-700 dark:text-red-400 font-mono text-sm">
                                {formatValue(campo.valor_antigo)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground font-medium">
                              Versão {version2} (Nova)
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded p-3">
                              <span className="text-green-700 dark:text-green-400 font-mono text-sm">
                                {formatValue(campo.valor_novo)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Campos não alterados:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.keys(comparison.dados_versao_nova)
                    .filter(
                      (key) =>
                        !comparison.campos_alterados.some((c) => c.campo === key)
                    )
                    .map((key) => (
                      <Badge key={key} variant="outline" className="justify-start">
                        {ProductVersionService.getFieldLabel(key)}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar a comparação entre as versões.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};
