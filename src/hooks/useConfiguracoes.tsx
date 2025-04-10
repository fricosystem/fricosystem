
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState<boolean>(true);
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

  useEffect(() => {
    const fetchConfiguracoes = async () => {
      try {
        setLoading(true);
        
        // Fetch all configuration types
        const { data: emailData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 'email')
          .single();
          
        const { data: notificacoesData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 'notificacoes')
          .single();
          
        const { data: backupData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 'backup')
          .single();
          
        const { data: themeData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 'theme')
          .single();

        // Update state with fetched data
        if (emailData) setEmailConfig(emailData.valor as EmailConfig);
        if (notificacoesData) setNotificationSettings(notificacoesData.valor as NotificationSettings);
        if (backupData) setBackupSettings(backupData.valor as BackupSettings);
        if (themeData) setTheme(themeData.valor as ThemeSettings);
        
      } catch (error) {
        console.error("Error fetching configurations:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as configurações.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfiguracoes();
  }, [toast]);

  const saveEmailConfig = async () => {
    try {
      setSaveInProgress(true);
      
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ 
          id: 'email', 
          valor: emailConfig,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Configurações de e-mail salvas",
        description: "As configurações de e-mail foram atualizadas com sucesso.",
      });
      
    } catch (error) {
      console.error("Error saving email config:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de e-mail.",
        variant: "destructive",
      });
    } finally {
      setSaveInProgress(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaveInProgress(true);
      
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ 
          id: 'notificacoes', 
          valor: notificationSettings,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Notificações salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
      
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as preferências de notificação.",
        variant: "destructive",
      });
    } finally {
      setSaveInProgress(false);
    }
  };
  
  const saveBackupSettings = async () => {
    try {
      setSaveInProgress(true);
      
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ 
          id: 'backup', 
          valor: backupSettings,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Configurações de backup salvas",
        description: "As configurações de backup foram atualizadas com sucesso.",
      });
      
    } catch (error) {
      console.error("Error saving backup settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de backup.",
        variant: "destructive",
      });
    } finally {
      setSaveInProgress(false);
    }
  };
  
  const saveThemeSettings = async () => {
    try {
      setSaveInProgress(true);
      
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ 
          id: 'theme', 
          valor: theme,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Configurações de tema salvas",
        description: "As configurações de tema foram atualizadas com sucesso.",
      });
      
    } catch (error) {
      console.error("Error saving theme settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações de tema.",
        variant: "destructive",
      });
    } finally {
      setSaveInProgress(false);
    }
  };
  
  const triggerManualBackup = async () => {
    try {
      setSaveInProgress(true);
      
      // Update last backup time to now
      const newBackupSettings = {
        ...backupSettings,
        lastBackup: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('configuracoes')
        .upsert({ 
          id: 'backup', 
          valor: newBackupSettings,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setBackupSettings(newBackupSettings);
      
      toast({
        title: "Backup iniciado",
        description: "O backup manual foi iniciado e será concluído em breve.",
      });
      
    } catch (error) {
      console.error("Error triggering manual backup:", error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar o backup manual.",
        variant: "destructive",
      });
    } finally {
      setSaveInProgress(false);
    }
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
