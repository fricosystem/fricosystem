import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogOut, CheckCircle2, Clock, TrendingUp, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PerfilManutentorProps {
  stats: {
    hoje: number;
    atrasadas: number;
    concluidas: number;
    emAndamento: number;
    total: number;
  };
}

export function PerfilManutentor({ stats }: PerfilManutentorProps) {
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
    .slice(0, 2) || "MA";

  return (
    <div className="space-y-4 pb-20">
      {/* Card de Perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData?.imagem_perfil} />
              <AvatarFallback className="text-2xl">{iniciais}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{userData?.nome}</h2>
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

      {/* Estatísticas Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Minhas Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm">Tarefas Concluídas</span>
            </div>
            <span className="text-lg font-bold">{stats.concluidas}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <span className="text-sm">Em Andamento</span>
            </div>
            <span className="text-lg font-bold">{stats.emAndamento}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm">Total de Tarefas</span>
            </div>
            <span className="text-lg font-bold">{stats.total}</span>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Perfil</span>
            <span className="font-medium">{userData?.perfil || "Manutentor"}</span>
          </div>
          {userData?.centro_de_custo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Centro de Custo</span>
              <span className="font-medium">{userData.centro_de_custo}</span>
            </div>
          )}
          {userData?.unidade && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unidade</span>
              <span className="font-medium">{userData.unidade}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Logout */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
}
