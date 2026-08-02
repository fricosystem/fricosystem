import { useEffect, useMemo, useState } from "react";
import { Search, ChevronsDownUp, ChevronsUpDown, AlertTriangle, PackageX, CalendarClock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import NoComponente from "./NoComponente";
import { filtrarArvore, type NoArvore, type ResumoArvore } from "@/hooks/useArvoreSetor";

interface ArvoreComponentesProps {
  arvore: NoArvore[];
  resumo: ResumoArvore;
  onSelecionar: (no: NoArvore) => void;
  selecionadoId?: string | null;
}

const coletarIds = (nos: NoArvore[], acc: string[] = []): string[] => {
  nos.forEach((no) => {
    if (no.filhos.length > 0) {
      acc.push(no.id);
      coletarIds(no.filhos, acc);
    }
  });
  return acc;
};

const ArvoreComponentes = ({
  arvore,
  resumo,
  onSelecionar,
  selecionadoId,
}: ArvoreComponentesProps) => {
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const arvoreFiltrada = useMemo(() => filtrarArvore(arvore, busca), [arvore, busca]);

  // Ao buscar, abre automaticamente os nós que contêm o resultado.
  useEffect(() => {
    if (busca.trim()) {
      setExpandidos(new Set(coletarIds(arvoreFiltrada)));
    }
  }, [busca, arvoreFiltrada]);

  const toggle = (id: string) => {
    setExpandidos((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  };

  const expandirTudo = () => setExpandidos(new Set(coletarIds(arvore)));
  const recolherTudo = () => setExpandidos(new Set());

  const cards = [
    { label: "Sistemas", valor: resumo.totalSistemas, icone: Layers, cor: "text-foreground" },
    { label: "Peças / Sub-peças", valor: `${resumo.totalPecas}/${resumo.totalSubPecas}`, icone: Layers, cor: "text-foreground" },
    { label: "Críticos", valor: resumo.criticos, icone: AlertTriangle, cor: "text-destructive" },
    { label: "Sem estoque", valor: resumo.semEstoque, icone: PackageX, cor: "text-yellow-600" },
    { label: "Preventivas ≤30d", valor: resumo.preventivasProximas, icone: CalendarClock, cor: "text-foreground" },
    { label: "Risco de parada", valor: resumo.riscoDeParada, icone: AlertTriangle, cor: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                <card.icone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{card.label}</span>
              </div>
              <div className={`mt-1 text-lg font-bold sm:text-2xl ${card.cor}`}>{card.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar sistema, peça ou sub-peça..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandirTudo} className="flex-1 sm:flex-none">
            <ChevronsUpDown className="mr-2 h-4 w-4" />
            Expandir tudo
          </Button>
          <Button variant="outline" size="sm" onClick={recolherTudo} className="flex-1 sm:flex-none">
            <ChevronsDownUp className="mr-2 h-4 w-4" />
            Recolher tudo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-3">
          {arvoreFiltrada.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {arvore.length === 0
                ? "Nenhum sistema cadastrado nesta máquina."
                : "Nenhum componente encontrado para a busca."}
            </p>
          ) : (
            <div className="max-h-[65vh] space-y-0.5 overflow-y-auto">
              {arvoreFiltrada.map((no) => (
                <NoComponente
                  key={no.id}
                  no={no}
                  nivel={0}
                  expandidos={expandidos}
                  onToggle={toggle}
                  onSelecionar={onSelecionar}
                  selecionadoId={selecionadoId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArvoreComponentes;