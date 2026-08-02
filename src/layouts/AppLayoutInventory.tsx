import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Home, List, Map, ShoppingCart } from "lucide-react";

interface AppLayoutInventoryProps {
  children: ReactNode;
}

const AppLayoutInventory: React.FC<AppLayoutInventoryProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-3 px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Package className="h-6 w-6 text-primary" />
              <span>StorageSystem</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Início</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/inventory" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  <span>Estoque</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/products" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>Produtos</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/purchases" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Compras</span>
                </Link>
              </Button>
            </nav>
            
            <Button variant="outline" className="md:flex">
              <Map className="h-4 w-4 mr-2" />
              Meu Estoque
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 bg-muted/20">
        {children}
      </main>
      
      <footer className="border-t py-4 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 StorageSystem. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Suporte
              </Button>
              <Button variant="ghost" size="sm">
                Termos
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayoutInventory;
