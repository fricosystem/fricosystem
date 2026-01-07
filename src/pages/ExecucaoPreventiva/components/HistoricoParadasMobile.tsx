import React, { useState, useEffect } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle2, ChevronRight, Clock, Wrench, XCircle, Calendar, User, FileText, AlertTriangle, Timer, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HistoricoAcoesTimeline } from "@/pages/ParadaMaquina/components/HistoricoAcoesTimeline";

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
  encarregadoNome?: string;
  tipoManutencao: string;
  tipoFalha?: string;
  solucaoAplicada: string;
  produtosUtilizados: ProdutoUtilizado[];
  valorTotalProdutos: number;
  criadoPor: string;
  criadoEm: Timestamp;
  status: string;
  tentativaAtual?: number;
  historicoAcoes?: any[];
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
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

type FilterType = "todos" | "concluidas" | "nao_executadas";

export function HistoricoParadasMobile() {
  const [paradas, setParadas] = useState<ParadaMaquina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usuariosRef = collection(db, "usuarios");
        const querySnapshot = await getDocs(usuariosRef);
        
        const usuariosData: Usuario[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id,
            nome: data.nome || "",
            cargo: data.cargo || "",
          });
        });
        
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const fetchParadas = async () => {
    setLoading(true);
    try {
      const paradasRef = collection(db, "paradas_maquina");
      const querySnapshot = await getDocs(paradasRef);
      
      const fetchedParadas: ParadaMaquina[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrar paradas concluídas ou não executadas
        if (data.status?.startsWith("concluido") || data.status === "nao_executada" || data.status === "cancelado") {
          fetchedParadas.push({
            id: doc.id,
            ...data
          } as ParadaMaquina);
        }
      });
      
      // Ordena por data de criação (mais recente primeiro)
      fetchedParadas.sort((a, b) => {
        const dateA = a.criadoEm?.toMillis?.() || 0;
        const dateB = b.criadoEm?.toMillis?.() || 0;
        return dateB - dateA;
      });
      
      setParadas(fetchedParadas);
    } catch (error) {
      console.error("Erro ao buscar paradas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParadas();
  }, []);

  const filteredParadas = paradas.filter((parada) => {
    // Filtro por texto
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = (
      parada.setor?.toLowerCase().includes(searchValue) ||
      parada.equipamento?.toLowerCase().includes(searchValue) ||
      parada.descricaoMotivo?.toLowerCase().includes(searchValue) ||
      parada.solucaoAplicada?.toLowerCase().includes(searchValue)
    );

    // Filtro por status
    if (activeFilter === "todos") return matchesSearch;
    if (activeFilter === "concluidas") return matchesSearch && parada.status?.startsWith("concluido");
    if (activeFilter === "nao_executadas") return matchesSearch && (parada.status === "nao_executada" || parada.status === "cancelado");
    
    return matchesSearch;
  });

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? usuario.nome : responsavelId || "Não informado";
  };

  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    if (!origens) return [];
    
    // Formato string (legado/novo)
    if (typeof origens === "string") {
      return origens ? [origens] : [];
    }
    
    // Formato objeto com booleans
    const tipos: string[] = [];
    if (origens.automatizacao) tipos.push("Automatização");
    if (origens.terceiros) tipos.push("Terceiros");
    if (origens.eletrica) tipos.push("Elétrica");
    if (origens.mecanica) tipos.push("Mecânica");
    if (origens.outro) tipos.push("Outro");
    return tipos;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcularTempoParada = (hrInicial: string, hrFinal: string) => {
    if (!hrInicial || !hrFinal) return null;
    const [hI, mI] = hrInicial.split(":").map(Number);
    const [hF, mF] = hrFinal.split(":").map(Number);
    const inicioMin = hI * 60 + mI;
    const fimMin = hF * 60 + mF;
    const diffMin = fimMin - inicioMin;
    if (diffMin <= 0) return null;
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;
    return horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
  };

  const openDetail = (parada: ParadaMaquina) => {
    setSelectedParada(parada);
    setIsDetailOpen(true);
  };

  const getStatusBadge = (status: string, tentativa?: number) => {
    if (status?.startsWith("concluido")) {
      const tentativaNum = tentativa || (status.match(/_(\d+)$/) ? Number(status.match(/_(\d+)$/)?.[1]) + 1 : 1);
      return (
        <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
          Concluído ({tentativaNum}ª)
        </Badge>
      );
    }
    if (status === "nao_executada" || status === "cancelado") {
      return (
        <Badge className="bg-rose-500/20 text-rose-700 border-rose-500/30">
          Não Executada
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Contagens para filtros
  const stats = {
    total: paradas.length,
    concluidas: paradas.filter(p => p.status?.startsWith("concluido")).length,
    naoExecutadas: paradas.filter(p => p.status === "nao_executada" || p.status === "cancelado").length
  };

  return (
    <>
      <Card className="border-0 shadow-none flex flex-col h-full">
        <CardHeader className="px-0 py-3 sticky top-0 bg-background z-10 space-y-3">
          {/* Barra de Busca */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar no histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 w-full text-base h-14 rounded-xl"
            />
          </div>

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
              className={`rounded-full whitespace-nowrap ${activeFilter === "concluidas" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Concluídas
              <Badge variant="secondary" className="ml-2 bg-background/20">{stats.concluidas}</Badge>
            </Button>
            <Button
              variant={activeFilter === "nao_executadas" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("nao_executadas")}
              className={`rounded-full whitespace-nowrap ${activeFilter === "nao_executadas" ? "bg-rose-600 hover:bg-rose-700" : ""}`}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Não Executadas
              <Badge variant="secondary" className="ml-2 bg-background/20">{stats.naoExecutadas}</Badge>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-32 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-base text-muted-foreground">Carregando histórico...</span>
            </div>
          ) : filteredParadas.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma parada encontrada</p>
              <p className="text-muted-foreground text-sm mt-1">
                {activeFilter === "todos" ? "O histórico aparecerá aqui" : "Nenhum registro com este filtro"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParadas.map((parada) => {
                const tempoParada = calcularTempoParada(parada.hrInicial, parada.hrFinal);
                return (
                  <button
                    key={parada.id}
                    onClick={() => openDetail(parada)}
                    className="w-full text-left bg-card border rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight truncate">
                          {parada.equipamento}
                        </h3>
                        <p className="text-base text-muted-foreground mt-1">
                          {parada.setor}
                        </p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {parada.tipoManutencao && (
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-4 w-4" />
                          <span>{parada.tipoManutencao}</span>
                        </div>
                      )}
                      {tempoParada && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{tempoParada}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-1 gap-2 flex-wrap">
                      {getStatusBadge(parada.status, parada.tentativaAtual)}
                      <span className="text-sm text-muted-foreground">
                        {parada.criadoEm && format(parada.criadoEm.toDate(), "dd/MM/yy HH:mm")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes - Sheet Bottom */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Detalhes da Parada</SheetTitle>
          </SheetHeader>
          {selectedParada && (
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="space-y-5 pb-4">
                  {/* Header com Status */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(selectedParada.status, selectedParada.tentativaAtual)}
                    </div>
                    <h2 className="text-xl font-bold leading-tight">{selectedParada.equipamento}</h2>
                    <p className="text-base text-muted-foreground">{selectedParada.setor}</p>
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
                        value={selectedParada.criadoEm ? format(selectedParada.criadoEm.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : "-"}
                      />
                      <InfoRow 
                        icon={<Clock className="h-5 w-5" />}
                        label="Período Programado"
                        value={`${selectedParada.hrInicial || "--:--"} até ${selectedParada.hrFinal || "--:--"}`}
                      />
                      <InfoRow 
                        icon={<Wrench className="h-5 w-5" />}
                        label="Tipo de Manutenção"
                        value={selectedParada.tipoManutencao || "Não informado"}
                      />
                      {selectedParada.tipoFalha && (
                        <InfoRow 
                          icon={<AlertTriangle className="h-5 w-5" />}
                          label="Tipo de Falha"
                          value={selectedParada.tipoFalha}
                        />
                      )}
                      <InfoRow 
                        icon={<User className="h-5 w-5" />}
                        label="Responsável (Criador)"
                        value={selectedParada.encarregadoNome || getResponsavelNome(selectedParada.responsavelManutencao)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Origens da Parada */}
                  {getOrigensParada(selectedParada.origemParada).length > 0 && (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-primary" />
                          Origem da Parada
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {getOrigensParada(selectedParada.origemParada).map((origem, index) => (
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
                        {selectedParada.descricaoMotivo || "Nenhuma descrição fornecida"}
                      </p>
                    </div>
                  </div>

                  {/* Solução Aplicada */}
                  {selectedParada.solucaoAplicada && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          Solução Aplicada
                        </h3>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                          <p className="text-base leading-relaxed">
                            {selectedParada.solucaoAplicada}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Observações */}
                  {selectedParada.observacao && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold">Observações</h3>
                        <div className="bg-muted/50 rounded-xl p-4">
                          <p className="text-base leading-relaxed italic">
                            {selectedParada.observacao}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Produtos Utilizados */}
                  {selectedParada.produtosUtilizados && selectedParada.produtosUtilizados.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          Produtos Utilizados
                        </h3>
                        <div className="bg-muted/30 rounded-xl overflow-hidden">
                          <div className="divide-y divide-border">
                            {selectedParada.produtosUtilizados.map((produto, index) => (
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
                              {formatCurrency(selectedParada.valorTotalProdutos || 0)}
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
                        <p className="font-mono text-xs mt-0.5 break-all">{selectedParada.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Criado por:</span>
                        <p className="mt-0.5">{selectedParada.encarregadoNome || getResponsavelNome(selectedParada.responsavelManutencao)}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="historico" className="pb-4">
                  <HistoricoAcoesTimeline historico={selectedParada.historicoAcoes || []} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
