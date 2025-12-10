import React, { useState, useEffect } from "react";
import { collection, query, getDocs, Timestamp, orderBy, where, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, ChevronRight, Clock, Wrench, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { calcularProximaManutencao } from "@/utils/manutencaoUtils";
import RelatorioParadaDetalhado from "./RelatorioParadaDetalhado";

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
  pecaId?: string;
  subPecaId?: string;
  equipamentoId?: string;
  sistemaId?: string;
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
}

interface ParadasAbertasProps {
  onCountChange?: (count: number) => void;
  onStatsChange?: (stats: { abertas: number; emAndamento: number; concluidas: number; total: number }) => void;
}

const ParadasAbertas = ({ onCountChange, onStatsChange }: ParadasAbertasProps) => {
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
        querySnapshot.forEach(doc => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id,
            nome: data.nome || "",
            cargo: data.cargo || ""
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
      // Buscar todas as paradas para estatísticas
      const allQuery = query(collection(db, "paradas_maquina"), orderBy("criadoEm", "desc"));
      const allSnapshot = await getDocs(allQuery);
      
      const allParadas: ParadaMaquina[] = [];
      allSnapshot.forEach(doc => {
        allParadas.push({ id: doc.id, ...doc.data() } as ParadaMaquina);
      });

      // Calcular estatísticas
      const abertas = allParadas.filter(p => p.status === "pendente").length;
      const emAndamento = allParadas.filter(p => p.status === "em_andamento").length;
      const concluidas = allParadas.filter(p => p.status === "concluido").length;
      
      onStatsChange?.({
        abertas,
        emAndamento,
        concluidas,
        total: allParadas.length
      });

      // Filtrar apenas não concluídas
      const openParadas = allParadas.filter(p => p.status !== "concluido");
      setParadas(openParadas);
      onCountChange?.(openParadas.length);
    } catch (error: any) {
      console.error("Erro ao buscar paradas:", error);
      toast.error("Erro ao carregar paradas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParadas();
  }, []);

  const filteredParadas = paradas.filter(parada => {
    const searchValue = searchTerm.toLowerCase();
    return (
      parada.setor?.toLowerCase().includes(searchValue) ||
      parada.equipamento?.toLowerCase().includes(searchValue) ||
      parada.descricaoMotivo?.toLowerCase().includes(searchValue) ||
      getResponsavelNome(parada.responsavelManutencao)?.toLowerCase().includes(searchValue)
    );
  });

  const handleStatusChange = async (paradaId: string, newStatus: string) => {
    try {
      const paradaRef = doc(db, "paradas_maquina", paradaId);
      const paradaDoc = await getDoc(paradaRef);
      if (!paradaDoc.exists()) {
        toast.error("Parada não encontrada");
        return;
      }
      const parada = paradaDoc.data() as ParadaMaquina;
      await updateDoc(paradaRef, { status: newStatus });
      
      if (newStatus === "concluido" && (parada.pecaId || parada.subPecaId)) {
        await atualizarManutencaoPeca(parada, paradaId);
      }
      
      // Recarregar dados
      fetchParadas();
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar o status");
    }
  };

  const atualizarManutencaoPeca = async (parada: ParadaMaquina, paradaId: string) => {
    try {
      if (!parada.equipamentoId) return;
      const equipamentoRef = doc(db, "equipamentos", parada.equipamentoId);
      const equipamentoDoc = await getDoc(equipamentoRef);
      if (!equipamentoDoc.exists()) return;

      const equipamento = equipamentoDoc.data();
      const sistemas = equipamento.sistemas || [];
      const novosSistemas = sistemas.map((sistema: any) => {
        if (sistema.id !== parada.sistemaId) return sistema;
        const pecas = (sistema.pecas || []).map((peca: any) => {
          if (peca.id === parada.pecaId) {
            const config = peca.configuracaoManutencao;
            const dataAtual = new Date().toISOString().split("T")[0];
            let proximaManutencao = peca.proximaManutencao;
            if (config?.intervaloManutencao) {
              proximaManutencao = calcularProximaManutencao(
                config.intervaloManutencao,
                config.tipoIntervalo || "dias"
              );
            }
            return {
              ...peca,
              ultimaManutencao: dataAtual,
              proximaManutencao,
              vidaUtilRestante: peca.vidaUtil || peca.vidaUtilRestante,
              status: "Normal",
              historicoManutencoes: [...(peca.historicoManutencoes || []), paradaId]
            };
          }
          if (peca.subPecas && Array.isArray(peca.subPecas)) {
            const subPecas = peca.subPecas.map((subPeca: any) => {
              if (subPeca.id === parada.subPecaId) {
                const config = subPeca.configuracaoManutencao;
                const dataAtual = new Date().toISOString().split("T")[0];
                let proximaManutencao = subPeca.proximaManutencao;
                if (config?.intervaloManutencao) {
                  proximaManutencao = calcularProximaManutencao(
                    config.intervaloManutencao,
                    config.tipoIntervalo || "dias"
                  );
                }
                return {
                  ...subPeca,
                  ultimaManutencao: dataAtual,
                  proximaManutencao,
                  vidaUtilRestante: subPeca.vidaUtil || subPeca.vidaUtilRestante,
                  status: "Normal",
                  historicoManutencoes: [...(subPeca.historicoManutencoes || []), paradaId]
                };
              }
              return subPeca;
            });
            return { ...peca, subPecas };
          }
          return peca;
        });
        return { ...sistema, pecas };
      });
      await updateDoc(equipamentoRef, { sistemas: novosSistemas });
      toast.success("Manutenção da peça registrada!");
    } catch (error) {
      console.error("Erro ao atualizar manutenção:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return (
          <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-sm px-3 py-1.5">
            Pendente
          </Badge>
        );
      case "em_andamento":
        return (
          <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-sm px-3 py-1.5">
            Em andamento
          </Badge>
        );
      default:
        return <Badge className="text-sm px-3 py-1.5">{status}</Badge>;
    }
  };

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? `${usuario.nome} (${usuario.cargo})` : responsavelId || "Não informado";
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
              placeholder="Buscar parada..."
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
              <span className="text-base text-muted-foreground">Carregando...</span>
            </div>
          ) : filteredParadas.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma parada em aberto</p>
              <p className="text-muted-foreground text-sm mt-1">Todas as paradas foram concluídas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParadas.map(parada => {
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
                      {getStatusBadge(parada.status)}
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
          <div className="overflow-y-auto h-[calc(100%-80px)]">
            {selectedParada && (
              <RelatorioParadaDetalhado
                parada={selectedParada}
                responsavelNome={getResponsavelNome(selectedParada.responsavelManutencao)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ParadasAbertas;
