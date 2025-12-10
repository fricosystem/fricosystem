import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Wrench, User, Calendar, MapPin, AlertTriangle, Package, FileText, CheckCircle2 } from "lucide-react";

interface ProdutoUtilizado {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface ParadaMaquina {
  id: string;
  setor: string;
  equipamento: string;
  hrInicial: string;
  hrFinal: string;
  linhaParada: string;
  descricaoMotivo: string;
  observacao: string;
  origemParada: {
    automatizacao: boolean;
    terceiros: boolean;
    eletrica: boolean;
    mecanica: boolean;
    outro: boolean;
  };
  responsavelManutencao: string;
  tipoManutencao: string;
  solucaoAplicada: string;
  produtosUtilizados: ProdutoUtilizado[];
  valorTotalProdutos: number;
  criadoPor: string;
  criadoEm: any;
  status: string;
}

interface RelatorioParadaDetalhadoProps {
  parada: ParadaMaquina;
  responsavelNome: string;
}

const RelatorioParadaDetalhado: React.FC<RelatorioParadaDetalhadoProps> = ({
  parada,
  responsavelNome,
}) => {
  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    const tipos = [];
    if (origens?.automatizacao) tipos.push("Automatização");
    if (origens?.terceiros) tipos.push("Terceiros");
    if (origens?.eletrica) tipos.push("Elétrica");
    if (origens?.mecanica) tipos.push("Mecânica");
    if (origens?.outro) tipos.push("Outro");
    return tipos;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pendente":
        return { label: "Pendente", className: "bg-amber-500/20 text-amber-700 border-amber-500/30" };
      case "em_andamento":
        return { label: "Em Andamento", className: "bg-blue-500/20 text-blue-700 border-blue-500/30" };
      case "concluido":
        return { label: "Concluído", className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" };
      default:
        return { label: status, className: "" };
    }
  };

  const calcularTempoParada = () => {
    if (!parada.hrInicial || !parada.hrFinal) return null;
    const [hI, mI] = parada.hrInicial.split(":").map(Number);
    const [hF, mF] = parada.hrFinal.split(":").map(Number);
    const inicioMin = hI * 60 + mI;
    const fimMin = hF * 60 + mF;
    const diffMin = fimMin - inicioMin;
    if (diffMin <= 0) return null;
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;
    return horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;
  };

  const statusConfig = getStatusConfig(parada.status);
  const tempoParada = calcularTempoParada();
  const origensParada = getOrigensParada(parada.origemParada);

  return (
    <div className="space-y-5 pb-4">
      {/* Header com Status */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Badge className={`text-sm px-4 py-1.5 font-semibold ${statusConfig.className}`}>
            {statusConfig.label}
          </Badge>
          {tempoParada && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{tempoParada}</span>
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold leading-tight">{parada.equipamento}</h2>
        <p className="text-base text-muted-foreground">{parada.setor}</p>
      </div>

      <Separator />

      {/* Informações Gerais */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Informações Gerais
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <InfoRow 
            icon={<Calendar className="h-5 w-5" />}
            label="Data/Hora do Registro"
            value={parada.criadoEm ? format(parada.criadoEm.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "-"}
          />
          <InfoRow 
            icon={<Clock className="h-5 w-5" />}
            label="Período da Parada"
            value={`${parada.hrInicial || "--:--"} até ${parada.hrFinal || "--:--"}`}
          />
          <InfoRow 
            icon={<MapPin className="h-5 w-5" />}
            label="Linha Parada"
            value={parada.linhaParada || "Não informada"}
          />
          <InfoRow 
            icon={<Wrench className="h-5 w-5" />}
            label="Tipo de Manutenção"
            value={parada.tipoManutencao || "Não informado"}
          />
          <InfoRow 
            icon={<User className="h-5 w-5" />}
            label="Responsável"
            value={responsavelNome}
          />
        </div>
      </div>

      <Separator />

      {/* Origens da Parada */}
      {origensParada.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Origem da Parada
            </h3>
            <div className="flex flex-wrap gap-2">
              {origensParada.map((origem, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm px-3 py-1.5"
                >
                  {origem}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Descrição do Motivo */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Descrição do Motivo</h3>
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-base leading-relaxed">
            {parada.descricaoMotivo || "Nenhuma descrição fornecida"}
          </p>
        </div>
      </div>

      {/* Solução Aplicada */}
      {parada.solucaoAplicada && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Solução Aplicada
            </h3>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-base leading-relaxed">
                {parada.solucaoAplicada}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Observações */}
      {parada.observacao && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-base font-semibold">Observações</h3>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-base leading-relaxed italic">
                {parada.observacao}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Produtos Utilizados */}
      {parada.produtosUtilizados && parada.produtosUtilizados.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Produtos Utilizados
            </h3>
            <div className="bg-muted/30 rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {parada.produtosUtilizados.map((produto, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-base">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {produto.quantidade}x {formatCurrency(produto.valorUnitario)}
                      </p>
                    </div>
                    <span className="text-base font-semibold">
                      {formatCurrency(produto.valorTotal)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/10 p-4 flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(parada.valorTotalProdutos || 0)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Rodapé de Auditoria */}
      <Separator />
      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Informações de Auditoria
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">ID do Registro:</span>
            <p className="font-mono text-xs mt-0.5 break-all">{parada.id}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Criado por:</span>
            <p className="mt-0.5">{parada.criadoPor || "Sistema"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-muted-foreground mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-medium mt-0.5">{value}</p>
    </div>
  </div>
);

export default RelatorioParadaDetalhado;
