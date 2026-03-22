import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getGroqApiKey } from "@/services/apiKeyService";

interface ApiStatusProps {
  className?: string;
}

export const ApexChatApiStatus = ({ className = "" }: ApiStatusProps) => {
  const [status, setStatus] = useState<"loading" | "configured" | "missing">("loading");

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const apiKey = await getGroqApiKey();
        setStatus(apiKey ? "configured" : "missing");
      } catch (error) {
        console.error("[v0] Erro ao verificar chave de API:", error);
        setStatus("missing");
      }
    };

    checkApiKey();
  }, []);

  if (status === "loading") {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Verificando configuração...
      </div>
    );
  }

  if (status === "configured") {
    return (
      <div className={`flex items-center gap-2 text-xs text-green-600 ${className}`}>
        <Check className="w-3 h-3" />
        APEX Chat configurado
      </div>
    );
  }

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800 text-sm">
        <strong>APEX Chat não configurado:</strong> A chave de API do Groq não foi encontrada. 
        Adicione o campo <code className="bg-yellow-100 px-1 rounded text-xs">groq</code> com sua chave de API na coleção 
        <code className="bg-yellow-100 px-1 rounded text-xs">api_key</code> do Firebase. 
        Veja <a href="./APEX_CHAT_SETUP.md" className="underline hover:text-yellow-900">o guia de configuração</a>.
      </AlertDescription>
    </Alert>
  );
};

export default ApexChatApiStatus;
