import { useMemo, useState } from "react";
import { Bell, CheckCheck, AlertTriangle, Package, Wrench, ClipboardList, PauseCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CATEGORIAS,
  CategoriaNotificacao,
  NotificacaoSistema,
  useNotificacoesSistema,
} from "@/hooks/useNotificacoesSistema";

const iconePorCategoria = (categoria: CategoriaNotificacao) => {
  switch (categoria) {
    case "estoque":
      return <Package className="h-4 w-4" />;
    case "manutencao":
      return <Wrench className="h-4 w-4" />;
    case "ordens":
      return <ClipboardList className="h-4 w-4" />;
    case "paradas":
      return <PauseCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const corPorNivel = (nivel: NotificacaoSistema["nivel"]) => {
  switch (nivel) {
    case "critico":
      return "text-destructive";
    case "alerta":
      return "text-amber-500";
    default:
      return "text-muted-foreground";
  }
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaNotificacao | "todas">("todas");
  const [somenteNaoLidas, setSomenteNaoLidas] = useState(false);

  const {
    notificacoes,
    totalNaoLidas,
    carregando,
    marcarComoLida,
    marcarTodasComoLidas,
    estaLida,
  } = useNotificacoesSistema();

  const filtradas = useMemo(() => {
    return notificacoes.filter((n) => {
      if (categoria !== "todas" && n.categoria !== categoria) return false;
      if (somenteNaoLidas && estaLida(n.id)) return false;
      return true;
    });
  }, [notificacoes, categoria, somenteNaoLidas, estaLida]);

  const abrirNotificacao = (n: NotificacaoSistema) => {
    marcarComoLida(n.id);
    setOpen(false);
    navigate(n.rota);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notificações">
          <Bell size={20} />
          {totalNaoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-xs"
            >
              {totalNaoLidas > 99 ? "99+" : totalNaoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h3 className="font-semibold text-sm">Notificações</h3>
            <p className="text-xs text-muted-foreground">
              {totalNaoLidas} não lida(s) de {notificacoes.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={marcarTodasComoLidas}
            disabled={totalNaoLidas === 0}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Marcar todas
          </Button>
        </div>

        <div className="flex items-center gap-2 p-3 border-b">
          <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaNotificacao | "todas")}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c.valor} value={c.valor} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={somenteNaoLidas ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSomenteNaoLidas((v) => !v)}
          >
            Não lidas
          </Button>
        </div>

        <ScrollArea className="h-[60vh] max-h-[420px]">
          {carregando ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando notificações...</div>
          ) : filtradas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtradas.map((n) => {
                const lida = estaLida(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => abrirNotificacao(n)}
                    className={`w-full text-left p-3 flex gap-3 hover:bg-accent transition-colors ${
                      lida ? "opacity-60" : ""
                    }`}
                  >
                    <span className={`mt-0.5 ${corPorNivel(n.nivel)}`}>
                      {n.nivel === "critico" ? <AlertTriangle className="h-4 w-4" /> : iconePorCategoria(n.categoria)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{n.titulo}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2">{n.descricao}</span>
                      <span className="block text-[11px] text-muted-foreground mt-1">
                        {n.data
                          ? `${formatDistanceToNow(n.data, { locale: ptBR })} atrás`
                          : "Sem data"}
                      </span>
                    </span>
                    {!lida && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
