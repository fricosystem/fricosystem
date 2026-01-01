import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface OrdensServicoGuardProps {
  children: React.ReactNode;
}

export function OrdensServicoGuard({ children }: OrdensServicoGuardProps) {
  const { userData, loading } = useAuth();
  const { toast } = useToast();

  // Verifica se tem permissão "tudo" ou "ordens_servico"
  const temPermissao = 
    userData?.permissoes?.includes("tudo") || 
    userData?.permissoes?.includes("ordens_servico");

  useEffect(() => {
    if (!loading && userData && !temPermissao) {
      toast({
        variant: "destructive",
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar Ordens de Serviço.",
      });
    }
  }, [loading, userData, temPermissao, toast]);

  // Aguarda carregamento do auth E dos dados do usuário
  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!temPermissao) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
