import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, or } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PCPProductStatsModal from "@/components/PCPProductStatsModal";

interface Produto {
  id: string;
  codigo: string;
  descricao_produto: string;
  maquina: string;
  embalagem: string;
  un_cx: string;
  cx_respectiva: string;
  peso_liq_unit_kg: string;
  batch_receita_kg: string;
  classificacao: string;
}

const Produtos: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editProduto, setEditProduto] = useState<Produto | null>(null);
  const [newProduto, setNewProduto] = useState<Omit<Produto, "id">>({
    codigo: "",
    descricao_produto: "",
    maquina: "",
    embalagem: "",
    un_cx: "",
    cx_respectiva: "",
    peso_liq_unit_kg: "",
    batch_receita_kg: "",
    classificacao: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProdutoStats, setSelectedProdutoStats] = useState<Produto | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "PCP_produtos"));
      const produtosData: Produto[] = [];
      querySnapshot.forEach((doc) => {
        produtosData.push({ id: doc.id, ...doc.data() } as Produto);
      });
      setProdutos(produtosData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching produtos: ", error);
      setLoading(false);
    }
  };

  const handleAddProduto = async () => {
    try {
      const produtoToAdd = {
        codigo: newProduto.codigo,
        descricao_produto: newProduto.descricao_produto,
        maquina: newProduto.maquina,
        embalagem: newProduto.embalagem,
        un_cx: newProduto.un_cx,
        cx_respectiva: newProduto.cx_respectiva,
        peso_liq_unit_kg: newProduto.peso_liq_unit_kg,
        batch_receita_kg: newProduto.batch_receita_kg,
        classificacao: newProduto.classificacao,
      };
      
      await addDoc(collection(db, "PCP_produtos"), produtoToAdd);
      fetchProdutos();
      setNewProduto({
        codigo: "",
        descricao_produto: "",
        maquina: "",
        embalagem: "",
        un_cx: "",
        cx_respectiva: "",
        peso_liq_unit_kg: "",
        batch_receita_kg: "",
        classificacao: "",
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding produto: ", error);
    }
  };

  const handleUpdateProduto = async () => {
    if (!editProduto) return;
    
    try {
      const produtoToUpdate = {
        codigo: editProduto.codigo,
        descricao_produto: editProduto.descricao_produto,
        maquina: editProduto.maquina,
        embalagem: editProduto.embalagem,
        un_cx: editProduto.un_cx,
        cx_respectiva: editProduto.cx_respectiva,
        peso_liq_unit_kg: editProduto.peso_liq_unit_kg,
        batch_receita_kg: editProduto.batch_receita_kg,
        classificacao: editProduto.classificacao,
      };
      
      await updateDoc(doc(db, "PCP_produtos", editProduto.id), produtoToUpdate);
      fetchProdutos();
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating produto: ", error);
    }
  };

  const confirmDelete = (id: string) => {
    setProdutoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduto = async () => {
    if (!produtoToDelete) return;
    
    try {
      await deleteDoc(doc(db, "PCP_produtos", produtoToDelete));
      fetchProdutos();
      setDeleteDialogOpen(false);
      setProdutoToDelete(null);
    } catch (error) {
      console.error("Error deleting produto: ", error);
    }
  };

  const handleShowStats = (produto: Produto) => {
    setSelectedProdutoStats(produto);
    setIsStatsModalOpen(true);
  };

  const filteredProdutos = produtos.filter((produto) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      produto.codigo.toLowerCase().includes(searchLower) ||
      produto.descricao_produto.toLowerCase().includes(searchLower) ||
      produto.maquina.toLowerCase().includes(searchLower) ||
      produto.embalagem.toLowerCase().includes(searchLower) ||
      produto.classificacao.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Produtos</h2>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Lista de Produtos</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <span>Todos os produtos cadastrados no sistema</span>
                <span className="text-sm font-medium text-primary">• Total: {produtos.length} produtos</span>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="w-full sm:w-auto">Adicionar Produto</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Produto</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="codigo" className="sm:text-right">
                        Código
                      </Label>
                      <Input
                        id="codigo"
                        value={newProduto.codigo}
                        onChange={(e) => setNewProduto({...newProduto, codigo: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="descricao" className="sm:text-right">
                        Descrição
                      </Label>
                      <Input
                        id="descricao"
                        value={newProduto.descricao_produto}
                        onChange={(e) => setNewProduto({...newProduto, descricao_produto: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="maquina" className="sm:text-right">
                        Máquina
                      </Label>
                      <Input
                        id="maquina"
                        value={newProduto.maquina}
                        onChange={(e) => setNewProduto({...newProduto, maquina: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="embalagem" className="sm:text-right">
                        Embalagem
                      </Label>
                      <Input
                        id="embalagem"
                        value={newProduto.embalagem}
                        onChange={(e) => setNewProduto({...newProduto, embalagem: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="un_cx" className="sm:text-right">
                        UN/CX
                      </Label>
                      <Input
                        id="un_cx"
                        value={newProduto.un_cx}
                        onChange={(e) => setNewProduto({...newProduto, un_cx: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="cx_respectiva" className="sm:text-right">
                        CX Respectiva
                      </Label>
                      <Input
                        id="cx_respectiva"
                        value={newProduto.cx_respectiva}
                        onChange={(e) => setNewProduto({...newProduto, cx_respectiva: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="peso" className="sm:text-right">
                        Peso Liq Unit (KG)
                      </Label>
                      <Input
                        id="peso"
                        value={newProduto.peso_liq_unit_kg}
                        onChange={(e) => setNewProduto({...newProduto, peso_liq_unit_kg: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="batch_kg" className="sm:text-right">
                        Batch Receita (KG)
                      </Label>
                      <Input
                        id="batch_kg"
                        value={newProduto.batch_receita_kg}
                        onChange={(e) => setNewProduto({...newProduto, batch_receita_kg: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                      <Label htmlFor="classificacao" className="sm:text-right">
                        Classificação
                      </Label>
                      <Input
                        id="classificacao"
                        value={newProduto.classificacao}
                        onChange={(e) => setNewProduto({...newProduto, classificacao: e.target.value})}
                        className="col-span-1 sm:col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAddProduto} className="w-full sm:w-auto">Salvar</Button>
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                  <TableHead className="hidden md:table-cell">Máquina</TableHead>
                  <TableHead className="hidden lg:table-cell">Embalagem</TableHead>
                  <TableHead className="hidden xl:table-cell">UN/CX</TableHead>
                  <TableHead className="hidden xl:table-cell">CX Respectiva</TableHead>
                  <TableHead className="hidden lg:table-cell">Peso Liq Unit (KG)</TableHead>
                  <TableHead className="hidden xl:table-cell">Batch Receita (KG)</TableHead>
                  <TableHead className="hidden md:table-cell">Classificação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.codigo}</TableCell>
                    <TableCell className="hidden sm:table-cell">{produto.descricao_produto}</TableCell>
                    <TableCell className="hidden md:table-cell">{produto.maquina}</TableCell>
                    <TableCell className="hidden lg:table-cell">{produto.embalagem}</TableCell>
                    <TableCell className="hidden xl:table-cell">{produto.un_cx}</TableCell>
                    <TableCell className="hidden xl:table-cell">{produto.cx_respectiva}</TableCell>
                    <TableCell className="hidden lg:table-cell">{produto.peso_liq_unit_kg}</TableCell>
                    <TableCell className="hidden xl:table-cell">{produto.batch_receita_kg}</TableCell>
                    <TableCell className="hidden md:table-cell">{produto.classificacao}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row justify-end gap-1 items-end sm:items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowStats(produto);
                          }}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950 text-xs sm:text-sm"
                        >
                          Estatísticas
                        </Button>
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditProduto(produto);
                                setEditDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 text-xs sm:text-sm"
                            >
                              Editar
                            </Button>
                          </DialogTrigger>
                          {editProduto && (
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Editar Produto</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-codigo" className="sm:text-right">
                                    Código
                                  </Label>
                                  <Input
                                    id="edit-codigo"
                                    value={editProduto.codigo}
                                    onChange={(e) => setEditProduto({...editProduto, codigo: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-descricao" className="sm:text-right">
                                    Descrição
                                  </Label>
                                  <Input
                                    id="edit-descricao"
                                    value={editProduto.descricao_produto}
                                    onChange={(e) => setEditProduto({...editProduto, descricao_produto: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-maquina" className="sm:text-right">
                                    Máquina
                                  </Label>
                                  <Input
                                    id="edit-maquina"
                                    value={editProduto.maquina}
                                    onChange={(e) => setEditProduto({...editProduto, maquina: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-embalagem" className="sm:text-right">
                                    Embalagem
                                  </Label>
                                  <Input
                                    id="edit-embalagem"
                                    value={editProduto.embalagem}
                                    onChange={(e) => setEditProduto({...editProduto, embalagem: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-un_cx" className="sm:text-right">
                                    UN/CX
                                  </Label>
                                  <Input
                                    id="edit-un_cx"
                                    value={editProduto.un_cx}
                                    onChange={(e) => setEditProduto({...editProduto, un_cx: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-cx_respectiva" className="sm:text-right">
                                    CX Respectiva
                                  </Label>
                                  <Input
                                    id="edit-cx_respectiva"
                                    value={editProduto.cx_respectiva}
                                    onChange={(e) => setEditProduto({...editProduto, cx_respectiva: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-peso" className="sm:text-right">
                                    Peso Liq Unit (KG)
                                  </Label>
                                  <Input
                                    id="edit-peso"
                                    value={editProduto.peso_liq_unit_kg}
                                    onChange={(e) => setEditProduto({...editProduto, peso_liq_unit_kg: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-batch_kg" className="sm:text-right">
                                    Batch Receita (KG)
                                  </Label>
                                  <Input
                                    id="edit-batch_kg"
                                    value={editProduto.batch_receita_kg}
                                    onChange={(e) => setEditProduto({...editProduto, batch_receita_kg: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-classificacao" className="sm:text-right">
                                    Classificação
                                  </Label>
                                  <Input
                                    id="edit-classificacao"
                                    value={editProduto.classificacao}
                                    onChange={(e) => setEditProduto({...editProduto, classificacao: e.target.value})}
                                    className="col-span-1 sm:col-span-3"
                                  />
                                </div>
                              </div>
                              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                                <Button onClick={handleUpdateProduto} className="w-full sm:w-auto">Salvar</Button>
                                <DialogClose asChild>
                                  <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          )}
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => confirmDelete(produto.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 text-xs sm:text-sm"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduto}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedProdutoStats && (
        <PCPProductStatsModal
          produto={selectedProdutoStats}
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Produtos;