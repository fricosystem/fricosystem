import { ChevronRight, Cpu, Package, Puzzle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NoArvore } from "@/hooks/useArvoreSetor";
import { corVidaUtil } from "@/utils/vidaUtilPeca";

interface NoComponenteProps {
  no: NoArvore;
  nivel: number;
  expandidos: Set<string>;
  onToggle: (id: string) => void;
  onSelecionar: (no: NoArvore) => void;
  selecionadoId?: string | null;
}

const iconePorTipo = (tipo: NoArvore["tipo"]) => {
  if (tipo === "sistema") return Cpu;
  if (tipo === "peca") return Package;
  return Puzzle;
};

const variantePorRisco = (risco: NoArvore["riscoAgregado"]): "default" | "secondary" | "destructive" =>
  risco === "Crítico" ? "destructive" : risco === "Atenção" ? "secondary" : "default";

const NoComponente = ({
  no,
  nivel,
  expandidos,
  onToggle,
  onSelecionar,
  selecionadoId,
}: NoComponenteProps) => {
  const temFilhos = no.filhos.length > 0;
  const aberto = expandidos.has(no.id);
  const Icone = iconePorTipo(no.tipo);
  const percentual = no.avaliacao.percentualVida;
  const selecionado = selecionadoId === no.id;

  return (
    <div className="min-w-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelecionar(no)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelecionar(no);
          }
        }}
        className={cn(
          "group flex items-start gap-2 rounded-lg border border-transparent px-2 py-2 transition-colors sm:gap-3 sm:px-3",
          "hover:border-border hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selecionado && "border-primary/60 bg-primary/5",
          no.avaliacao.riscoDeParada && "border-destructive/40 bg-destructive/5"
        )}
        style={{ paddingLeft: `${8 + nivel * 14}px` }}
      >
        <button
          type="button"
          aria-label={aberto ? "Recolher" : "Expandir"}
          onClick={(e) => {
            e.stopPropagation();
            if (temFilhos) onToggle(no.id);
          }}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-transform",
            temFilhos ? "text-muted-foreground hover:bg-muted" : "opacity-0 pointer-events-none",
            aberto && "rotate-90"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium sm:text-base">{no.nome}</span>
            {no.codigo && (
              <span className="truncate font-mono text-[11px] text-muted-foreground sm:text-xs">
                {no.codigo}
              </span>
            )}
            <Badge variant={variantePorRisco(no.riscoAgregado)} className="text-[10px] sm:text-xs">
              {no.riscoAgregado}
            </Badge>
            {no.avaliacao.riscoDeParada && (
              <Badge variant="destructive" className="gap-1 text-[10px] sm:text-xs">
                <AlertTriangle className="h-3 w-3" />
                Risco de parada
              </Badge>
            )}
            {temFilhos && (
              <span className="text-[11px] text-muted-foreground sm:text-xs">
                {no.filhos.length} {no.tipo === "sistema" ? "peça(s)" : "sub-peça(s)"}
              </span>
            )}
          </div>

          {no.tipo !== "sistema" && (
            <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", corVidaUtil(percentual))}
                    style={{ width: `${percentual ?? 0}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                  {percentual === null ? "Vida útil n/d" : `${percentual.toFixed(0)}% vida útil`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
                <span className={cn(no.avaliacao.semEstoque && "font-medium text-destructive")}>
                  Estoque: {no.emEstoque ?? "—"}
                  {no.estoqueMinimo !== null ? `/${no.estoqueMinimo}` : ""}
                  {no.estoqueDoAlmoxarifado && " (almox.)"}
                </span>
                {no.avaliacao.diasParaManutencao !== null && (
                  <span
                    className={cn(
                      no.avaliacao.manutencaoVencida && "font-medium text-destructive"
                    )}
                  >
                    {no.avaliacao.manutencaoVencida
                      ? `Preventiva vencida (${Math.abs(no.avaliacao.diasParaManutencao)}d)`
                      : `Preventiva em ${no.avaliacao.diasParaManutencao}d`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {temFilhos && aberto && (
        <div className="border-l border-border/60" style={{ marginLeft: `${16 + nivel * 14}px` }}>
          {no.filhos.map((filho) => (
            <NoComponente
              key={filho.id}
              no={filho}
              nivel={nivel + 1}
              expandidos={expandidos}
              onToggle={onToggle}
              onSelecionar={onSelecionar}
              selecionadoId={selecionadoId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NoComponente;