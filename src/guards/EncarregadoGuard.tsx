import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface EncarregadoGuardProps {
  children: React.ReactNode;
}

export function EncarregadoGuard({ children }: EncarregadoGuardProps) {
  const { userData, loading } = useAuth();
  const { toast } = useToast();

  const perfilPermitido = 
    userData?.perfil === "ENCARREGADO" || 
    userData?.perfil === "LIDER" || 
    userData?.perfil === "DESENVOLVEDOR";

  useEffect(() => {
    if (!loading && userData && !perfilPermitido) {
      toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Esta área é exclusiva para encarregados, líderes e desenvolvedores.",
      });
    }
  }, [loading, userData, perfilPermitido, toast]);

  // Aguarda carregamento do auth E dos dados do usuário
  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!perfilPermitido) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
