import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Users, Search, Loader2, Trash2, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useManutentores } from "@/hooks/useManutentores";
import { addManutentor } from "@/firebase/manutencaoPreventiva";
import { TipoManutencao } from "@/types/typesManutencaoPreventiva";

// Use the Manutentor type from the hook
import type { Manutentor } from "@/hooks/useManutentores";

interface ManutentorTemp {
  usuarioId: string;
  nome: string;
  email: string;
  funcao: TipoManutencao;
  ordemPrioridade: number;
  capacidadeDiaria: number;
  ativo: boolean;
}

const TIPOS_MANUTENCAO: TipoManutencao[] = [
  "Elétrica",
  "Mecânica",
  "Hidráulica",
  "Pneumática",
  "Lubrificação",
  "Calibração",
  "Inspeção"
];

const ManutentoresTab = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManutentor, setEditingManutentor] = useState<Manutentor | null>(null);
  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: manutentores = [], isLoading: loadingManutentores, refetch } = useManutentores();
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState("");
  const [listaManutentores, setListaManutentores] = useState<ManutentorTemp[]>([]);

  // Form data for editing
  const [formData, setFormData] = useState({
    funcao: "Mecânica" as TipoManutencao,
    ordemPrioridade: 1,
    capacidadeDiaria: 5,
    ativo: true,
  });

  // Agrupar manutentores por centro de custo
  const manutentoresPorCentroDeCusto = () => {
    const grupos: Record<string, any[]> = {};
    
    manutentores.forEach(manutentor => {
      const funcionario = funcionarios?.find(f => f.id === manutentor.usuarioId);
      const centroDeCusto = funcionario?.centro_de_custo || "Não definido";
      
      if (!grupos[centroDeCusto]) {
        grupos[centroDeCusto] = [];
      }
      
      grupos[centroDeCusto].push({
        ...manutentor,
        centroDeCusto
      });
    });
    
    return grupos;
  };

  const resetForm = () => {
    setUsuarioSelecionadoId("");
    setListaManutentores([]);
    setFormData({
      funcao: "Mecânica",
      ordemPrioridade: 1,
      capacidadeDiaria: 5,
      ativo: true,
    });
    setEditingManutentor(null);
  };

  const handleAdicionarUsuario = () => {
    if (!usuarioSelecionadoId) {
      toast.error("Selecione um usuário");
      return;
    }

    const usuario = funcionarios?.find(f => f.id === usuarioSelecionadoId);
    if (!usuario) return;

    // Verificar se já foi adicionado na lista
    if (listaManutentores.find(m => m.email === usuario.email)) {
      toast.error("Este email já está na lista de manutentores");
      return;
    }

    // Calcular próxima ordem de prioridade para a função padrão
    const mesmaFuncao = listaManutentores.filter(m => m.funcao === "Mecânica");
    const maxOrdem = mesmaFuncao.length > 0 
      ? Math.max(...mesmaFuncao.map(m => m.ordemPrioridade)) 
      : 0;

    setListaManutentores([
      ...listaManutentores,
      {
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        funcao: "Mecânica",
        ordemPrioridade: maxOrdem + 1,
        capacidadeDiaria: 5,
        ativo: true
      }
    ]);
    setUsuarioSelecionadoId("");
  };

  const handleRemoverUsuario = (usuarioId: string) => {
    setListaManutentores(listaManutentores.filter(m => m.usuarioId !== usuarioId));
  };

  const handleAtualizarManutentor = (usuarioId: string, campo: keyof ManutentorTemp, valor: any) => {
    setListaManutentores(listaManutentores.map(m =>
      m.usuarioId === usuarioId ? { ...m, [campo]: valor } : m
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingManutentor) {
      // Editing existing manutentor
      try {
        setLoading(true);
        await updateDoc(doc(db, "manutentores", editingManutentor.id), {
          funcao: formData.funcao,
          ordemPrioridade: formData.ordemPrioridade,
          capacidadeDiaria: formData.capacidadeDiaria,
          ativo: formData.ativo,
          updatedAt: new Date(),
        });
        toast.success("Manutentor atualizado com sucesso");
        setIsDialogOpen(false);
        resetForm();
        refetch();
      } catch (error: any) {
        console.error("Erro ao atualizar manutentor:", error);
        toast.error(error?.message || "Erro ao atualizar manutentor");
      } finally {
        setLoading(false);
      }
    } else {
      // Adding new manutentores
      if (listaManutentores.length === 0) {
        toast.error("Adicione pelo menos um usuário à lista");
        return;
      }

      setLoading(true);
      try {
        for (const manutentor of listaManutentores) {
          await addManutentor({
            usuarioId: manutentor.usuarioId,
            nome: manutentor.nome,
            email: manutentor.email,
            funcao: manutentor.funcao,
            ordemPrioridade: manutentor.ordemPrioridade,
            capacidadeDiaria: manutentor.capacidadeDiaria,
            ativo: manutentor.ativo
          });
        }

        toast.success(`${listaManutentores.length} manutentor(es) cadastrado(s) com sucesso`);
        setIsDialogOpen(false);
        resetForm();
        refetch();
      } catch (error: any) {
        console.error("Erro ao cadastrar manutentores:", error);
        toast.error(error?.message || "Erro ao cadastrar manutentores");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (manutentor: Manutentor) => {
    setEditingManutentor(manutentor);
    setFormData({
      funcao: manutentor.funcao || "Mecânica",
      ordemPrioridade: manutentor.ordemPrioridade || 1,
      capacidadeDiaria: manutentor.capacidadeDiaria || 5,
      ativo: manutentor.ativo !== false,
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (manutentor: Manutentor, newStatus: boolean) => {
    try {
      await updateDoc(doc(db, "manutentores", manutentor.id), {
        ativo: newStatus,
        updatedAt: new Date(),
      });
      toast.success(`Manutentor ${newStatus ? "ativado" : "desativado"} com sucesso`);
      refetch();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const filteredManutentores = manutentores.filter((m) =>
    m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.funcao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grupos = manutentoresPorCentroDeCusto();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manutentores
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar manutentores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button className="gap-2" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Novo Manutentor
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingManutentores ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredManutentores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhum manutentor encontrado" : "Nenhum manutentor cadastrado"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Cap. Diária</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManutentores.map((manutentor) => (
                  <TableRow key={manutentor.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{manutentor.nome}</p>
                        <p className="text-xs text-muted-foreground">{manutentor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{manutentor.funcao || "-"}</TableCell>
                    <TableCell>{manutentor.ordemPrioridade || "-"}</TableCell>
                    <TableCell>{manutentor.capacidadeDiaria || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        manutentor.ativo 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
                        {manutentor.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(manutentor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={manutentor.ativo ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleStatusChange(manutentor, !manutentor.ativo)}
                        >
                          {manutentor.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Modal Novo/Editar Manutentor */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingManutentor ? "Editar Manutentor" : "Novo Manutentor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {editingManutentor ? (
              // Edit mode - show simple form
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">{editingManutentor.nome}</p>
                  <p className="text-sm text-muted-foreground">{editingManutentor.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Função</Label>
                    <Select 
                      value={formData.funcao} 
                      onValueChange={(v) => setFormData({ ...formData, funcao: v as TipoManutencao })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_MANUTENCAO.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.ordemPrioridade}
                      onChange={(e) => setFormData({ ...formData, ordemPrioridade: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Capacidade Diária</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.capacidadeDiaria}
                      onChange={(e) => setFormData({ ...formData, capacidadeDiaria: Number(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-8">
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>
              </div>
            ) : (
              // Add mode - show full form with user selection
              <>
                {/* Seleção de Usuário */}
                <div className="space-y-2">
                  <Label htmlFor="usuario">Selecionar Usuário</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={usuarioSelecionadoId} 
                      onValueChange={setUsuarioSelecionadoId}
                      disabled={loadingFuncionarios}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios
                          ?.filter((funcionario) => 
                            funcionario.perfil === "MANUTENTOR" &&
                            !manutentores.some(m => m.usuarioId === funcionario.id) &&
                            !listaManutentores.some(m => m.usuarioId === funcionario.id)
                          )
                          .map((funcionario) => (
                            <SelectItem key={funcionario.id} value={funcionario.id}>
                              {funcionario.nome} - {funcionario.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      onClick={handleAdicionarUsuario}
                      disabled={!usuarioSelecionadoId}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Lista de Manutentores Adicionados */}
                {listaManutentores.length > 0 && (
                  <div className="space-y-2">
                    <Label>Manutentores a Adicionar ({listaManutentores.length})</Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {listaManutentores.map((manutentor) => (
                        <Card key={manutentor.usuarioId} className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <div>
                                <p className="font-medium">{manutentor.nome}</p>
                                <p className="text-sm text-muted-foreground">{manutentor.email}</p>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Função</Label>
                                  <Select 
                                    value={manutentor.funcao} 
                                    onValueChange={(v) => handleAtualizarManutentor(manutentor.usuarioId, "funcao", v as TipoManutencao)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIPOS_MANUTENCAO.map((tipo) => (
                                        <SelectItem key={tipo} value={tipo}>
                                          {tipo}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Prioridade</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={manutentor.ordemPrioridade}
                                    onChange={(e) => handleAtualizarManutentor(manutentor.usuarioId, "ordemPrioridade", Number(e.target.value))}
                                    placeholder="1"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Cap. Diária</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={manutentor.capacidadeDiaria}
                                    onChange={(e) => handleAtualizarManutentor(manutentor.usuarioId, "capacidadeDiaria", Number(e.target.value))}
                                    placeholder="5"
                                  />
                                </div>

                                <div className="flex items-center gap-2 mt-8">
                                  <Switch
                                    checked={manutentor.ativo}
                                    onCheckedChange={(checked) => handleAtualizarManutentor(manutentor.usuarioId, "ativo", checked)}
                                  />
                                  <Label>Ativo</Label>
                                </div>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoverUsuario(manutentor.usuarioId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Manutentores Cadastrados por Centro de Custo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <Label className="text-lg">Manutentores Cadastrados</Label>
                  </div>
                  
                  {loadingManutentores ? (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  ) : Object.keys(grupos).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum manutentor cadastrado ainda.</p>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {Object.entries(grupos).map(([centroDeCusto, manutentoresDoCentro]) => (
                        <Card key={centroDeCusto} className="p-4">
                          <h3 className="font-semibold mb-3 text-primary">
                            {centroDeCusto} ({manutentoresDoCentro.length})
                          </h3>
                          <div className="space-y-2">
                            {manutentoresDoCentro.map((manutentor) => (
                              <div 
                                key={manutentor.id} 
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{manutentor.nome}</p>
                                  <p className="text-xs text-muted-foreground">{manutentor.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    {manutentor.funcao}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    manutentor.ativo 
                                      ? 'bg-green-500/10 text-green-600' 
                                      : 'bg-red-500/10 text-red-600'
                                  }`}>
                                    {manutentor.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || (!editingManutentor && listaManutentores.length === 0)}>
                {loading ? "Salvando..." : editingManutentor ? "Salvar" : `Salvar ${listaManutentores.length} Manutentor(es)`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ManutentoresTab;
