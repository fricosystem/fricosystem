import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Moon, Sun, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface PerfilParadaProps {
  stats: {
    abertas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
}

export function PerfilParada({ stats }: PerfilParadaProps) {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const iniciais = userData?.nome
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "US";

  return (
    <div className="space-y-4 pb-32 px-1">
      {/* Card de Perfil */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData?.imagem_perfil} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {iniciais}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{userData?.nome || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground">{userData?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">{userData?.cargo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Tema */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <span className="text-sm font-medium">Tema Escuro</span>
                <p className="text-xs text-muted-foreground">
                  {theme === "dark" ? "Ativado" : "Desativado"}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              className="scale-110"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Estatísticas de Paradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm">Paradas Abertas</span>
            </div>
            <span className="text-lg font-bold">{stats.abertas}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm">Em Andamento</span>
            </div>
            <span className="text-lg font-bold">{stats.emAndamento}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm">Concluídas</span>
            </div>
            <span className="text-lg font-bold">{stats.concluidas}</span>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Logout */}
      <Button
        variant="destructive"
        className="w-full h-14 text-base font-semibold rounded-xl"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Sair da Conta
      </Button>
    </div>
  );
}
