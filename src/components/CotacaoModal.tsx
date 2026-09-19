import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getProductQuotes, ProductQuote } from "@/services/quoteService";
import { MapPin, Loader2, DollarSign, Clock, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface CotacaoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
}

const CotacaoModal = ({ isOpen, onOpenChange, productName }: CotacaoModalProps) => {
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<ProductQuote[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchLocationAndQuotes = async () => {
    setLoading(true);
    setQuotes([]);

    // Busca localização
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          await fetchQuotes(coords);
        },
        async (error) => {
          console.warn("Geolocation error:", error);
          toast.warning("Não foi possível obter sua localização exata. Buscando fornecedores gerais.");
          await fetchQuotes();
        }
      );
    } else {
      await fetchQuotes();
    }
  };

  const fetchQuotes = async (coords?: { lat: number; lng: number }) => {
    try {
      const response = await getProductQuotes(productName, coords);
      setQuotes(response.quotes);
      toast.success("Cotações encontradas!");
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Erro ao buscar cotações da IA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productName) {
      fetchLocationAndQuotes();
    }
  }, [isOpen, productName]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShoppingCart className="h-5 w-5 text-cyan-400" />
            Cotação IA: {productName}
          </DialogTitle>
          <DialogDescription className="text-slate-400 italic">
            Buscando os melhores preços e fornecedores próximos para você.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
              <p className="text-cyan-400 animate-pulse font-medium">Analisando mercado com IA...</p>
            </div>
          ) : quotes.length > 0 ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {quotes.map((quote, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-lg text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {quote.supplier}
                      </h4>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {quote.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-cyan-400">
                        {formatCurrency(quote.price)}
                      </div>
                      <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                        Distância: {quote.distance} km
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>{quote.payment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span>Entrega: {quote.delivery}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              Nenhuma cotação disponível no momento.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-900"
          >
            Fechar
          </Button>
          <Button 
            onClick={fetchLocationAndQuotes}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
          >
            {loading ? "Buscando..." : "Atualizar Cotações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CotacaoModal;

import { ShoppingCart } from "lucide-react";
