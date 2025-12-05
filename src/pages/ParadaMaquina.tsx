import { useState } from "react";
import { Bell, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import NovaParadaMaquina from "@/components/ParadaMaquina/NovaParadaMaquina";
import ListaParadasMaquina from "@/components/ParadaMaquina/ListaParadasMaquina";

type TabType = "nova" | "lista";

export default function ParadaMaquina() {
  const [activeTab, setActiveTab] = useState<TabType>("nova");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Fixo */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div>
              <h1 className="text-base sm:text-lg font-bold">Parada de Máquina</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Registro de Paradas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-4 overflow-auto">
        {activeTab === "nova" && <NovaParadaMaquina />}
        {activeTab === "lista" && <ListaParadasMaquina />}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 bg-background/95 backdrop-blur border-t safe-area-bottom">
        <div className="container mx-auto px-2">
          <div className="grid grid-cols-2 gap-1 py-2">
            <Button
              variant={activeTab === "nova" ? "default" : "ghost"}
              className="flex flex-col items-center gap-1 h-14 sm:h-16"
              onClick={() => setActiveTab("nova")}
            >
              <span className="text-xs sm:text-sm font-medium">Nova Parada</span>
            </Button>
            <Button
              variant={activeTab === "lista" ? "default" : "ghost"}
              className="flex flex-col items-center gap-1 h-14 sm:h-16"
              onClick={() => setActiveTab("lista")}
            >
              <span className="text-xs sm:text-sm font-medium">Paradas Criadas</span>
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}