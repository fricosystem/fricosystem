import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addManutentor } from "@/firebase/manutencaoPreventiva";
import { TipoManutencao } from "@/types/typesManutencaoPreventiva";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useManutentores } from "@/hooks/useManutentores";
import { Card } from "@/components/ui/card";
import { Trash2, UserPlus, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NovoManutentorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

interface ManutentorTemp {
  usuarioId: string;
  nome: string;
  email: string;
  funcao: TipoManutencao;
  ordemPrioridade: number;
  capacidadeDiaria: number;
  ativo: boolean;
}

export function NovoManutentorModal({ open, onOpenChange, onSuccess }: NovoManutentorModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { data: funcionarios, isLoading } = useFuncionarios();
  const { data: manutentores = [], isLoading: loadingManutentores } = useManutentores();
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState("");
  const [listaManutentores, setListaManutentores] = useState<ManutentorTemp[]>([]);

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
  };

  const handleAdicionarUsuario = () => {
    if (!usuarioSelecionadoId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário",
        variant: "destructive"
      });
      return;
    }

    const usuario = funcionarios?.find(f => f.id === usuarioSelecionadoId);
    if (!usuario) return;

    // Verificar se já foi adicionado na lista
    if (listaManutentores.find(m => m.email === usuario.email)) {
      toast({
        title: "Atenção",
        description: "Este email já está na lista de manutentores",
        variant: "destructive"
      });
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
    
    if (listaManutentores.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um usuário à lista",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Salvar todos os manutentores da lista
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

      toast({
        title: "Sucesso",
        description: `${listaManutentores.length} manutentor(es) cadastrado(s) com sucesso`
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao cadastrar manutentores",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const grupos = manutentoresPorCentroDeCusto();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Manutentor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Usuário */}
          <div className="space-y-2">
            <Label htmlFor="usuario">Selecionar Usuário</Label>
            <div className="flex gap-2">
              <Select 
                value={usuarioSelecionadoId} 
                onValueChange={setUsuarioSelecionadoId}
                disabled={isLoading}
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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || listaManutentores.length === 0}>
              {loading ? "Salvando..." : `Salvar ${listaManutentores.length} Manutentor(es)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
