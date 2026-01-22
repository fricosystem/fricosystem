import { useTheme } from "@/contexts/ThemeContext";

const LOGO_DARK = "https://res.cloudinary.com/diomtgcvb/image/upload/v1768956525/APEX_LOGO_ssi5g2.png";
const LOGO_LIGHT = "https://res.cloudinary.com/diomtgcvb/image/upload/v1769079482/APEX_LOGO_LIGHT_anyjn0.png";

export function useThemedLogo() {
  const { theme } = useTheme();
  
  return theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
}

export const APEX_LOGO_DARK = LOGO_DARK;
export const APEX_LOGO_LIGHT = LOGO_LIGHT;

export function getThemedLogo(theme: "light" | "dark") {
  return theme === "dark" ? LOGO_DARK : LOGO_LIGHT;
}
