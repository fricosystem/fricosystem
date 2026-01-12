import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Clock, User, Calendar, Search, ChevronRight, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemServico {
  id: string;
  setor: string;
  equipamento: string;
  descricaoOS: string;
  status: string;
  dataAberturaOS: string | null;
  responsavelChamado: string;
  criadoEm: any;
  // Campos adicionais para detalhes
  prioridade?: string;
  tipoManutencao?: string;
  observacoes?: string;
}

// Componente InfoRow
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

type FilterType = "todos" | "aberta" | "em_andamento" | "concluida";

export function HistoricoOS() {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    const fetchOrdens = async () => {
      try {
        setLoading(true);
        const ordensRef = collection(db, "ordens_servicos");
        const q = query(ordensRef, orderBy("criadoEm", "desc"));
        const snapshot = await getDocs(q);
        
        const ordensData: OrdemServico[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ordensData.push({
            id: doc.id,
            setor: data.setor || "",
            equipamento: data.equipamento || "",
            descricaoOS: data.descricaoOS || "",
            status: data.status || "aberta",
            dataAberturaOS: data.dataAberturaOS || null,
            responsavelChamado: data.responsavelChamado || "",
            criadoEm: data.criadoEm,
            prioridade: data.prioridade,
            tipoManutencao: data.tipoManutencao,
            observacoes: data.observacoes
          });
        });
        
        setOrdensServico(ordensData);
      } catch (error) {
        console.error("Erro ao buscar ordens de serviço:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdens();
  }, []);

  const handleOpenDetails = (os: OrdemServico) => {
    setSelectedOS(os);
    setShowDetailsSheet(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberta":
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Aberta</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Em Andamento</Badge>;
      case "em_execucao":
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Em Execução</Badge>;
      case "concluida":
        return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Concluída</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOS = ordensServico.filter((os) => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = (
      os.setor?.toLowerCase().includes(searchValue) ||
      os.equipamento?.toLowerCase().includes(searchValue) ||
      os.descricaoOS?.toLowerCase().includes(searchValue) ||
      os.responsavelChamado?.toLowerCase().includes(searchValue)
    );

    if (activeFilter === "todos") {
      return matchesSearch;
    }
    return matchesSearch && os.status === activeFilter;
  });

  const stats = {
    total: ordensServico.length,
    abertas: ordensServico.filter(os => os.status === "aberta").length,
    em_andamento: ordensServico.filter(os => os.status === "em_andamento" || os.status === "em_execucao").length,
    concluidas: ordensServico.filter(os => os.status === "concluida").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Barra de Busca */}
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 py-3">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar no histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full text-base h-14 rounded-xl"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeFilter === "todos" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("todos")}
          className="rounded-full whitespace-nowrap"
        >
          Todos
          <Badge variant="secondary" className="ml-2 bg-background/20">{stats.total}</Badge>
        </Button>
        <Button
          variant={activeFilter === "aberta" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("aberta")}
          className="rounded-full whitespace-nowrap"
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Abertas
          <Badge variant="secondary" className="ml-2 bg-background/20">{stats.abertas}</Badge>
        </Button>
        <Button
          variant={activeFilter === "em_andamento" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("em_andamento")}
          className="rounded-full whitespace-nowrap"
        >
          <Clock className="h-4 w-4 mr-1" />
          Em Andamento
          <Badge variant="secondary" className="ml-2 bg-background/20">{stats.em_andamento}</Badge>
        </Button>
        <Button
          variant={activeFilter === "concluida" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("concluida")}
          className="rounded-full whitespace-nowrap"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Concluídas
          <Badge variant="secondary" className="ml-2 bg-background/20">{stats.concluidas}</Badge>
        </Button>
      </div>

      {filteredOS.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhuma ordem de serviço encontrada</p>
          <p className="text-muted-foreground text-sm mt-1">O histórico aparecerá aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOS.map((os) => (
            <button
              key={os.id}
              onClick={() => handleOpenDetails(os)}
              className="w-full text-left bg-card border rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate">
                    {os.equipamento}
                  </h3>
                  <p className="text-base text-muted-foreground mt-1">
                    {os.setor}
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {os.descricaoOS}
              </p>

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="truncate">{os.responsavelChamado || "Não informado"}</span>
                </div>
                {os.dataAberturaOS && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(os.dataAberturaOS), "dd/MM/yy")}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                {getStatusBadge(os.status)}
                {os.dataAberturaOS && (
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(os.dataAberturaOS), "dd/MM/yy HH:mm")}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal de Detalhes - Sheet Bottom */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Detalhes da Ordem de Serviço</SheetTitle>
          </SheetHeader>
          
          {selectedOS && (
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              <div className="space-y-5 pb-4">
                {/* Header com Status */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(selectedOS.status)}
                  </div>
                  <h2 className="text-xl font-bold leading-tight">{selectedOS.equipamento}</h2>
                  <p className="text-base text-muted-foreground">{selectedOS.setor}</p>
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
                      icon={<User className="h-5 w-5" />}
                      label="Solicitante"
                      value={selectedOS.responsavelChamado || "Não informado"}
                    />
                    <InfoRow 
                      icon={<Calendar className="h-5 w-5" />}
                      label="Data de Abertura"
                      value={selectedOS.dataAberturaOS ? format(
                        new Date(selectedOS.dataAberturaOS), 
                        "dd/MM/yyyy 'às' HH:mm", 
                        { locale: ptBR }
                      ) : "-"}
                    />
                    {selectedOS.prioridade && (
                      <InfoRow 
                        icon={<AlertCircle className="h-5 w-5" />}
                        label="Prioridade"
                        value={selectedOS.prioridade}
                      />
                    )}
                    {selectedOS.tipoManutencao && (
                      <InfoRow 
                        icon={<Clock className="h-5 w-5" />}
                        label="Tipo de Manutenção"
                        value={selectedOS.tipoManutencao}
                      />
                    )}
                  </div>
                </div>

                <Separator />

                {/* Descrição */}
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Descrição do Problema</h3>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-base leading-relaxed">
                      {selectedOS.descricaoOS || "Nenhuma descrição fornecida"}
                    </p>
                  </div>
                </div>

                {/* Observações */}
                {selectedOS.observacoes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold">Observações</h3>
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-base leading-relaxed italic">
                          {selectedOS.observacoes}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Auditoria */}
                <Separator />
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Informações de Auditoria
                  </p>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID do Registro:</span>
                      <p className="font-mono text-xs mt-0.5 break-all">{selectedOS.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
