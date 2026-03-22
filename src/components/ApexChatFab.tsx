import { Bot } from "lucide-react";
import ApexChatModal from "./ApexChatModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ApexChatFab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Não exibe se não estiver autenticado ou se estiver na página inicial (login)
  if (!user || location.pathname === "/") {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 group">
        {/* Halo/Aura background effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-xl group-hover:opacity-50 group-hover:scale-110 transition-all duration-300 animate-pulse"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/60 opacity-20 blur-lg group-hover:opacity-40 transition-all duration-300"></div>

        {/* Main button */}
        <Button
          onClick={() => setIsOpen(true)}
          className="relative w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 transform group-hover:scale-110 flex items-center justify-center p-0 bg-gradient-to-br from-blue-600 via-primary to-blue-700 hover:from-blue-500 hover:via-primary/90 hover:to-blue-600 border border-blue-400/50 backdrop-blur-sm"
          aria-label="Abrir APEX Chat"
        >
          <Bot className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
          
          {/* Pulsing badge indicator */}
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
        </Button>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          APEX AI
        </div>
      </div>
      
      <ApexChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ApexChatFab;
