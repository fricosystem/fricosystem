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
        {/* Main button */}
        <Button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center p-0 bg-primary hover:bg-primary/90 border-0"
          aria-label="Abrir APEX Chat"
        >
          <Bot className="w-7 h-7 md:w-9 md:h-9 text-primary-foreground" />
          {/* Status indicator */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-background" />
        </Button>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-2 bg-popover text-popover-foreground text-xs font-medium px-2.5 py-1 rounded-md shadow-md border border-border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          APEX AI
        </div>
      </div>
      
      <ApexChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ApexChatFab;
