import React, { useState, useEffect } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle2, ChevronRight, Clock, Wrench } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoricoAcoesTimeline } from "@/components/ParadaMaquina/HistoricoAcoesTimeline";

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
  criadoEm: Timestamp;
  status: string;
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
}

export function HistoricoParadasMobile() {
  const [paradas, setParadas] = useState<ParadaMaquina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
        // Filtrar apenas paradas concluídas
        if (data.status === "concluido") {
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
    const searchValue = searchTerm.toLowerCase();
    return (
      parada.setor?.toLowerCase().includes(searchValue) ||
      parada.equipamento?.toLowerCase().includes(searchValue) ||
      parada.descricaoMotivo?.toLowerCase().includes(searchValue) ||
      parada.solucaoAplicada?.toLowerCase().includes(searchValue)
    );
  });

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? `${usuario.nome} (${usuario.cargo})` : responsavelId || "Não informado";
  };

  const getOrigensParada = (origens: ParadaMaquina["origemParada"]) => {
    if (!origens) return [];
    const tipos = [];
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

  return (
    <>
      <Card className="border-0 shadow-none flex flex-col h-full">
        <CardHeader className="px-0 py-3 sticky top-0 bg-background z-10">
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

        <CardContent className="px-0 pb-32 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-base text-muted-foreground">Carregando histórico...</span>
            </div>
          ) : filteredParadas.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma parada concluída</p>
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

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

                    <div className="flex justify-between items-center pt-1">
                      <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-sm px-3 py-1">
                        Concluído
                      </Badge>
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

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl px-4 pt-2 pb-6">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Detalhes da Parada</SheetTitle>
          </SheetHeader>
          {selectedParada && (
            <Tabs defaultValue="info" className="h-[calc(100%-80px)]">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="overflow-y-auto h-[calc(100%-60px)]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Setor</h4>
                    <p className="text-base">{selectedParada.setor}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Equipamento</h4>
                    <p className="text-base">{selectedParada.equipamento}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Tipo</h4>
                    <p className="text-base">{selectedParada.tipoManutencao || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Responsável</h4>
                    <p className="text-base">{getResponsavelNome(selectedParada.responsavelManutencao)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Hora Inicial</h4>
                    <p className="text-base">{selectedParada.hrInicial || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-muted-foreground">Hora Final</h4>
                    <p className="text-base">{selectedParada.hrFinal || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Descrição do Problema</h4>
                    <p className="text-base">{selectedParada.descricaoMotivo}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">Solução Aplicada</h4>
                    <p className="text-base">{selectedParada.solucaoAplicada || "-"}</p>
                  </div>
                  {selectedParada.origemParada && getOrigensParada(selectedParada.origemParada).length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-semibold text-xs text-muted-foreground">Origem</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getOrigensParada(selectedParada.origemParada).map((origem, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{origem}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedParada.produtosUtilizados && selectedParada.produtosUtilizados.length > 0 && (
                    <div className="col-span-2 border-t pt-3">
                      <h4 className="font-semibold text-xs text-muted-foreground mb-2">Produtos Utilizados</h4>
                      <div className="space-y-2">
                        {selectedParada.produtosUtilizados.map((produto, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{produto.nome} x{produto.quantidade}</span>
                            <span>{formatCurrency(produto.valorTotal)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                          <span>Total</span>
                          <span>{formatCurrency(selectedParada.valorTotalProdutos || 0)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="historico" className="overflow-y-auto h-[calc(100%-60px)]">
                <HistoricoAcoesTimeline historico={(selectedParada as any).historicoAcoes || []} />
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}