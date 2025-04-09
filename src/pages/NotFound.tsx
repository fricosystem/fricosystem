
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Rota não existente acessada:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-8">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Página não encontrada</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Desculpe, a página que você está procurando não existe ou foi removida.
        </p>
        <Button asChild>
          <a href="/">Voltar para o Início</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
