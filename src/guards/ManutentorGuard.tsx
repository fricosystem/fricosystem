import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface ManutentorGuardProps {
  children: React.ReactNode;
}

export function ManutentorGuard({ children }: ManutentorGuardProps) {
  const { userData, loading } = useAuth();
  const { toast } = useToast();

  const perfilPermitido = userData?.perfil === "MANUTENTOR" || userData?.perfil === "DESENVOLVEDOR";

  useEffect(() => {
    if (!loading && userData && !perfilPermitido) {
      toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Esta área é exclusiva para manutentores e desenvolvedores.",
      });
    }
  }, [loading, userData, perfilPermitido, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData || !perfilPermitido) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
