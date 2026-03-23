import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  Bot, 
  Brain, 
  Settings2, 
  Save, 
  RotateCcw, 
  Loader2,
  Sparkles,
  Shield,
  MessageSquare,
  Zap,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

// Skill padrão do arquivo Skill.md
import skillContent from "@/AI/Skill.md?raw";

// Tipos para configuração
interface ApexAIConfig {
  // Configurações do Modelo
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  
  // Configurações de Comportamento
  skill: string;
  systemPromptPrefix: string;
  systemPromptSuffix: string;
  
  // Configurações de Segurança
  enableRateLimit: boolean;
  rateLimitPerMinute: number;
  enableInputValidation: boolean;
  enableAuditLog: boolean;
  sessionTimeoutMinutes: number;
  
  // Configurações de Interface
  welcomeMessage: string;
  placeholderText: string;
  enableTypingIndicator: boolean;
  enableSoundEffects: boolean;
  
  // Metadados
  updatedAt?: any;
  updatedBy?: string;
}

const DEFAULT_CONFIG: ApexAIConfig = {
  // Modelo
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  
  // Comportamento
  skill: "",
  systemPromptPrefix: "",
  systemPromptSuffix: "",
  
  // Segurança
  enableRateLimit: true,
  rateLimitPerMinute: 30,
  enableInputValidation: true,
  enableAuditLog: true,
  sessionTimeoutMinutes: 30,
  
  // Interface
  welcomeMessage: "Olá! Sou o APEX AI, seu assistente virtual do APEX HUB. Como posso ajudar você hoje?",
  placeholderText: "Digite sua mensagem...",
  enableTypingIndicator: true,
  enableSoundEffects: false,
};

const AVAILABLE_MODELS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", description: "Modelo principal - Equilíbrio entre velocidade e qualidade" },
  { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B Versatile", description: "Modelo anterior - Boa qualidade geral" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", description: "Modelo rápido - Respostas instantâneas" },
  { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B", description: "Modelo alternativo - Bom para código" },
  { value: "gemma2-9b-it", label: "Gemma 2 9B", description: "Modelo Google - Respostas concisas" },
];

const ApexAI: React.FC = () => {
  const { userData } = useAuth();
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ApexAIConfig>(DEFAULT_CONFIG);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("modelo");

  // Carregar configuração do Firestore
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, "apex_ai_config", "settings");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as ApexAIConfig;
          setConfig({
            ...DEFAULT_CONFIG,
            ...data,
            // Se skill estiver vazio, usa o padrão do arquivo
            skill: data.skill || ""
          });
        } else {
          // Se não existe configuração, usa padrão
          setConfig(DEFAULT_CONFIG);
        }
      } catch (error) {
        console.error("Erro ao carregar configuração:", error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar as configurações do APEX AI.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, [toast]);

  // Verificar se é desenvolvedor
  if (userData?.perfil !== "DESENVOLVEDOR" && userData?.cargo !== "DESENVOLVEDOR") {
    return <Navigate to="/dashboard" replace />;
  }

  // Handlers
  const handleConfigChange = <K extends keyof ApexAIConfig>(key: K, value: ApexAIConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, "apex_ai_config", "settings");
      await setDoc(docRef, {
        ...config,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.email || "unknown"
      });
      
      setHasChanges(false);
      toast({
        title: "Configurações salvas",
        description: "As configurações do APEX AI foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSkill = () => {
    handleConfigChange("skill", "");
    toast({
      title: "Skill restaurado",
      description: "O skill será carregado do arquivo padrão (Skill.md). Clique em Salvar para aplicar.",
    });
  };

  const handleResetAll = () => {
    setConfig(DEFAULT_CONFIG);
    setHasChanges(true);
    toast({
      title: "Configurações restauradas",
      description: "Todas as configurações foram restauradas para os valores padrão. Clique em Salvar para aplicar.",
    });
  };

  // Obter o skill atual (do config ou do arquivo)
  const currentSkill = config.skill || skillContent;

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Configurações do APEX AI</h1>
                  <p className="text-muted-foreground">
                    Configure o comportamento, modelo e segurança do assistente
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleResetAll}
                  disabled={saving}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar Tudo
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={!hasChanges || saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>

            {/* Aviso de alterações não salvas */}
            {hasChanges && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Você tem alterações não salvas.</span>
              </div>
            )}

            {/* Tabs de Configuração */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="modelo" className="gap-2">
                  <Brain className="h-4 w-4" />
                  Modelo
                </TabsTrigger>
                <TabsTrigger value="skill" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Skill
                </TabsTrigger>
                <TabsTrigger value="seguranca" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Segurança
                </TabsTrigger>
                <TabsTrigger value="interface" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Interface
                </TabsTrigger>
              </TabsList>

              {/* Tab: Modelo */}
              <TabsContent value="modelo" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Configurações do Modelo
                    </CardTitle>
                    <CardDescription>
                      Defina qual modelo de IA será usado e seus parâmetros de geração
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Seleção de Modelo */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Modelo de IA</Label>
                      <Select 
                        value={config.model} 
                        onValueChange={(value) => handleConfigChange("model", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{model.label}</span>
                                <span className="text-xs text-muted-foreground">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Temperatura */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Temperatura</Label>
                          <p className="text-sm text-muted-foreground">
                            Controla a criatividade das respostas (0 = determinístico, 1 = criativo)
                          </p>
                        </div>
                        <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {config.temperature.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[config.temperature]}
                        onValueChange={([value]) => handleConfigChange("temperature", value)}
                        min={0}
                        max={1}
                        step={0.05}
                        className="w-full"
                      />
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Máximo de Tokens</Label>
                          <p className="text-sm text-muted-foreground">
                            Limite máximo de tokens na resposta (maior = respostas mais longas)
                          </p>
                        </div>
                        <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {config.maxTokens}
                        </span>
                      </div>
                      <Slider
                        value={[config.maxTokens]}
                        onValueChange={([value]) => handleConfigChange("maxTokens", value)}
                        min={256}
                        max={8192}
                        step={256}
                        className="w-full"
                      />
                    </div>

                    {/* Top P */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Top P (Nucleus Sampling)</Label>
                          <p className="text-sm text-muted-foreground">
                            Controla a diversidade do vocabulário usado
                          </p>
                        </div>
                        <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {config.topP.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[config.topP]}
                        onValueChange={([value]) => handleConfigChange("topP", value)}
                        min={0}
                        max={1}
                        step={0.05}
                        className="w-full"
                      />
                    </div>

                    {/* Frequency Penalty */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Penalidade de Frequência</Label>
                          <p className="text-sm text-muted-foreground">
                            Reduz repetição de palavras já usadas
                          </p>
                        </div>
                        <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {config.frequencyPenalty.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[config.frequencyPenalty]}
                        onValueChange={([value]) => handleConfigChange("frequencyPenalty", value)}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    {/* Presence Penalty */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Penalidade de Presença</Label>
                          <p className="text-sm text-muted-foreground">
                            Incentiva o modelo a falar sobre novos tópicos
                          </p>
                        </div>
                        <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {config.presencePenalty.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        value={[config.presencePenalty]}
                        onValueChange={([value]) => handleConfigChange("presencePenalty", value)}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Skill */}
              <TabsContent value="skill" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Skill do Assistente
                        </CardTitle>
                        <CardDescription>
                          Define o comportamento, regras e personalidade do APEX AI
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResetSkill}
                        className="gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Usar Padrão
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Info box */}
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium">Como funciona o Skill:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-blue-600 dark:text-blue-400">
                          <li>Se o campo estiver vazio, o sistema usa o arquivo <code className="bg-blue-500/20 px-1 rounded">Skill.md</code> como padrão</li>
                          <li>Se você modificar e salvar, a configuração customizada será usada</li>
                          <li>Clique em "Usar Padrão" para limpar e voltar ao arquivo original</li>
                        </ul>
                      </div>
                    </div>

                    {/* Status do Skill */}
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      {config.skill ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Usando skill customizado salvo no Firestore</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Usando skill padrão do arquivo Skill.md</span>
                        </>
                      )}
                    </div>

                    {/* Editor de Skill */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Conteúdo do Skill</Label>
                      <Textarea
                        value={config.skill || skillContent}
                        onChange={(e) => handleConfigChange("skill", e.target.value)}
                        placeholder="Cole aqui o conteúdo do Skill..."
                        className="min-h-[500px] font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {(config.skill || skillContent).length} caracteres | 
                        ~{Math.ceil((config.skill || skillContent).length / 4)} tokens estimados
                      </p>
                    </div>

                    <Separator />

                    {/* Prefixo e Sufixo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-semibold">Prefixo do System Prompt</Label>
                        <Textarea
                          value={config.systemPromptPrefix}
                          onChange={(e) => handleConfigChange("systemPromptPrefix", e.target.value)}
                          placeholder="Texto adicionado ANTES do skill..."
                          className="min-h-[100px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Adicionado antes do skill principal
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Sufixo do System Prompt</Label>
                        <Textarea
                          value={config.systemPromptSuffix}
                          onChange={(e) => handleConfigChange("systemPromptSuffix", e.target.value)}
                          placeholder="Texto adicionado DEPOIS do skill..."
                          className="min-h-[100px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Adicionado depois do skill principal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Segurança */}
              <TabsContent value="seguranca" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Configurações de Segurança
                    </CardTitle>
                    <CardDescription>
                      Configure proteções contra abuso e auditoria do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Rate Limiting */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Rate Limiting</Label>
                        <p className="text-sm text-muted-foreground">
                          Limita o número de mensagens por minuto por usuário
                        </p>
                      </div>
                      <Switch
                        checked={config.enableRateLimit}
                        onCheckedChange={(checked) => handleConfigChange("enableRateLimit", checked)}
                      />
                    </div>

                    {config.enableRateLimit && (
                      <div className="space-y-3 ml-4 p-4 border-l-2 border-primary/20">
                        <div className="flex items-center justify-between">
                          <Label>Mensagens por minuto</Label>
                          <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                            {config.rateLimitPerMinute}
                          </span>
                        </div>
                        <Slider
                          value={[config.rateLimitPerMinute]}
                          onValueChange={([value]) => handleConfigChange("rateLimitPerMinute", value)}
                          min={5}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}

                    <Separator />

                    {/* Validação de Input */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Validação de Input</Label>
                        <p className="text-sm text-muted-foreground">
                          Detecta e bloqueia tentativas de prompt injection
                        </p>
                      </div>
                      <Switch
                        checked={config.enableInputValidation}
                        onCheckedChange={(checked) => handleConfigChange("enableInputValidation", checked)}
                      />
                    </div>

                    {/* Audit Log */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Log de Auditoria</Label>
                        <p className="text-sm text-muted-foreground">
                          Registra todas as interações para análise posterior
                        </p>
                      </div>
                      <Switch
                        checked={config.enableAuditLog}
                        onCheckedChange={(checked) => handleConfigChange("enableAuditLog", checked)}
                      />
                    </div>

                    <Separator />

                    {/* Session Timeout */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-semibold">Timeout de Sessão</Label>
                          <p className="text-sm text-muted-foreground">
                            Tempo de inatividade antes de encerrar a sessão (minutos)
                          </p>
                        </div>
                        <span className="text-lg font-mono bg-muted px-3 py-1 rounded">
                          {config.sessionTimeoutMinutes} min
                        </span>
                      </div>
                      <Slider
                        value={[config.sessionTimeoutMinutes]}
                        onValueChange={([value]) => handleConfigChange("sessionTimeoutMinutes", value)}
                        min={5}
                        max={120}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Interface */}
              <TabsContent value="interface" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Configurações de Interface
                    </CardTitle>
                    <CardDescription>
                      Personalize a aparência e comportamento do chat
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mensagem de Boas-vindas */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Mensagem de Boas-vindas</Label>
                      <Textarea
                        value={config.welcomeMessage}
                        onChange={(e) => handleConfigChange("welcomeMessage", e.target.value)}
                        placeholder="Digite a mensagem inicial do assistente..."
                        className="min-h-[100px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        Primeira mensagem exibida quando o chat é aberto
                      </p>
                    </div>

                    <Separator />

                    {/* Placeholder */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Texto do Placeholder</Label>
                      <Input
                        value={config.placeholderText}
                        onChange={(e) => handleConfigChange("placeholderText", e.target.value)}
                        placeholder="Digite o placeholder..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Texto exibido no campo de entrada quando vazio
                      </p>
                    </div>

                    <Separator />

                    {/* Opções de Interface */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold">Indicador de Digitação</Label>
                          <p className="text-sm text-muted-foreground">
                            Exibe animação enquanto o assistente está respondendo
                          </p>
                        </div>
                        <Switch
                          checked={config.enableTypingIndicator}
                          onCheckedChange={(checked) => handleConfigChange("enableTypingIndicator", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold">Efeitos Sonoros</Label>
                          <p className="text-sm text-muted-foreground">
                            Reproduz sons ao enviar e receber mensagens
                          </p>
                        </div>
                        <Switch
                          checked={config.enableSoundEffects}
                          onCheckedChange={(checked) => handleConfigChange("enableSoundEffects", checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Preview
                    </CardTitle>
                    <CardDescription>
                      Visualize como ficará a interface do chat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted rounded-lg p-4 space-y-4">
                      {/* Mensagem do Bot */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 bg-background rounded-lg p-3 shadow-sm">
                          <p className="text-sm">{config.welcomeMessage}</p>
                        </div>
                      </div>
                      
                      {/* Input Preview */}
                      <div className="flex gap-2">
                        <Input 
                          placeholder={config.placeholderText}
                          disabled
                          className="flex-1"
                        />
                        <Button size="icon" disabled>
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ApexAI;
