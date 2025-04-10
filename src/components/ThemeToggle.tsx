
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon } from "lucide-react";

interface ThemeToggleProps {
  iconOnly?: boolean;
}

const ThemeToggle = ({ iconOnly = false }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "default"}
      onClick={toggleTheme}
      title={theme === "light" ? "Modo escuro" : "Modo claro"}
    >
      {theme === "light" ? (
        <>
          <MoonIcon className={iconOnly ? "h-5 w-5" : "h-4 w-4 mr-2"} />
          {!iconOnly && <span>Escuro</span>}
        </>
      ) : (
        <>
          <SunIcon className={iconOnly ? "h-5 w-5" : "h-4 w-4 mr-2"} />
          {!iconOnly && <span>Claro</span>}
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
