import { useTheme } from "@/contexts/ThemeContext";
import { useSystemImages } from "@/hooks/useSystemConfig";

const LOGO_DARK = "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png";
const LOGO_LIGHT = "https://res.cloudinary.com/diomtgcvb/image/upload/v1769079482/APEX_LOGO_LIGHT_anyjn0.png";

export function useThemedLogo() {
  const { theme } = useTheme();
  const { images, loading } = useSystemImages();
  
  if (loading) {
    return theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
  }
  
  return theme === "dark" ? images.logoSidebarDark : images.logoSidebarLight;
}

// Hook para logos específicas de cada contexto
export function useContextLogo(context: "sidebar" | "header-os" | "header-preventivas" | "header-parada" | "recibos" | "pdf" | "comprovante-lenha" | "requisicoes" | "relatorio-lenha") {
  const { theme } = useTheme();
  const { images, loading } = useSystemImages();
  
  if (loading) {
    return LOGO_DARK;
  }
  
  switch (context) {
    case "sidebar":
      return theme === "dark" ? images.logoSidebarDark : images.logoSidebarLight;
    case "header-os":
      return images.logoHeaderOrdensServico;
    case "header-preventivas":
      return images.logoHeaderPreventivas;
    case "header-parada":
      return images.logoHeaderParadaMaquina;
    case "recibos":
      return images.logoRecibosComprovantes;
    case "pdf":
      return images.logoRelatoriosPDF;
    case "comprovante-lenha":
      return images.logoComprovanteLenha;
    case "requisicoes":
      return images.logoRequisicoes;
    case "relatorio-lenha":
      return images.logoRelatoriosPDF;
    default:
      return theme === "dark" ? images.logoSidebarDark : images.logoSidebarLight;
  }
}

export const APEX_LOGO_DARK = LOGO_DARK;
export const APEX_LOGO_LIGHT = LOGO_LIGHT;

export function getThemedLogo(theme: "light" | "dark") {
  return theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
}
