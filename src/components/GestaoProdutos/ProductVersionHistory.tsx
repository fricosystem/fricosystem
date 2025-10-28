import { useState, useEffect } from "react";
import { ProductVersion } from "@/types/productVersion";
import { ProductVersionService } from "@/services/productVersionService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  User, 
  FileText, 
  GitBranch,
  Eye,
  RotateCcw,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductVersionHistoryProps {
  productId: string;
  currentVersion: number;
  onViewDetails?: (version: ProductVersion) => void;
  onCompare?: (version: ProductVersion) => void;
  onRestore?: (version: ProductVersion) => void;
  maxVisible?: number;
}

export const ProductVersionHistory = ({
  productId,
  currentVersion,
  onViewDetails,
  onCompare,
  onRestore,
  maxVisible = 5,
}: ProductVersionHistoryProps) => {
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadVersions();
  }, [productId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const history = await ProductVersionService.getVersionHistory(productId);
      setVersions(history);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVersionBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "criacao":
        return "default";
      case "edicao":
        return "secondary";
      case "desativacao":
        return "destructive";
      case "restauracao":
        return "outline";
      default:
        return "default";
    }
  };

  const getVersionLabel = (tipo: string) => {
    switch (tipo) {
      case "criacao":
        return "Criação";
      case "edicao":
        return "Edição";
      case "desativacao":
        return "Desativação";
      case "restauracao":
        return "Restauração";
      default:
        return tipo;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum histórico encontrado</p>
      </div>
    );
  }

  const displayedVersions = showAll ? versions : versions.slice(0, maxVisible);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2">
        <GitBranch className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Histórico de Versões</h3>
        <Badge variant="secondary">{versions.length} versões</Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {displayedVersions.map((version, index) => (
            <div key={version.id} className="relative">
              {index < displayedVersions.length - 1 && (
                <div className="absolute left-3 top-12 bottom-0 w-px bg-border" />
              )}

              <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getVersionBadgeVariant(version.tipo_alteracao)}>
                        v{version.versao}
                      </Badge>
                      <Badge variant="outline">
                        {getVersionLabel(version.tipo_alteracao)}
                      </Badge>
                      {version.versao === currentVersion && (
                        <Badge variant="default">Atual</Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium">{version.motivo_alteracao}</p>

                    {version.campos_alterados && version.campos_alterados.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>Campos alterados:</span>
                        <div className="flex flex-wrap gap-1">
                          {version.campos_alterados.map((campo) => (
                            <Badge key={campo} variant="secondary" className="text-xs">
                              {ProductVersionService.getFieldLabel(campo)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(version.criado_em.toDate(), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.criado_por.nome}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {onViewDetails && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(version)}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onCompare && version.versao !== currentVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCompare(version)}
                        className="h-8"
                      >
                        <GitBranch className="h-4 w-4" />
                      </Button>
                    )}
                    {onRestore && version.versao !== currentVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestore(version)}
                        className="h-8"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {versions.length > maxVisible && (
        <>
          <Separator />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? "Mostrar menos"
              : `Ver histórico completo (${versions.length} versões)`}
          </Button>
        </>
      )}
    </div>
  );
};
