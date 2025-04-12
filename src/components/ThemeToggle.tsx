
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    // Always start with dark theme
    setTheme("dark");
  }, [setTheme]);

  // Carrega o tema do localStorage ao iniciar
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    toast({
      description: `Tema alterado para ${newTheme === "light" ? "claro" : "escuro"}`,
      duration: 2000,
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}>
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};

export default ThemeToggle;
