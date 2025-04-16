
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const ThemeToggle = () => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const { toast } = useToast();

  // Carrega o tema do localStorage ao iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to dark theme
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  // Atualiza o tema quando ele muda
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
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
