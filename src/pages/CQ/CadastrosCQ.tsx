import React, { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  Settings2, 
  History,
  UserCheck,
  Scale,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  X,
  Eye,
  Smartphone,
  Building2,
  Users,
  MapPin,
  Package,
  FileWarning,
  Award,
  Clock,
  User,
  QrCode,
  LayoutGrid,
  FileSignature
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CQService } from "@/services/cq/CQService";
import { useAuth } from "@/contexts/AuthContext";

const CadastrosCQ = () => {
  const [activeTab, setActiveTab] = useState("acoes");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrText, setQrText] = useState("https://apex-hub.com");
  const [qrSize, setQrSize] = useState(250);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Form State
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    if (activeTab === "qr-code") return;
    setIsLoading(true);
    try {
      const data = await CQService.getActiveDocuments("cq_cadastros");
      // Filter by category (activeTab)
      setItems(data.filter((item: any) => item.categoria_slug === activeTab));
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      if (formData.id) {
        const { id, criado_em, atualizado_em, versao, id_original_raiz, ...cleanData } = formData;
        await CQService.createNewVersion("cq_cadastros", id, cleanData, user.uid, user.email || "Usuário");
      } else {
        await CQService.createDocument("cq_cadastros", {
          ...formData,
          categoria_slug: activeTab,
          categoria_nome: menuItems.find(i => i.id === activeTab)?.label
        }, user.uid, user.email || "Usuário");
      }
      
      toast.success(formData.id ? "Nova versão criada com sucesso!" : "Registro salvo com sucesso!");
      setIsModalOpen(false);
      setFormData({});
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar registro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!user) return;
    try {
      await CQService.deactivateDocument("cq_cadastros", id, user.uid, user.email || "Usuário");
      toast.success("Registro desativado com sucesso");
      fetchData();
    } catch (error) {
      toast.error("Erro ao desativar registro");
    }
  };

  const menuItems = [
    { id: "acoes", label: "Ações", icon: LayoutGrid },
    { id: "cadastro-geral", label: "Cadastro Geral", icon: Settings2 },
    { id: "locais", label: "Locais", icon: MapPin },
    { id: "lotes", label: "Lotes", icon: Package },
    { id: "nao-conformidades", label: "Não Conformidades", icon: FileWarning },
    { id: "programas-qualidade", label: "Programas de Qualidade", icon: Award },
    { id: "tipos-acoes", label: "Tipos de Ações", icon: History },
    { id: "tipo-cadastro", label: "Tipo de Cadastro", icon: ShieldCheck },
    { id: "turnos", label: "Turnos", icon: Clock },
    { id: "usuario", label: "Usuário", icon: User },
    { id: "dispositivos", label: "Dispositivos", icon: Smartphone },
    { id: "qr-code", label: "QR Code", icon: QrCode },
  ];

  const renderContent = () => {
    if (activeTab === "qr-code") {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Gerador de QR Code Industrial
            </h2>
            <p className="text-xs text-muted-foreground">Gere códigos QR para identificação de locais, lotes ou equipamentos.</p>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Texto ou URL para o QR Code</label>
                <Input 
                  className="bg-background border-border text-foreground" 
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="Digite o texto ou URL..." 
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tamanho do QR Code: <span className="text-primary">{qrSize}px</span></label>
                </div>
                <Slider 
                  defaultValue={[qrSize]} 
                  max={500} 
                  min={100} 
                  step={10} 
                  onValueChange={(val) => setQrSize(val[0])}
                  className="py-4"
                />
              </div>

              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-4 border-border/20">
                <div className="bg-white p-4 rounded-xl shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrText)}`} 
                    alt="QR Code"
                    style={{ width: qrSize, height: qrSize }}
                    className="transition-all duration-300"
                  />
                </div>
                <p className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Visualização de Impressão</p>
              </div>

              <div className="flex justify-center pt-4">
                <Button className="bg-primary hover:bg-primary/90 text-foreground font-bold px-12" onClick={() => window.print()}>
                  <QrCode className="mr-2 h-4 w-4" /> IMPRIMIR QR CODE
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const isAcoes = activeTab === "acoes";

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-muted-foreground">Gerenciamento de {menuItems.find(i => i.id === activeTab)?.label.toLowerCase()} do sistema.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-foreground font-bold" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs uppercase">ID</TableHead>
                  {isAcoes ? (
                    <>
                      <TableHead className="text-muted-foreground text-xs uppercase">Tipo de Ação</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Processo/Produto</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Exige Status</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase">Nome da Ação</TableHead>
                    </>
                  ) : (
                    <TableHead className="text-muted-foreground text-xs uppercase">Nome / Descrição</TableHead>
                  )}
                  <TableHead className="text-muted-foreground text-xs uppercase">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground text-xs uppercase">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-bold uppercase tracking-wide animate-pulse">Carregando dados...</TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-bold uppercase tracking-wide">Nenhum registro encontrado</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="border-border hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-primary font-bold text-xs">
                        #{item.id?.substring(0, 8).toUpperCase()}
                        <Badge variant="outline" className="ml-2 border-border text-xs h-4">v{item.versao}</Badge>
                      </TableCell>
                      {isAcoes ? (
                        <>
                          <TableCell className="text-foreground text-sm font-bold">{item.tipo_acao || "-"}</TableCell>
                          <TableCell className="text-foreground text-sm">{item.processo_produto || "-"}</TableCell>
                          <TableCell className="text-foreground text-sm">{item.exige_status || "-"}</TableCell>
                          <TableCell className="text-foreground text-sm">{item.nome || "-"}</TableCell>
                        </>
                      ) : (
                        <TableCell className="text-foreground text-sm font-bold">
                          {item.nome || item.descricao || item.codigo || "Sem nome"}
                          <p className="text-xs text-muted-foreground font-normal mt-0.5">{item.descricao?.substring(0, 50)}</p>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={cn(
                          "uppercase text-xs font-semibold border-2",
                          item.ativo === "sim" 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                          {item.ativo === "sim" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary hover:bg-primary/10 gap-1.5 px-2"
                            onClick={() => {
                              setFormData(item);
                              setIsModalOpen(true);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            <span className="text-xs font-semibold uppercase">Nova Versão</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeactivate(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <AppLayout title="Mestre de Cadastros Industrial">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-180px)]">
        
        {/* Sidebar de Abas (Vertical) */}
        <div className="w-full md:w-64 bg-card border border-border rounded-2xl overflow-y-auto p-2 space-y-1">
          <div className="px-4 py-3 border-b border-border mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Navegação</span>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative overflow-hidden",
                  activeTab === item.id 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {activeTab === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"></div>
                )}
                <Icon className={cn("h-4 w-4", activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-y-auto pr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL DE CADASTRO GENÉRICO (Pode ser especializado conforme a aba) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-background border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 font-bold uppercase tracking-wider">
              <Plus className="h-5 w-5 text-primary" />
              NOVO CADASTRO: {menuItems.find(i => i.id === activeTab)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            {activeTab === "acoes" ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Ação *</label>
                  <Input 
                    className="bg-muted border-border" 
                    placeholder="Ex: Preventiva, Corretiva..." 
                    value={formData.tipo_acao || ""}
                    onChange={(e) => setFormData({...formData, tipo_acao: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Processo / Produto</label>
                    <Select 
                      value={formData.processo_produto || "produto"} 
                      onValueChange={(val) => setFormData({...formData, processo_produto: val})}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        <SelectItem value="processo">Processo</SelectItem>
                        <SelectItem value="produto">Produto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Exige Status "Em Andamento"</label>
                    <Select 
                      value={formData.exige_status || "nao"} 
                      onValueChange={(val) => setFormData({...formData, exige_status: val})}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nome da Ação *</label>
                  <Input 
                    className="bg-muted border-border" 
                    placeholder="+ Informe a descrição resumida da ação" 
                    value={formData.nome || ""}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Descrição Completa *</label>
                  <Textarea 
                    className="bg-muted border-border min-h-[100px]" 
                    placeholder="+ Informe a descrição completa da ação" 
                    value={formData.descricao || ""}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nome / Identificação</label>
                <Input 
                  className="bg-muted border-border" 
                  placeholder="Digite o nome..." 
                  value={formData.nome || ""}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => {
              setIsModalOpen(false);
              setFormData({});
            }}>Cancelar</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-foreground font-bold" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "SALVANDO..." : formData.id ? "CRIAR NOVA VERSÃO" : "SALVAR REGISTRO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default CadastrosCQ;
