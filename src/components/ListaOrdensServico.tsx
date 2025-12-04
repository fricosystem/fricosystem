import React, { useState, useEffect } from "react";
import { collection, query, getDocs, Timestamp, orderBy, doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { calcularProximaManutencao } from "@/utils/manutencaoUtils";
import { OrdemServico } from "@/types/typesOrdemServico";

interface ProdutoUtilizado {
  produtoId: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  ativo: string;
}

const ListaOrdensServico = () => {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemServico | null>(null);

  // Carregar usuários para exibir o nome do responsável
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
            email: data.email || "",
            ativo: data.ativo || "",
          });
        });
        
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };

    fetchUsuarios();
  }, []);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "ordens_servicos"), orderBy("criadoEm", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedOrdens: OrdemServico[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrdens.push({
          id: doc.id,
          ...doc.data()
        } as OrdemServico);
      });
      
      setOrdens(fetchedOrdens);
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
      toast.error("Erro ao carregar as ordens de serviço");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredOrdens = ordens.filter((ordem) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      ordem.setor?.toLowerCase().includes(searchValue) ||
      ordem.equipamento?.toLowerCase().includes(searchValue) ||
      ordem.descricaoMotivo?.toLowerCase().includes(searchValue) ||
      getResponsavelNome(ordem.responsavelManutencao)?.toLowerCase().includes(searchValue) ||
      ordem.tipoManutencao?.toLowerCase().includes(searchValue)
    );
  });

  const handleStatusChange = async (ordemId: string, newStatus: string) => {
    try {
      const ordemRef = doc(db, "ordens_servicos", ordemId);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        toast.error("Ordem não encontrada");
        return;
      }
      
      const ordem = ordemDoc.data() as OrdemServico;
      
      // Atualizar status da ordem
      await updateDoc(ordemRef, {
        status: newStatus
      });
      
      // Se a ordem foi concluída E está vinculada a uma peça/sub-peça, atualizar manutenção
      if (newStatus === "concluido" && (ordem.pecaId || ordem.subPecaId)) {
        await atualizarManutencaoPeca(ordem, ordemId);
      }
      
      setOrdens(prev => 
        prev.map(o => 
          o.id === ordemId ? { ...o, status: newStatus } : o
        )
      );
      
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar o status");
    }
  };
  
  // Função auxiliar para atualizar manutenção da peça quando ordem é concluída
  const atualizarManutencaoPeca = async (ordem: OrdemServico, ordemId: string) => {
    try {
      if (!ordem.equipamentoId) {
        console.warn("Ordem não tem equipamentoId vinculado");
        return;
      }
      
      // Buscar o equipamento
      const equipamentoRef = doc(db, "equipamentos", ordem.equipamentoId);
      const equipamentoDoc = await getDoc(equipamentoRef);
      
      if (!equipamentoDoc.exists()) {
        console.warn("Equipamento não encontrado");
        return;
      }
      
      const equipamento = equipamentoDoc.data();
      const sistemas = equipamento.sistemas || [];
      
      // Encontrar e atualizar a peça/sub-peça
      const novosSistemas = sistemas.map((sistema: any) => {
        if (sistema.id !== ordem.sistemaId) return sistema;
        
        const pecas = (sistema.pecas || []).map((peca: any) => {
          // Se é a peça que estamos procurando
          if (peca.id === ordem.pecaId) {
            const config = peca.configuracaoManutencao;
            const dataAtual = new Date().toISOString().split('T')[0];
            
            // Calcular próxima manutenção se configuração existe
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
              vidaUtilRestante: peca.vidaUtil || peca.vidaUtilRestante, // Resetar vida útil
              status: "Normal", // Resetar status
              historicoManutencoes: [...(peca.historicoManutencoes || []), ordemId]
            };
          }
          
          // Verificar sub-peças
          if (peca.subPecas && Array.isArray(peca.subPecas)) {
            const subPecas = peca.subPecas.map((subPeca: any) => {
              if (subPeca.id === ordem.subPecaId) {
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
                  historicoManutencoes: [...(subPeca.historicoManutencoes || []), ordemId]
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
      
      // Atualizar equipamento no Firestore
      await updateDoc(equipamentoRef, {
        sistemas: novosSistemas
      });
      
      console.log("Manutenção da peça atualizada com sucesso");
      toast.success("Manutenção da peça registrada e próxima data calculada!");
    } catch (error) {
      console.error("Erro ao atualizar manutenção da peça:", error);
      // Não exibir erro para o usuário, apenas logar
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "em_andamento":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      case "concluido":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResponsavelNome = (responsavelId: string) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario ? `${usuario.nome} (${usuario.cargo})` : responsavelId || "Não informado";
  };

  const getOrigensParada = (origens: { automatizacao: boolean; terceiros: boolean; eletrica: boolean; mecanica: boolean; outro: boolean; }) => {
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

  return (
    <Card className="border-0 sm:border shadow-none sm:shadow">
      <CardHeader className="px-2 sm:px-6 py-3 sm:py-6">
        <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-center">Ordens de Serviço</CardTitle>
        <div className="mt-2 sm:mt-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 sm:pl-9 w-full text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-4">
        {loading ? (
          <div className="flex justify-center items-center py-8 sm:py-10">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-sm sm:text-base">Carregando...</span>
          </div>
        ) : filteredOrdens.length === 0 ? (
          <div className="text-center py-8 sm:py-10">
            <p className="text-muted-foreground text-sm">Nenhuma ordem encontrada</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-2">
              {filteredOrdens.map((ordem) => (
                <div key={ordem.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{ordem.equipamento}</div>
                      <div className="text-xs text-muted-foreground">{ordem.setor}</div>
                    </div>
                    {getStatusBadge(ordem.status)}
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{ordem.tipoManutencao || "-"}</span>
                    <span>{ordem.criadoEm && format(ordem.criadoEm.toDate(), "dd/MM/yy HH:mm")}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setSelectedOrdem(ordem)}
                        >
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto p-3 sm:p-6">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Detalhes da Ordem</DialogTitle>
                        </DialogHeader>
                        {selectedOrdem && (
                          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Setor</h4>
                              <p className="text-sm">{selectedOrdem.setor}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Equipamento</h4>
                              <p className="text-sm">{selectedOrdem.equipamento}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Tipo</h4>
                              <p className="text-sm">{selectedOrdem.tipoManutencao || "-"}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Linha Parada</h4>
                              <p className="text-sm">{selectedOrdem.linhaParada || "-"}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Hora Inicial</h4>
                              <p className="text-sm">{selectedOrdem.hrInicial || "-"}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Hora Fim</h4>
                              <p className="text-sm">{selectedOrdem.hrFinal || "-"}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Criado Em</h4>
                              <p className="text-sm">{selectedOrdem.criadoEm && format(selectedOrdem.criadoEm.toDate(), "dd/MM/yy HH:mm")}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-muted-foreground">Responsável</h4>
                              <p className="text-sm truncate">{getResponsavelNome(selectedOrdem.responsavelManutencao)}</p>
                            </div>
                            <div className="col-span-2">
                              <h4 className="font-semibold text-xs text-muted-foreground">Descrição</h4>
                              <p className="text-sm">{selectedOrdem.descricaoMotivo}</p>
                            </div>
                            <div className="col-span-2">
                              <h4 className="font-semibold text-xs text-muted-foreground">Solução</h4>
                              <p className="text-sm">{selectedOrdem.solucaoAplicada || "-"}</p>
                            </div>
                            {selectedOrdem.origemParada && getOrigensParada(selectedOrdem.origemParada).length > 0 && (
                              <div className="col-span-2">
                                <h4 className="font-semibold text-xs text-muted-foreground">Origem</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {getOrigensParada(selectedOrdem.origemParada).map((origem, index) => (
                                    <Badge key={index} variant="secondary" className="text-[10px]">{origem}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedOrdem.produtosUtilizados && selectedOrdem.produtosUtilizados.length > 0 && (
                              <div className="col-span-2 border-t pt-2">
                                <h4 className="font-semibold text-xs text-muted-foreground mb-2">Produtos</h4>
                                <div className="space-y-1">
                                  {selectedOrdem.produtosUtilizados.map((produto: ProdutoUtilizado, index: number) => (
                                    <div key={index} className="flex justify-between text-xs">
                                      <span>{produto.nome} x{produto.quantidade}</span>
                                      <span>{formatCurrency(produto.valorTotal)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between font-semibold text-xs pt-1 border-t">
                                    <span>Total</span>
                                    <span>{formatCurrency(selectedOrdem.valorTotalProdutos || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="col-span-2 pt-2 border-t">
                              <h4 className="font-semibold text-xs text-muted-foreground mb-2">Alterar Status</h4>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant={selectedOrdem.status === "pendente" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(selectedOrdem.id, "pendente")}
                                  className="text-xs h-7 px-2"
                                >
                                  Pendente
                                </Button>
                                <Button
                                  size="sm"
                                  variant={selectedOrdem.status === "em_andamento" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(selectedOrdem.id, "em_andamento")}
                                  className="text-xs h-7 px-2"
                                >
                                  Em Andamento
                                </Button>
                                <Button
                                  size="sm"
                                  variant={selectedOrdem.status === "concluido" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(selectedOrdem.id, "concluido")}
                                  className="text-xs h-7 px-2"
                                >
                                  Concluído
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs min-w-[80px]">Setor</TableHead>
                    <TableHead className="text-xs min-w-[120px]">Equipamento</TableHead>
                    <TableHead className="hidden md:table-cell text-xs min-w-[100px]">Peça</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs min-w-[80px]">Tipo</TableHead>
                    <TableHead className="text-xs min-w-[110px]">Data/Hora</TableHead>
                    <TableHead className="text-xs min-w-[90px]">Status</TableHead>
                    <TableHead className="text-xs min-w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrdens.map((ordem) => (
                    <TableRow key={ordem.id}>
                      <TableCell className="text-xs sm:text-sm py-2">{ordem.setor}</TableCell>
                      <TableCell className="text-xs sm:text-sm py-2">
                        <div>{ordem.equipamento}</div>
                        {ordem.geradaAutomaticamente && (
                          <Badge variant="secondary" className="text-[10px] mt-0.5">Auto</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground py-2">
                        {ordem.pecaNome || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs py-2">{ordem.tipoManutencao}</TableCell>
                      <TableCell className="text-xs py-2">
                        {ordem.criadoEm && format(ordem.criadoEm.toDate(), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell className="py-2">{getStatusBadge(ordem.status)}</TableCell>
                      <TableCell className="py-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => setSelectedOrdem(ordem)}
                            >
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Ordem de Serviço</DialogTitle>
                            </DialogHeader>
                            {selectedOrdem && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Setor</h4>
                                  <p>{selectedOrdem.setor}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Equipamento</h4>
                                  <p>{selectedOrdem.equipamento}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Tipo de Manutenção</h4>
                                  <p>{selectedOrdem.tipoManutencao || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Linha Parada</h4>
                                  <p>{selectedOrdem.linhaParada || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Hora Inicial</h4>
                                  <p>{selectedOrdem.hrInicial || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Hora Fim</h4>
                                  <p>{selectedOrdem.hrFinal || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Tempo de Parada</h4>
                                  <p>{selectedOrdem.tempoParada || "Não informado"}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-muted-foreground">Criado Em</h4>
                                  <p>{selectedOrdem.criadoEm && format(selectedOrdem.criadoEm.toDate(), "dd/MM/yyyy HH:mm")}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-muted-foreground">Responsável</h4>
                                  <p>{getResponsavelNome(selectedOrdem.responsavelManutencao)}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-muted-foreground">Descrição do Motivo</h4>
                                  <p>{selectedOrdem.descricaoMotivo}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-muted-foreground">Solução Aplicada</h4>
                                  <p>{selectedOrdem.solucaoAplicada || "Não informado"}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-muted-foreground">Origem da Parada</h4>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedOrdem.origemParada && getOrigensParada(selectedOrdem.origemParada).map((origem, index) => (
                                      <Badge key={index}>{origem}</Badge>
                                    ))}
                                    {(!selectedOrdem.origemParada || getOrigensParada(selectedOrdem.origemParada).length === 0) && 
                                      <span className="text-muted-foreground">Não informado</span>
                                    }
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                  <h4 className="font-semibold text-sm text-muted-foreground">Observação</h4>
                                  <p>{selectedOrdem.observacao || "Não informado"}</p>
                                </div>

                                {/* Seção de Produtos Utilizados */}
                                {selectedOrdem.produtosUtilizados && selectedOrdem.produtosUtilizados.length > 0 && (
                                  <div className="md:col-span-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground">Produtos Utilizados</h4>
                                    <div className="mt-2 border rounded-lg divide-y">
                                      {selectedOrdem.produtosUtilizados.map((produto: ProdutoUtilizado, index: number) => (
                                        <div key={index} className="p-2 sm:p-3 flex justify-between items-center text-sm">
                                          <div>
                                            <p className="font-medium">{produto.nome}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {produto.quantidade} x {formatCurrency(produto.valorUnitario)}
                                            </p>
                                          </div>
                                          <span>{formatCurrency(produto.valorTotal)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 text-right font-semibold">
                                      Total: {selectedOrdem.valorTotalProdutos ? formatCurrency(selectedOrdem.valorTotalProdutos) : "R$ 0,00"}
                                    </div>
                                  </div>
                                )}

                                <div className="md:col-span-2 mt-4">
                                  <h4 className="font-semibold text-sm text-muted-foreground">Alterar Status</h4>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Button 
                                      variant={selectedOrdem.status === "pendente" ? "default" : "outline"} 
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "pendente")}
                                      disabled={selectedOrdem.status === "pendente"}
                                    >
                                      Pendente
                                    </Button>
                                    <Button 
                                      variant={selectedOrdem.status === "em_andamento" ? "default" : "outline"} 
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "em_andamento")}
                                      disabled={selectedOrdem.status === "em_andamento"}
                                    >
                                      Em Andamento
                                    </Button>
                                    <Button 
                                      variant={selectedOrdem.status === "concluido" ? "default" : "outline"} 
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => handleStatusChange(selectedOrdem.id, "concluido")}
                                      disabled={selectedOrdem.status === "concluido"}
                                    >
                                      Concluído
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ListaOrdensServico;