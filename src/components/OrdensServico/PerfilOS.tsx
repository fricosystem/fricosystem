import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail, Building } from "lucide-react";

interface PerfilOSProps {
  stats?: {
    abertas: number;
    concluidas: number;
    total: number;
  };
}

export function PerfilOS({ stats }: PerfilOSProps) {
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Card do Perfil */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={(userData as any)?.foto} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {userData?.nome ? getInitials(userData.nome) : <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{userData?.nome || "Usuário"}</h3>
              <p className="text-sm text-muted-foreground">{userData?.perfil || "Sem perfil"}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{userData?.email || "Sem email"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{(userData as any)?.setor || "Sem setor"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Estatísticas */}
      {stats && (
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Minhas Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-600">{stats.abertas}</p>
                <p className="text-xs text-muted-foreground">Abertas</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Logout */}
      <Button 
        variant="destructive" 
        className="w-full" 
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
