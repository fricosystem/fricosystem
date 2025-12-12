import { useEffect, useRef, useState } from "react";
import { ParadaMaquina } from "@/types/typesParadaMaquina";
import { toast } from "sonner";

interface AlertedParada {
  id: string;
  alertedAt: number;
}

export const useParadaAlerts = (paradas: ParadaMaquina[]) => {
  const alertedParadas = useRef<AlertedParada[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Criar elemento de áudio para notificação
    if (!audioRef.current) {
      audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYAMJnSz6tsHgU2l9XUo2YdBTWY1NKjZBwFNprU0aNkHAU2mtTRo2QcBTaa1NGjZBwFNprU0aNkHAU2mtTRo2QcBTaa1NGjZBwFNprU0aNkHAU2mtTRo2QcBTaa1NGjZBwFNprU0aNkHAU2mtTRo2QcBTaa1NGjZBwF");
    }

    const checkExpiringParadas = () => {
      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();
      
      paradas.forEach(parada => {
        if (parada.status !== "aguardando") return;
        if (!parada.hrFinal) return;
        
        const [hF, mF] = parada.hrFinal.split(":").map(Number);
        const fimMinutos = hF * 60 + mF;
        const diffMinutos = fimMinutos - horaAtual;
        
        // Alerta 2 minutos antes
        if (diffMinutos <= 2 && diffMinutos > 0) {
          const jaAlertou = alertedParadas.current.find(a => a.id === parada.id);
          
          if (!jaAlertou) {
            // Tocar som
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            
            // Mostrar notificação
            toast.warning(
              `⚠️ Parada prestes a expirar!`,
              {
                description: `${parada.equipamento} - Expira em ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`,
                duration: 10000,
              }
            );
            
            alertedParadas.current.push({ id: parada.id, alertedAt: Date.now() });
          }
        }
      });
      
      // Limpar alertas antigos (mais de 1 hora)
      const umaHoraAtras = Date.now() - 3600000;
      alertedParadas.current = alertedParadas.current.filter(a => a.alertedAt > umaHoraAtras);
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkExpiringParadas, 30000);
    checkExpiringParadas();
    
    return () => clearInterval(interval);
  }, [paradas]);
};

// Hook para calcular tempo restante
export const useTempoRestante = (hrFinal?: string) => {
  const [tempoRestante, setTempoRestante] = useState<string | null>(null);
  const [isExpiring, setIsExpiring] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!hrFinal) {
      setTempoRestante(null);
      return;
    }

    const calcular = () => {
      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes();
      const [hF, mF] = hrFinal.split(":").map(Number);
      const fimMinutos = hF * 60 + mF;
      const diffMinutos = fimMinutos - horaAtual;
      
      if (diffMinutos <= 0) {
        setTempoRestante("Expirado");
        setIsExpired(true);
        setIsExpiring(false);
      } else if (diffMinutos <= 2) {
        setIsExpiring(true);
        setIsExpired(false);
        if (diffMinutos < 1) {
          const segundosRestantes = Math.ceil((fimMinutos - horaAtual) * 60);
          setTempoRestante(`${segundosRestantes}s`);
        } else {
          setTempoRestante(`${diffMinutos}min`);
        }
      } else if (diffMinutos < 60) {
        setTempoRestante(`${diffMinutos}min`);
        setIsExpiring(false);
        setIsExpired(false);
      } else {
        const horas = Math.floor(diffMinutos / 60);
        const mins = diffMinutos % 60;
        setTempoRestante(`${horas}h${mins > 0 ? ` ${mins}min` : ''}`);
        setIsExpiring(false);
        setIsExpired(false);
      }
    };

    calcular();
    const interval = setInterval(calcular, 10000); // Atualiza a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [hrFinal]);

  return { tempoRestante, isExpiring, isExpired };
};
