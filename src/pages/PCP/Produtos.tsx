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

  const filteredProdutos = produtos.filter((produto) => {
    const searchLower = searchTerm;
    return (
      produto.codigo.includes(searchLower) ||
      produto.descricao_produto.includes(searchLower) ||
      produto.maquina.includes(searchLower) ||
      produto.embalagem.includes(searchLower) ||
      produto.un_cx.includes(searchLower) ||
      produto.cx_respectiva.includes(searchLower) ||
      produto.peso_liq_unit_kg.includes(searchLower) ||
      produto.batch_receita_kg.includes(searchLower) ||
      produto.classificacao.includes(searchLower)
    );
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Produtos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{produtos.length}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Produtos</CardTitle>
              <CardDescription>Todos os produtos cadastrados no sistema</CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">Adicionar Produto</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Produto</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="codigo" className="text-right">
                        Código
                      </Label>
                      <Input
                        id="codigo"
                        value={newProduto.codigo}
                        onChange={(e) => setNewProduto({...newProduto, codigo: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="descricao" className="text-right">
                        Descrição
                      </Label>
                      <Input
                        id="descricao"
                        value={newProduto.descricao_produto}
                        onChange={(e) => setNewProduto({...newProduto, descricao_produto: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="maquina" className="text-right">
                        Máquina
                      </Label>
                      <Input
                        id="maquina"
                        value={newProduto.maquina}
                        onChange={(e) => setNewProduto({...newProduto, maquina: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="embalagem" className="text-right">
                        Embalagem
                      </Label>
                      <Input
                        id="embalagem"
                        value={newProduto.embalagem}
                        onChange={(e) => setNewProduto({...newProduto, embalagem: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="un_cx" className="text-right">
                        UN/CX
                      </Label>
                      <Input
                        id="un_cx"
                        value={newProduto.un_cx}
                        onChange={(e) => setNewProduto({...newProduto, un_cx: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cx_respectiva" className="text-right">
                        CX Respectiva
                      </Label>
                      <Input
                        id="cx_respectiva"
                        value={newProduto.cx_respectiva}
                        onChange={(e) => setNewProduto({...newProduto, cx_respectiva: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="peso" className="text-right">
                        Peso Liq Unit (KG)
                      </Label>
                      <Input
                        id="peso"
                        value={newProduto.peso_liq_unit_kg}
                        onChange={(e) => setNewProduto({...newProduto, peso_liq_unit_kg: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="batch_kg" className="text-right">
                        Batch Receita (KG)
                      </Label>
                      <Input
                        id="batch_kg"
                        value={newProduto.batch_receita_kg}
                        onChange={(e) => setNewProduto({...newProduto, batch_receita_kg: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="classificacao" className="text-right">
                        Classificação
                      </Label>
                      <Input
                        id="classificacao"
                        value={newProduto.classificacao}
                        onChange={(e) => setNewProduto({...newProduto, classificacao: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddProduto}>Salvar</Button>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Máquina</TableHead>
                <TableHead>Embalagem</TableHead>
                <TableHead>UN/CX</TableHead>
                <TableHead>CX Respectiva</TableHead>
                <TableHead>Peso Liq Unit (KG)</TableHead>
                <TableHead>Batch Receita (KG)</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>{produto.codigo}</TableCell>
                  <TableCell>{produto.descricao_produto}</TableCell>
                  <TableCell>{produto.maquina}</TableCell>
                  <TableCell>{produto.embalagem}</TableCell>
                  <TableCell>{produto.un_cx}</TableCell>
                  <TableCell>{produto.cx_respectiva}</TableCell>
                  <TableCell>{produto.peso_liq_unit_kg}</TableCell>
                  <TableCell>{produto.batch_receita_kg}</TableCell>
                  <TableCell>{produto.classificacao}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditProduto(produto);
                            setEditDialogOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                      </DialogTrigger>
                      {editProduto && (
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Editar Produto</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-codigo" className="text-right">
                                Código
                              </Label>
                              <Input
                                id="edit-codigo"
                                value={editProduto.codigo}
                                onChange={(e) => setEditProduto({...editProduto, codigo: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-descricao" className="text-right">
                                Descrição
                              </Label>
                              <Input
                                id="edit-descricao"
                                value={editProduto.descricao_produto}
                                onChange={(e) => setEditProduto({...editProduto, descricao_produto: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-maquina" className="text-right">
                                Máquina
                              </Label>
                              <Input
                                id="edit-maquina"
                                value={editProduto.maquina}
                                onChange={(e) => setEditProduto({...editProduto, maquina: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-embalagem" className="text-right">
                                Embalagem
                              </Label>
                              <Input
                                id="edit-embalagem"
                                value={editProduto.embalagem}
                                onChange={(e) => setEditProduto({...editProduto, embalagem: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-un_cx" className="text-right">
                                UN/CX
                              </Label>
                              <Input
                                id="edit-un_cx"
                                value={editProduto.un_cx}
                                onChange={(e) => setEditProduto({...editProduto, un_cx: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-cx_respectiva" className="text-right">
                                CX Respectiva
                              </Label>
                              <Input
                                id="edit-cx_respectiva"
                                value={editProduto.cx_respectiva}
                                onChange={(e) => setEditProduto({...editProduto, cx_respectiva: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-peso" className="text-right">
                                Peso Liq Unit (KG)
                              </Label>
                              <Input
                                id="edit-peso"
                                value={editProduto.peso_liq_unit_kg}
                                onChange={(e) => setEditProduto({...editProduto, peso_liq_unit_kg: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-batch_kg" className="text-right">
                                Batch Receita (KG)
                              </Label>
                              <Input
                                id="edit-batch_kg"
                                value={editProduto.batch_receita_kg}
                                onChange={(e) => setEditProduto({...editProduto, batch_receita_kg: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-classificacao" className="text-right">
                                Classificação
                              </Label>
                              <Input
                                id="edit-classificacao"
                                value={editProduto.classificacao}
                                onChange={(e) => setEditProduto({...editProduto, classificacao: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleUpdateProduto}>Salvar</Button>
                            <DialogClose asChild>
                              <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => confirmDelete(produto.id)}
                    >
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
};

export default Produtos;