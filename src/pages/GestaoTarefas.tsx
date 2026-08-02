import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { TemplateTarefa } from "@/types/typesTemplatesTarefas";
import { deleteTemplateTarefa } from "@/firebase/templatesTarefas";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/layouts/AppLayout";
import { NovoTemplateModal } from "@/components/GestaoTarefas/NovoTemplateModal";
import { EditarTemplateModal } from "@/components/GestaoTarefas/EditarTemplateModal";

export default function GestaoTarefas() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateTarefa[]>([]);
  const [busca, setBusca] = useState("");
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateTarefa | null>(null);

  useEffect(() => {
    const q = query(collection(db, "lista_tarefas_manutencao"), orderBy("titulo", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TemplateTarefa));
      setTemplates(docs);
    });
    return () => unsubscribe();
  }, []);

  const templatesFiltrados = templates.filter(t =>
    t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    t.maquinaNome.toLowerCase().includes(busca.toLowerCase()) ||
    t.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este template?")) {
      try {
        await deleteTemplateTarefa(id);
        toast({ title: "Sucesso", description: "Template excluído" });
      } catch (error) {
        toast({ title: "Erro", description: "Erro ao excluir template", variant: "destructive" });
      }
    }
  };

  const handleEditar = (template: TemplateTarefa) => {
    setTemplateSelecionado(template);
    setShowEditarModal(true);
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const styles = {
      baixa: "bg-green-500",
      media: "bg-yellow-500",
      alta: "bg-orange-500",
      critica: "bg-red-500"
    };
    const labels = {
      baixa: "Baixa",
      media: "Média",
      alta: "Alta",
      critica: "Crítica"
    };
    return <Badge className={styles[prioridade as keyof typeof styles]}>{labels[prioridade as keyof typeof labels]}</Badge>;
  };

  return (
    <AppLayout title="Gestão de Tarefas">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Gerencie os templates de tarefas de manutenção</p>
          <Button onClick={() => setShowNovoModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Máquina</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesFiltrados.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    {template.ativo ? (
                      <Badge className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{template.titulo}</TableCell>
                  <TableCell>{template.tipo}</TableCell>
                  <TableCell>{template.maquinaNome}</TableCell>
                  <TableCell>{template.sistema || "-"}</TableCell>
                  <TableCell>{template.periodoLabel}</TableCell>
                  <TableCell>{getPrioridadeBadge(template.prioridade)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditar(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templatesFiltrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum template encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <NovoTemplateModal
          open={showNovoModal}
          onOpenChange={setShowNovoModal}
          onSuccess={() => setShowNovoModal(false)}
        />

        {templateSelecionado && (
          <EditarTemplateModal
            open={showEditarModal}
            onOpenChange={setShowEditarModal}
            template={templateSelecionado}
            onSuccess={() => {
              setShowEditarModal(false);
              setTemplateSelecionado(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
