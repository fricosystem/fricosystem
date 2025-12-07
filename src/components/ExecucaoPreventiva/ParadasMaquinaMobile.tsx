import React, { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Search, Play, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calcularProximaManutencao } from "@/utils/manutencaoUtils";

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

export function ParadasMaquinaMobile() {
  const [paradas, setParadas] = useState<ParadaMaquina[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParada, setSelectedParada] = useState<ParadaMaquina | null>(null);

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
      const q = query(collection(db, "paradas_maquina"), orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedParadas: ParadaMaquina[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrar apenas paradas pendentes ou em andamento
        if (data.status === "pendente" || data.status === "em_andamento") {
          fetchedParadas.push({
            id: doc.id,
            ...data
          } as ParadaMaquina);
        }
      });
      
      setParadas(fetchedParadas);
    } catch (error) {
      console.error("Erro ao buscar paradas:", error);
      toast.error("Erro ao carregar as paradas de máquina");
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
      parada.descricaoMotivo?.toLowerCase().includes(searchValue)
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
      
      await updateDoc(paradaRef, {
        status: newStatus
      });
      
      if (newStatus === "concluido" && (parada.pecaId || parada.subPecaId)) {
        await atualizarManutencaoPeca(parada, paradaId);
      }
      
      // Remover da lista se concluído
      if (newStatus === "concluido") {
        setParadas(prev => prev.filter(p => p.id !== paradaId));
      } else {
        setParadas(prev => 
          prev.map(p => 
            p.id === paradaId ? { ...p, status: newStatus } : p
          )
        );
      }
      
      toast.success(`Status atualizado para ${newStatus === "em_andamento" ? "Em andamento" : "Concluído"}`);
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
            const dataAtual = new Date().toISOString().split('T')[0];
            
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
                const dataAtual = new Date().toISOString().split('T')[0];
                
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
      
      await updateDoc(equipamentoRef, {
        sistemas: novosSistemas
      });
      
      toast.success("Manutenção da peça registrada!");
    } catch (error) {
      console.error("Erro ao atualizar manutenção da peça:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-[10px]">Pendente</Badge>;
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 text-[10px]">Em andamento</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? usuario.nome : responsavelId || "Não informado";
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paradas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredParadas.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma parada pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredParadas.map((parada) => (
            <Card key={parada.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{parada.equipamento}</div>
                    <div className="text-sm text-muted-foreground">{parada.setor}</div>
                  </div>
                  {getStatusBadge(parada.status)}
                </div>
                
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {parada.descricaoMotivo}
                </div>
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{parada.tipoManutencao || "Não informado"}</span>
                  <span>{parada.criadoEm && format(parada.criadoEm.toDate(), "dd/MM HH:mm")}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedParada(parada)}
                      >
                        Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Parada</DialogTitle>
                      </DialogHeader>
                      {selectedParada && (
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Setor</h4>
                            <p>{selectedParada.setor}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Equipamento</h4>
                            <p>{selectedParada.equipamento}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Tipo</h4>
                            <p>{selectedParada.tipoManutencao || "-"}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Responsável</h4>
                            <p>{getResponsavelNome(selectedParada.responsavelManutencao)}</p>
                          </div>
                          <div className="col-span-2">
                            <h4 className="font-semibold text-xs text-muted-foreground">Descrição</h4>
                            <p>{selectedParada.descricaoMotivo}</p>
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
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {parada.status === "pendente" && (
                    <Button 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleStatusChange(parada.id, "em_andamento")}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button>
                  )}

                  {parada.status === "em_andamento" && (
                    <Button 
                      size="sm"
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange(parada.id, "concluido")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
