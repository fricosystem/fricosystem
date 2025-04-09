
import React, { useState } from "react";
import AppLayout from "@/layouts/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Configuracoes = () => {
  const { toast } = useToast();
  const [emailConfig, setEmailConfig] = useState({
    smtpServer: "smtp.fricoalimentos.com.br",
    smtpPort: "587",
    username: "notificacoes@fricoalimentos.com.br",
    password: "********",
    senderName: "Sistema Fricó",
    senderEmail: "notificacoes@fricoalimentos.com.br",
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    lowStock: true,
    newOrders: true,
    systemUpdates: true,
    dailyReports: false,
    invoiceIssues: true,
  });
  
  const [backupSettings, setBackupSettings] = useState({
    frequency: "daily",
    retentionDays: "30",
    time: "02:00",
    lastBackup: "09/04/2023 02:00:12",
    nextBackup: "10/04/2023 02:00:00",
  });

  const [theme, setTheme] = useState({
    mode: "light",
    accentColor: "#9333ea",
    sidebarCollapsed: false,
  });

  const handleEmailFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configurações de e-mail salvas",
      description: "As configurações de e-mail foram atualizadas com sucesso.",
    });
  };

  const handleNotificationSettingsChange = (key: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleBackupSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configurações de backup salvas",
      description: "As configurações de backup foram atualizadas com sucesso.",
    });
  };

  const triggerManualBackup = () => {
    toast({
      title: "Backup iniciado",
      description: "O backup manual foi iniciado e será concluído em breve.",
    });
  };

  const handleThemeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Configurações de tema salvas",
      description: "As configurações de tema foram atualizadas com sucesso.",
    });
  };

  return (
    <AppLayout title="Configurações">
      <Tabs defaultValue="email" className="w-full">
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="backup">Backups</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure os parâmetros para envio de emails pelo sistema.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleEmailFormSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">Servidor SMTP</Label>
                    <Input
                      id="smtpServer"
                      value={emailConfig.smtpServer}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, smtpServer: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Porta SMTP</Label>
                    <Input
                      id="smtpPort"
                      value={emailConfig.smtpPort}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, smtpPort: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Usuário</Label>
                    <Input
                      id="username"
                      value={emailConfig.username}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={emailConfig.password}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, password: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="senderName">Nome do Remetente</Label>
                    <Input
                      id="senderName"
                      value={emailConfig.senderName}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, senderName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senderEmail">Email do Remetente</Label>
                    <Input
                      id="senderEmail"
                      value={emailConfig.senderEmail}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, senderEmail: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Salvar Configurações</Button>
                <Button variant="outline" className="ml-2">
                  Testar Conexão
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure quais notificações você deseja receber do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <Label htmlFor="lowStock" className="text-base font-medium">
                    Estoque Baixo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notificações quando produtos atingem níveis críticos de estoque.
                  </p>
                </div>
                <Switch
                  id="lowStock"
                  checked={notificationSettings.lowStock}
                  onCheckedChange={() => handleNotificationSettingsChange("lowStock")}
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <Label htmlFor="newOrders" className="text-base font-medium">
                    Novos Pedidos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas quando novos pedidos forem registrados.
                  </p>
                </div>
                <Switch
                  id="newOrders"
                  checked={notificationSettings.newOrders}
                  onCheckedChange={() => handleNotificationSettingsChange("newOrders")}
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <Label htmlFor="systemUpdates" className="text-base font-medium">
                    Atualizações do Sistema
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre novas funcionalidades e atualizações.
                  </p>
                </div>
                <Switch
                  id="systemUpdates"
                  checked={notificationSettings.systemUpdates}
                  onCheckedChange={() => handleNotificationSettingsChange("systemUpdates")}
                />
              </div>

              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <Label htmlFor="dailyReports" className="text-base font-medium">
                    Relatórios Diários
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receber relatórios diários de atividades e vendas.
                  </p>
                </div>
                <Switch
                  id="dailyReports"
                  checked={notificationSettings.dailyReports}
                  onCheckedChange={() => handleNotificationSettingsChange("dailyReports")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="invoiceIssues" className="text-base font-medium">
                    Problemas em Notas Fiscais
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas sobre problemas na emissão de notas fiscais.
                  </p>
                </div>
                <Switch
                  id="invoiceIssues"
                  checked={notificationSettings.invoiceIssues}
                  onCheckedChange={() => handleNotificationSettingsChange("invoiceIssues")}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() =>
                  toast({
                    title: "Notificações salvas",
                    description: "Suas preferências de notificação foram atualizadas.",
                  })
                }
              >
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Backup</CardTitle>
              <CardDescription>
                Configure a frequência e as opções de backup do sistema.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleBackupSettingsSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência</Label>
                    <Select
                      value={backupSettings.frequency}
                      onValueChange={(value) =>
                        setBackupSettings({ ...backupSettings, frequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Horário</Label>
                    <Input
                      id="time"
                      type="time"
                      value={backupSettings.time}
                      onChange={(e) =>
                        setBackupSettings({ ...backupSettings, time: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Dias de Retenção</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="1"
                    value={backupSettings.retentionDays}
                    onChange={(e) =>
                      setBackupSettings({ ...backupSettings, retentionDays: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Número de dias que os backups serão mantidos antes de serem removidos.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Último backup:</span>
                    <span className="text-sm">{backupSettings.lastBackup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Próximo backup:</span>
                    <span className="text-sm">{backupSettings.nextBackup}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit">Salvar Configurações</Button>
                <Button variant="outline" onClick={triggerManualBackup}>
                  Iniciar Backup Manual
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema conforme sua preferência.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleThemeSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="themeMode">Modo de Tema</Label>
                  <Select
                    value={theme.mode}
                    onValueChange={(value) => setTheme({ ...theme, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Cor de Destaque</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) =>
                        setTheme({ ...theme, accentColor: e.target.value })
                      }
                      className="w-12 h-8 p-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {theme.accentColor}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sidebarCollapsed" className="text-base font-medium">
                      Barra lateral recolhida por padrão
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Iniciar com a barra lateral recolhida.
                    </p>
                  </div>
                  <Switch
                    id="sidebarCollapsed"
                    checked={theme.sidebarCollapsed}
                    onCheckedChange={(checked) =>
                      setTheme({ ...theme, sidebarCollapsed: checked })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Salvar Preferências</Button>
                <Button variant="outline" className="ml-2">
                  Restaurar Padrões
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Configuracoes;
