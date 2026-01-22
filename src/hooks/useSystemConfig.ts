import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useToast } from '@/components/ui/use-toast';

// URLs padrão do Cloudinary
const DEFAULT_IMAGES = {
  logoSidebarDark: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoSidebarLight: "https://res.cloudinary.com/diomtgcvb/image/upload/v1769079482/APEX_LOGO_LIGHT_anyjn0.png",
  favicon: "/favicon.ico",
  ogImage: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoHeaderOrdensServico: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoHeaderPreventivas: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoHeaderParadaMaquina: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoRecibosComprovantes: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoRelatoriosPDF: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoComprovanteLenha: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
  logoRequisicoes: "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png",
};

const DEFAULT_APPEARANCE = {
  primaryColor: "#0ea5e9",
  secondaryColor: "#64748b",
  defaultTheme: "dark" as "light" | "dark",
  borderRadius: "0.5rem",
};

const DEFAULT_COMPANY_INFO = {
  systemName: "APEX HUB",
  companyName: "",
  cnpj: "",
  address: "",
  phone: "",
  email: "",
};

export interface SystemImages {
  logoSidebarDark: string;
  logoSidebarLight: string;
  favicon: string;
  ogImage: string;
  logoHeaderOrdensServico: string;
  logoHeaderPreventivas: string;
  logoHeaderParadaMaquina: string;
  logoRecibosComprovantes: string;
  logoRelatoriosPDF: string;
  logoComprovanteLenha: string;
  logoRequisicoes: string;
}

export interface SystemAppearance {
  primaryColor: string;
  secondaryColor: string;
  defaultTheme: "light" | "dark";
  borderRadius: string;
}

export interface CompanyInfo {
  systemName: string;
  companyName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
}

export interface SystemConfig {
  images: SystemImages;
  appearance: SystemAppearance;
  companyInfo: CompanyInfo;
  updatedAt?: string;
  updatedBy?: string;
}

const CONFIG_DOC_ID = "system_settings";

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>({
    images: DEFAULT_IMAGES,
    appearance: DEFAULT_APPEARANCE,
    companyInfo: DEFAULT_COMPANY_INFO,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Carregar configurações do Firestore
  useEffect(() => {
    const docRef = doc(db, "system_config", CONFIG_DOC_ID);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<SystemConfig>;
        setConfig({
          images: { ...DEFAULT_IMAGES, ...data.images },
          appearance: { ...DEFAULT_APPEARANCE, ...data.appearance },
          companyInfo: { ...DEFAULT_COMPANY_INFO, ...data.companyInfo },
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        });
      } else {
        // Usa valores padrão se não existir
        setConfig({
          images: DEFAULT_IMAGES,
          appearance: DEFAULT_APPEARANCE,
          companyInfo: DEFAULT_COMPANY_INFO,
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar configurações:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Salvar configurações
  const saveConfig = useCallback(async (
    newConfig: Partial<SystemConfig>,
    userEmail?: string
  ) => {
    setSaving(true);
    try {
      const docRef = doc(db, "system_config", CONFIG_DOC_ID);
      const updatedConfig = {
        ...config,
        ...newConfig,
        images: { ...config.images, ...newConfig.images },
        appearance: { ...config.appearance, ...newConfig.appearance },
        companyInfo: { ...config.companyInfo, ...newConfig.companyInfo },
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail || "unknown",
      };
      
      await setDoc(docRef, updatedConfig, { merge: true });
      
      toast({
        title: "✅ Configurações salvas",
        description: "As alterações foram aplicadas com sucesso",
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [config, toast]);

  // Restaurar valores padrão de imagens
  const resetImages = useCallback(() => {
    return DEFAULT_IMAGES;
  }, []);

  // Restaurar valores padrão de aparência
  const resetAppearance = useCallback(() => {
    return DEFAULT_APPEARANCE;
  }, []);

  // Validar se é uma URL de imagem válida
  const validateImageUrl = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!url || url.trim() === "") {
        resolve(false);
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }, []);

  return {
    config,
    loading,
    saving,
    saveConfig,
    resetImages,
    resetAppearance,
    validateImageUrl,
    defaultImages: DEFAULT_IMAGES,
    defaultAppearance: DEFAULT_APPEARANCE,
  };
}

// Hook simplificado para obter apenas as imagens (para uso em outros componentes)
export function useSystemImages() {
  const [images, setImages] = useState<SystemImages>(DEFAULT_IMAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, "system_config", CONFIG_DOC_ID);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setImages({ ...DEFAULT_IMAGES, ...data.images });
      }
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { images, loading };
}

export { DEFAULT_IMAGES, DEFAULT_APPEARANCE, DEFAULT_COMPANY_INFO };
