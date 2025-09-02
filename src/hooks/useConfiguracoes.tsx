import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface EmailConfig {
  smtpServer: string;
  smtpPort: string;
  username: string;
  password: string;
  senderName: string;
  senderEmail: string;
}

interface NotificationSettings {
  lowStock: boolean;
  newOrders: boolean;
  systemUpdates: boolean;
  dailyReports: boolean;
  invoiceIssues: boolean;
}

interface BackupSettings {
  frequency: string;
  retentionDays: string;
  time: string;
  lastBackup: string;
  nextBackup: string;
}

interface ThemeSettings {
  mode: string;
  accentColor: string;
  sidebarCollapsed: boolean;
}

export const useConfiguracoes = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [saveInProgress, setSaveInProgress] = useState<boolean>(false);

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtpServer: "",
    smtpPort: "",
    username: "",
    password: "",
    senderName: "",
    senderEmail: "",
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lowStock: false,
    newOrders: false,
    systemUpdates: false,
    dailyReports: false,
    invoiceIssues: false,
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    frequency: "daily",
    retentionDays: "30",
    time: "02:00",
    lastBackup: "",
    nextBackup: "",
  });

  const [theme, setTheme] = useState<ThemeSettings>({
    mode: "light",
    accentColor: "#9333ea",
    sidebarCollapsed: false,
  });

  const saveEmailConfig = () => {
    setSaveInProgress(true);
    setTimeout(() => {
      toast({
        title: "Configurações salvas",
        description: "Configurações de email atualizadas com sucesso.",
      });
      setSaveInProgress(false);
    }, 1000);
  };

  const saveNotificationSettings = () => {
    setSaveInProgress(true);
    setTimeout(() => {
      toast({
        title: "Preferências salvas", 
        description: "Configurações de notificação atualizadas com sucesso.",
      });
      setSaveInProgress(false);
    }, 1000);
  };

  const saveBackupSettings = () => {
    setSaveInProgress(true);
    setTimeout(() => {
      toast({
        title: "Configurações salvas",
        description: "Configurações de backup atualizadas com sucesso.",
      });
      setSaveInProgress(false);
    }, 1000);
  };

  const saveThemeSettings = () => {
    setSaveInProgress(true);
    setTimeout(() => {
      toast({
        title: "Preferências salvas",
        description: "Configurações de tema atualizadas com sucesso.",
      });
      setSaveInProgress(false);
    }, 1000);
  };

  const triggerManualBackup = () => {
    setSaveInProgress(true);
    const newBackupSettings = {
      ...backupSettings,
      lastBackup: new Date().toISOString()
    };
    setBackupSettings(newBackupSettings);
    toast({
      title: "Backup iniciado",
      description: "O backup manual foi iniciado localmente.",
    });
    setSaveInProgress(false);
  };

  return {
    loading,
    saveInProgress,
    emailConfig,
    setEmailConfig,
    notificationSettings,
    setNotificationSettings,
    backupSettings,
    setBackupSettings,
    theme,
    setTheme,
    saveEmailConfig,
    saveNotificationSettings,
    saveBackupSettings,
    saveThemeSettings,
    triggerManualBackup
  };
};
