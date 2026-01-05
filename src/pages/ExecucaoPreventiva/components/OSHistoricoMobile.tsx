import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { History, ClipboardCheck, Clock, Package, User, Calendar, Search, ChevronRight, Wrench, FileText, CheckCircle2, Timer, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrdemFinalizada {
  id: string;
  setor: string;
  equipamento: string;
  descricao: string;
  responsavelChamado: string;
  manutentorNome: string;
  origensParada: string[];
  solucaoAplicada: string;
  observacoes: string;
  tempoTotal: number;
  tempoFormatado: string;
  inicioExecucao: Timestamp;
  fimExecucao: Timestamp;
  finalizadoEm: Timestamp;
  tipoManutencao?: string;
  produtosUtilizados: {
    id: string;
    nome: string;
    codigo_estoque: string;
    quantidade: number;
    unidade_de_medida: string;
  }[];
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

type FilterType = "todos" | "concluidas";

export function OSHistoricoMobile() {
  const [ordensConcluidas, setOrdensConcluidas] = useState<OrdemFinalizada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<OrdemFinalizada | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    const ordensRef = collection(db, "ordens_servico_finalizada");
    const q = query(ordensRef, orderBy("finalizadoEm", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrdemFinalizada[];
      setOrdensConcluidas(ordens);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenDetails = (os: OrdemFinalizada) => {
    setSelectedOS(os);
    setShowDetailsSheet(true);
  };

  const filteredOS = ordensConcluidas.filter((os) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      os.setor?.toLowerCase().includes(searchValue) ||
      os.equipamento?.toLowerCase().includes(searchValue) ||
      os.descricao?.toLowerCase().includes(searchValue) ||
      os.manutentorNome?.toLowerCase().includes(searchValue)
    );
  });

  const stats = {
    total: ordensConcluidas.length,
    concluidas: ordensConcluidas.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
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
          variant={activeFilter === "concluidas" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("concluidas")}
          className="rounded-full whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Concluídas
          <Badge variant="secondary" className="ml-2 bg-background/20">{stats.concluidas}</Badge>
        </Button>
      </div>

      {filteredOS.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Nenhuma ordem de serviço finalizada</p>
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

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {os.tipoManutencao && (
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-4 w-4" />
                    <span>{os.tipoManutencao}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{os.tempoFormatado}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="truncate">{os.manutentorNome}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                  Concluída
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {os.finalizadoEm && format(os.finalizadoEm.toDate(), "dd/MM/yy HH:mm")}
                </span>
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
            <SheetTitle className="text-xl">Detalhes da OS Concluída</SheetTitle>
          </SheetHeader>
          
          {selectedOS && (
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="produtos">Produtos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-5 pb-4">
                  {/* Header com Status */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                        Concluída
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold leading-tight">{selectedOS.equipamento}</h2>
                    <p className="text-base text-muted-foreground">{selectedOS.setor}</p>
                  </div>

                  {/* Timer */}
                  <div className="bg-primary/10 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-3">
                      <Timer className="h-6 w-6 text-primary" />
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Tempo de Execução</p>
                        <p className="text-2xl font-bold text-primary">{selectedOS.tempoFormatado}</p>
                      </div>
                    </div>
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
                        icon={<User className="h-5 w-5" />}
                        label="Manutentor"
                        value={selectedOS.manutentorNome || "Não informado"}
                      />
                      <InfoRow 
                        icon={<Calendar className="h-5 w-5" />}
                        label="Início"
                        value={selectedOS.inicioExecucao ? format(
                          selectedOS.inicioExecucao instanceof Timestamp 
                            ? selectedOS.inicioExecucao.toDate() 
                            : new Date(selectedOS.inicioExecucao), 
                          "dd/MM/yyyy 'às' HH:mm", 
                          { locale: ptBR }
                        ) : "-"}
                      />
                      <InfoRow 
                        icon={<Calendar className="h-5 w-5" />}
                        label="Fim"
                        value={selectedOS.fimExecucao ? format(
                          selectedOS.fimExecucao instanceof Timestamp 
                            ? selectedOS.fimExecucao.toDate() 
                            : new Date(selectedOS.fimExecucao), 
                          "dd/MM/yyyy 'às' HH:mm", 
                          { locale: ptBR }
                        ) : "-"}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Descrição */}
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">Descrição do Problema</h3>
                    <div className="bg-muted/50 rounded-xl p-4">
                      <p className="text-base leading-relaxed">
                        {selectedOS.descricao || "Nenhuma descrição fornecida"}
                      </p>
                    </div>
                  </div>

                  {/* Solução */}
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      Solução Aplicada
                    </h3>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <p className="text-base leading-relaxed">
                        {selectedOS.solucaoAplicada}
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

                  {/* Origens */}
                  {selectedOS.origensParada && selectedOS.origensParada.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold">Origens da Parada</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedOS.origensParada.map((origem, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm px-3 py-1.5">{origem}</Badge>
                          ))}
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
                </TabsContent>
                
                <TabsContent value="produtos" className="pb-4">
                  {selectedOS.produtosUtilizados && selectedOS.produtosUtilizados.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Produtos Utilizados
                      </h3>
                      <div className="bg-muted/30 rounded-xl overflow-hidden">
                        <div className="divide-y divide-border">
                          {selectedOS.produtosUtilizados.map((produto, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center justify-between p-4"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-base">{produto.nome}</p>
                                <p className="text-sm text-muted-foreground">{produto.codigo_estoque}</p>
                              </div>
                              <Badge variant="secondary">
                                {produto.quantidade} {produto.unidade_de_medida}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhum produto utilizado</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
