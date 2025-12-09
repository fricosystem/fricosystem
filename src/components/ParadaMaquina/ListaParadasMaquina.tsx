import React, { useState, useEffect } from "react";
import { collection, query, getDocs, Timestamp, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
  email: string;
  ativo: string;
}
const ListaParadasMaquina = () => {
  const {
    user
  } = useAuth();
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
        querySnapshot.forEach(doc => {
          const data = doc.data();
          usuariosData.push({
            id: doc.id,
            nome: data.nome || "",
            cargo: data.cargo || "",
            email: data.email || "",
            ativo: data.ativo || ""
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
      console.log("Buscando paradas de máquina...");
      const q = query(collection(db, "paradas_maquina"), orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      console.log("Total de paradas encontradas:", querySnapshot.size);
      const fetchedParadas: ParadaMaquina[] = [];
      querySnapshot.forEach(doc => {
        console.log("Parada:", doc.id, doc.data());
        fetchedParadas.push({
          id: doc.id,
          ...doc.data()
        } as ParadaMaquina);
      });
      setParadas(fetchedParadas);
    } catch (error: any) {
      console.error("Erro ao buscar paradas:", error);
      console.error("Código do erro:", error?.code);
      console.error("Mensagem:", error?.message);
      toast.error("Erro ao carregar as paradas de máquina");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchParadas();
  }, []);
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const filteredParadas = paradas.filter(parada => {
    const searchValue = searchTerm.toLowerCase();
    return parada.setor?.toLowerCase().includes(searchValue) || parada.equipamento?.toLowerCase().includes(searchValue) || parada.descricaoMotivo?.toLowerCase().includes(searchValue) || getResponsavelNome(parada.responsavelManutencao)?.toLowerCase().includes(searchValue) || parada.tipoManutencao?.toLowerCase().includes(searchValue);
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
      setParadas(prev => prev.map(p => p.id === paradaId ? {
        ...p,
        status: newStatus
      } : p));
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar o status");
    }
  };
  const atualizarManutencaoPeca = async (parada: ParadaMaquina, paradaId: string) => {
    try {
      if (!parada.equipamentoId) {
        console.warn("Parada não tem equipamentoId vinculado");
        return;
      }
      const equipamentoRef = doc(db, "equipamentos", parada.equipamentoId);
      const equipamentoDoc = await getDoc(equipamentoRef);
      if (!equipamentoDoc.exists()) {
        console.warn("Equipamento não encontrado");
        return;
      }
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
              proximaManutencao = calcularProximaManutencao(config.intervaloManutencao, config.tipoIntervalo || "dias");
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
                  proximaManutencao = calcularProximaManutencao(config.intervaloManutencao, config.tipoIntervalo || "dias");
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
            return {
              ...peca,
              subPecas
            };
          }
          return peca;
        });
        return {
          ...sistema,
          pecas
        };
      });
      await updateDoc(equipamentoRef, {
        sistemas: novosSistemas
      });
      console.log("Manutenção da peça atualizada com sucesso");
      toast.success("Manutenção da peça registrada e próxima data calculada!");
    } catch (error) {
      console.error("Erro ao atualizar manutenção da peça:", error);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs">Pendente</Badge>;
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs">Em andamento</Badge>;
      case "concluido":
        return <Badge variant="outline" className="bg-green-100 text-green-800 text-[10px] sm:text-xs">Concluído</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] sm:text-xs">{status}</Badge>;
    }
  };
  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? `${usuario.nome} (${usuario.cargo})` : responsavelId || "Não informado";
  };
  const getOrigensParada = (origens: {
    automatizacao: boolean;
    terceiros: boolean;
    eletrica: boolean;
    mecanica: boolean;
    outro: boolean;
  }) => {
    const tipos = [];
    if (origens?.automatizacao) tipos.push("Automatização");
    if (origens?.terceiros) tipos.push("Terceiros");
    if (origens?.eletrica) tipos.push("Elétrica");
    if (origens?.mecanica) tipos.push("Mecânica");
    if (origens?.outro) tipos.push("Outro");
    return tipos;
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return <Card className="border-0 shadow-none flex flex-col h-full">
      <CardHeader className="px-0 py-2 sm:py-4 sticky top-0 bg-background z-10">
        
        <div className="mt-2">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={handleSearch} className="pl-8 w-full text-xs sm:text-sm h-9" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-4 flex-1 overflow-y-auto">
        {loading ? <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Carregando...</span>
          </div> : filteredParadas.length === 0 ? <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Nenhuma parada encontrada</p>
          </div> : <div className="space-y-2">
            {filteredParadas.map(parada => <div key={parada.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{parada.equipamento}</div>
                    <div className="text-xs text-muted-foreground">{parada.setor}</div>
                  </div>
                  {getStatusBadge(parada.status)}
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{parada.tipoManutencao || "-"}</span>
                  <span>{parada.criadoEm && format(parada.criadoEm.toDate(), "dd/MM/yy HH:mm")}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setSelectedParada(parada)}>
                        Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto p-3 sm:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Detalhes da Parada</DialogTitle>
                      </DialogHeader>
                      {selectedParada && <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Setor</h4>
                            <p className="text-sm">{selectedParada.setor}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Equipamento</h4>
                            <p className="text-sm">{selectedParada.equipamento}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Tipo</h4>
                            <p className="text-sm">{selectedParada.tipoManutencao || "-"}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Linha Parada</h4>
                            <p className="text-sm">{selectedParada.linhaParada || "-"}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Hora Inicial</h4>
                            <p className="text-sm">{selectedParada.hrInicial || "-"}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Hora Fim</h4>
                            <p className="text-sm">{selectedParada.hrFinal || "-"}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Criado Em</h4>
                            <p className="text-sm">{selectedParada.criadoEm && format(selectedParada.criadoEm.toDate(), "dd/MM/yy HH:mm")}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-xs text-muted-foreground">Responsável</h4>
                            <p className="text-sm truncate">{getResponsavelNome(selectedParada.responsavelManutencao)}</p>
                          </div>
                          <div className="col-span-2">
                            <h4 className="font-semibold text-xs text-muted-foreground">Descrição</h4>
                            <p className="text-sm">{selectedParada.descricaoMotivo}</p>
                          </div>
                          <div className="col-span-2">
                            <h4 className="font-semibold text-xs text-muted-foreground">Solução</h4>
                            <p className="text-sm">{selectedParada.solucaoAplicada || "-"}</p>
                          </div>
                          {selectedParada.origemParada && getOrigensParada(selectedParada.origemParada).length > 0 && <div className="col-span-2">
                              <h4 className="font-semibold text-xs text-muted-foreground">Origem</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {getOrigensParada(selectedParada.origemParada).map((origem, index) => <Badge key={index} variant="secondary" className="text-[10px]">{origem}</Badge>)}
                              </div>
                            </div>}
                          {selectedParada.produtosUtilizados && selectedParada.produtosUtilizados.length > 0 && <div className="col-span-2 border-t pt-2">
                              <h4 className="font-semibold text-xs text-muted-foreground mb-2">Produtos</h4>
                              <div className="space-y-1">
                                {selectedParada.produtosUtilizados.map((produto: ProdutoUtilizado, index: number) => <div key={index} className="flex justify-between text-xs">
                                    <span>{produto.nome} x{produto.quantidade}</span>
                                    <span>{formatCurrency(produto.valorTotal)}</span>
                                  </div>)}
                                <div className="flex justify-between font-semibold text-xs pt-1 border-t">
                                  <span>Total</span>
                                  <span>{formatCurrency(selectedParada.valorTotalProdutos || 0)}</span>
                                </div>
                              </div>
                            </div>}
                          <div className="col-span-2 pt-2 border-t">
                            <h4 className="font-semibold text-xs text-muted-foreground mb-2">Status Atual</h4>
                            {getStatusBadge(selectedParada.status)}
                          </div>
                        </div>}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>)}
          </div>}
      </CardContent>
    </Card>;
};
export default ListaParadasMaquina;