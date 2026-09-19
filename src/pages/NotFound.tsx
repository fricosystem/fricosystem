import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, MessageCircle } from "lucide-react";

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
        <h1 className="text-4xl font-bold mb-4">Página não existe ou está em processo de desenvolvimento</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Desculpe, a página está inacessível. Favor entrar em contato com desenvolvedor do sistema.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <a href="/">Voltar para o Início</a>
          </Button>
          <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white" asChild>
            <a href="https://wa.me/5562993046419?text=Olá. Estou entrando em contato devido eu não estar conseguindo acessar uma página no Sistema de Gestão de Estoque Fricó. Poderia me ajudar?" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contato via WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;