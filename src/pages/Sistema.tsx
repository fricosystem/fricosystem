import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSystemConfig, DEFAULT_IMAGES, DEFAULT_APPEARANCE, DEFAULT_COMPANY_INFO } from "@/hooks/useSystemConfig";
import { useToast } from "@/components/ui/use-toast";
import { 
  Image, 
  Palette, 
  Building2, 
  Settings2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Eye
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface ImageFieldProps {
  label: string;
  description: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

const ImageField: React.FC<ImageFieldProps> = ({
  label,
  description,
  value,
  defaultValue,
  onChange,
  onReset,
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const checkImage = async (url: string) => {
    if (!url || url.trim() === "") {
      setIsValid(null);
      return;
    }
    
    setIsChecking(true);
    try {
      const img = new window.Image();
      img.onload = () => {
        setIsValid(true);
        setIsChecking(false);
      };
      img.onerror = () => {
        setIsValid(false);
        setIsChecking(false);
      };
      img.src = url;
    } catch {
      setIsValid(false);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkImage(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Label className="text-base font-semibold">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isChecking && isValid === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {!isChecking && isValid === false && <XCircle className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://exemplo.com/imagem.png"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowPreview(!showPreview)}
          title="Visualizar imagem"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={value === defaultValue}
          title="Restaurar padrão"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      
      {showPreview && value && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <div className="flex items-center justify-center p-4 bg-background rounded border min-h-[100px]">
            {isValid ? (
              <img 
                src={value} 
                alt="Preview" 
                className="max-h-[150px] max-w-full object-contain"
                onError={() => setIsValid(false)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {isChecking ? "Carregando..." : "Imagem inválida ou não encontrada"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Sistema: React.FC = () => {
  const { userData } = useAuth();
  const { config, loading, saving, saveConfig, defaultImages, defaultAppearance } = useSystemConfig();
  const { toast } = useToast();
  
  // Estados locais para edição
  const [images, setImages] = useState(config.images);
  const [appearance, setAppearance] = useState(config.appearance);
  const [companyInfo, setCompanyInfo] = useState(config.companyInfo);
  const [hasChanges, setHasChanges] = useState(false);

  // Atualizar estados quando config carregar
  useEffect(() => {
    if (!loading) {
      setImages(config.images);
      setAppearance(config.appearance);
      setCompanyInfo(config.companyInfo);
    }
  }, [config, loading]);

  // Verificar se é desenvolvedor
  if (userData?.perfil !== "DESENVOLVEDOR") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleImageChange = (key: keyof typeof images, value: string) => {
    setImages(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAppearanceChange = (key: keyof typeof appearance, value: string) => {
    setAppearance(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleCompanyInfoChange = (key: keyof typeof companyInfo, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await saveConfig({
      images,
      appearance,
      companyInfo,
    }, userData?.email);
    
    if (success) {
      setHasChanges(false);
    }
  };

  const handleResetImages = () => {
    setImages(DEFAULT_IMAGES);
    setHasChanges(true);
    toast({
      title: "Imagens restauradas",
      description: "Todas as imagens foram restauradas para os valores padrão. Clique em Salvar para aplicar.",
    });
  };

  const handleResetAppearance = () => {
    setAppearance(DEFAULT_APPEARANCE);
    setHasChanges(true);
    toast({
      title: "Aparência restaurada",
      description: "Todas as configurações de aparência foram restauradas. Clique em Salvar para aplicar.",
    });
  };

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
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Configurações do Sistema</h1>
                <p className="text-muted-foreground">
                  Personalize as imagens, aparência e informações do sistema
                </p>
              </div>
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
                Salvar Alterações
              </Button>
            </div>

            {hasChanges && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicar.
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="images" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                <TabsTrigger value="images" className="gap-2 py-3">
                  <Image className="h-4 w-4" />
                  <span className="hidden sm:inline">Imagens</span>
                </TabsTrigger>
                <TabsTrigger value="appearance" className="gap-2 py-3">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Aparência</span>
                </TabsTrigger>
                <TabsTrigger value="company" className="gap-2 py-3">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Empresa</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2 py-3">
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Avançado</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba Imagens */}
              <TabsContent value="images" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Imagens do Sistema</CardTitle>
                      <CardDescription>
                        Configure as logos e imagens exibidas em diferentes partes do sistema
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleResetImages} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Restaurar Todas
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Menu Lateral */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Menu Lateral (Sidebar)
                      </h3>
                      <div className="grid gap-4 ml-4">
                        <ImageField
                          label="Logo do Menu Lateral (Tema Escuro)"
                          description="Imagem exibida no topo do menu lateral quando o sistema está no modo escuro"
                          value={images.logoSidebarDark}
                          defaultValue={defaultImages.logoSidebarDark}
                          onChange={(v) => handleImageChange("logoSidebarDark", v)}
                          onReset={() => handleImageChange("logoSidebarDark", defaultImages.logoSidebarDark)}
                        />
                        <ImageField
                          label="Logo do Menu Lateral (Tema Claro)"
                          description="Imagem exibida no topo do menu lateral quando o sistema está no modo claro"
                          value={images.logoSidebarLight}
                          defaultValue={defaultImages.logoSidebarLight}
                          onChange={(v) => handleImageChange("logoSidebarLight", v)}
                          onReset={() => handleImageChange("logoSidebarLight", defaultImages.logoSidebarLight)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Página Inicial / SEO */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Página Inicial e Compartilhamento
                      </h3>
                      <div className="grid gap-4 ml-4">
                        <ImageField
                          label="Favicon do Site"
                          description="Ícone pequeno exibido na aba do navegador (recomendado: 32x32 ou 64x64 pixels)"
                          value={images.favicon}
                          defaultValue={defaultImages.favicon}
                          onChange={(v) => handleImageChange("favicon", v)}
                          onReset={() => handleImageChange("favicon", defaultImages.favicon)}
                        />
                        <ImageField
                          label="Imagem de Compartilhamento Social (OG Image)"
                          description="Imagem exibida ao compartilhar links do sistema no WhatsApp, Facebook, Twitter, etc."
                          value={images.ogImage}
                          defaultValue={defaultImages.ogImage}
                          onChange={(v) => handleImageChange("ogImage", v)}
                          onReset={() => handleImageChange("ogImage", defaultImages.ogImage)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Cabeçalhos das Páginas */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Cabeçalhos das Páginas
                      </h3>
                      <div className="grid gap-4 ml-4">
                        <ImageField
                          label="Logo do Cabeçalho - Ordens de Serviço"
                          description="Imagem exibida no topo da página de Ordens de Serviço"
                          value={images.logoHeaderOrdensServico}
                          defaultValue={defaultImages.logoHeaderOrdensServico}
                          onChange={(v) => handleImageChange("logoHeaderOrdensServico", v)}
                          onReset={() => handleImageChange("logoHeaderOrdensServico", defaultImages.logoHeaderOrdensServico)}
                        />
                        <ImageField
                          label="Logo do Cabeçalho - Execução de Preventivas"
                          description="Imagem exibida no topo da página de Execução de Manutenções Preventivas"
                          value={images.logoHeaderPreventivas}
                          defaultValue={defaultImages.logoHeaderPreventivas}
                          onChange={(v) => handleImageChange("logoHeaderPreventivas", v)}
                          onReset={() => handleImageChange("logoHeaderPreventivas", defaultImages.logoHeaderPreventivas)}
                        />
                        <ImageField
                          label="Logo do Cabeçalho - Parada de Máquina"
                          description="Imagem exibida no topo da página de Parada de Máquina"
                          value={images.logoHeaderParadaMaquina}
                          defaultValue={defaultImages.logoHeaderParadaMaquina}
                          onChange={(v) => handleImageChange("logoHeaderParadaMaquina", v)}
                          onReset={() => handleImageChange("logoHeaderParadaMaquina", defaultImages.logoHeaderParadaMaquina)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Documentos e Relatórios */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Documentos e Relatórios
                      </h3>
                      <div className="grid gap-4 ml-4">
                        <ImageField
                          label="Logo para Recibos e Comprovantes"
                          description="Imagem impressa nos recibos de medição de lenha e comprovantes de requisição de materiais"
                          value={images.logoRecibosComprovantes}
                          defaultValue={defaultImages.logoRecibosComprovantes}
                          onChange={(v) => handleImageChange("logoRecibosComprovantes", v)}
                          onReset={() => handleImageChange("logoRecibosComprovantes", defaultImages.logoRecibosComprovantes)}
                        />
                        <ImageField
                          label="Logo para Relatórios PDF"
                          description="Imagem exibida no cabeçalho dos relatórios exportados em formato PDF"
                          value={images.logoRelatoriosPDF}
                          defaultValue={defaultImages.logoRelatoriosPDF}
                          onChange={(v) => handleImageChange("logoRelatoriosPDF", v)}
                          onReset={() => handleImageChange("logoRelatoriosPDF", defaultImages.logoRelatoriosPDF)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Aparência */}
              <TabsContent value="appearance" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Aparência do Sistema</CardTitle>
                      <CardDescription>
                        Personalize as cores e estilo visual do sistema
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleResetAppearance} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Restaurar Padrão
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Cor Principal</Label>
                        <p className="text-sm text-muted-foreground">
                          Cor usada em botões, links e elementos de destaque
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={appearance.primaryColor}
                            onChange={(e) => handleAppearanceChange("primaryColor", e.target.value)}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={appearance.primaryColor}
                            onChange={(e) => handleAppearanceChange("primaryColor", e.target.value)}
                            placeholder="#0ea5e9"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Cor Secundária</Label>
                        <p className="text-sm text-muted-foreground">
                          Cor usada em elementos secundários e bordas
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={appearance.secondaryColor}
                            onChange={(e) => handleAppearanceChange("secondaryColor", e.target.value)}
                            className="w-14 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={appearance.secondaryColor}
                            onChange={(e) => handleAppearanceChange("secondaryColor", e.target.value)}
                            placeholder="#64748b"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="borderRadius">Arredondamento das Bordas</Label>
                        <p className="text-sm text-muted-foreground">
                          Controla o arredondamento dos botões e cards
                        </p>
                        <Input
                          id="borderRadius"
                          value={appearance.borderRadius}
                          onChange={(e) => handleAppearanceChange("borderRadius", e.target.value)}
                          placeholder="0.5rem"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="defaultTheme">Tema Padrão</Label>
                        <p className="text-sm text-muted-foreground">
                          Tema inicial ao abrir o sistema
                        </p>
                        <select
                          id="defaultTheme"
                          value={appearance.defaultTheme}
                          onChange={(e) => handleAppearanceChange("defaultTheme", e.target.value)}
                          className="w-full h-10 px-3 border rounded-md bg-background"
                        >
                          <option value="dark">Escuro</option>
                          <option value="light">Claro</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Empresa */}
              <TabsContent value="company" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Empresa</CardTitle>
                    <CardDescription>
                      Dados da empresa exibidos em relatórios e documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="systemName">Nome do Sistema</Label>
                        <p className="text-sm text-muted-foreground">
                          Nome exibido no título do navegador e cabeçalhos
                        </p>
                        <Input
                          id="systemName"
                          value={companyInfo.systemName}
                          onChange={(e) => handleCompanyInfoChange("systemName", e.target.value)}
                          placeholder="APEX HUB"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nome da Empresa</Label>
                        <p className="text-sm text-muted-foreground">
                          Razão social ou nome fantasia
                        </p>
                        <Input
                          id="companyName"
                          value={companyInfo.companyName}
                          onChange={(e) => handleCompanyInfoChange("companyName", e.target.value)}
                          placeholder="Empresa XYZ Ltda"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <p className="text-sm text-muted-foreground">
                          Número do CNPJ da empresa
                        </p>
                        <Input
                          id="cnpj"
                          value={companyInfo.cnpj}
                          onChange={(e) => handleCompanyInfoChange("cnpj", e.target.value)}
                          placeholder="00.000.000/0000-00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <p className="text-sm text-muted-foreground">
                          Telefone de contato principal
                        </p>
                        <Input
                          id="phone"
                          value={companyInfo.phone}
                          onChange={(e) => handleCompanyInfoChange("phone", e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <p className="text-sm text-muted-foreground">
                          E-mail de contato principal
                        </p>
                        <Input
                          id="email"
                          value={companyInfo.email}
                          onChange={(e) => handleCompanyInfoChange("email", e.target.value)}
                          placeholder="contato@empresa.com"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Endereço Completo</Label>
                        <p className="text-sm text-muted-foreground">
                          Endereço da sede da empresa
                        </p>
                        <Input
                          id="address"
                          value={companyInfo.address}
                          onChange={(e) => handleCompanyInfoChange("address", e.target.value)}
                          placeholder="Rua Exemplo, 123 - Bairro - Cidade/UF - CEP: 00000-000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Avançado */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Avançadas</CardTitle>
                    <CardDescription>
                      Opções técnicas e de performance do sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        Configurações avançadas serão adicionadas em breve.
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cache, performance, integrações e mais.
                      </p>
                    </div>

                    {/* Informações de última atualização */}
                    {config.updatedAt && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <h4 className="font-medium">Última Atualização</h4>
                        <p className="text-sm text-muted-foreground">
                          <strong>Data:</strong> {new Date(config.updatedAt).toLocaleString('pt-BR')}
                        </p>
                        {config.updatedBy && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Por:</strong> {config.updatedBy}
                          </p>
                        )}
                      </div>
                    )}
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

export default Sistema;
