import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Box, Square } from 'lucide-react';
import { useThemedLogo } from "@/hooks/useThemedLogo";

const WelcomePage = () => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const logoSrc = useThemedLogo();
  
  const textSequence = [
    'Aguarde aprovação pela nossa equipe administrativa',
    'Já conhece a inteligência do APEX ERP?',
    'Sabia que o APEX ERP otimiza seu estoque em tempo real?',
    'Você está prestes a experimentar um novo nível de controle logístico.',
    'Com o APEX ERP, cada produto tem seu lugar certo.',
    'Estoque semiautomatizado com decisões inteligentes.',
    'APEX ERP: feito para reduzir desperdícios e maximizar eficiência.',
    'Sabia que você pode rastrear cada movimentação de forma precisa?',
    'Um arrasta e solta pode ser o suficiente para reorganizar seu inventário.',
    'Precisa de uma requisição? Faça direto pelo sistema!',
    'O APEX ERP avisa para não deixar faltar produtos no estoque.',
    'Fácil de usar com amplas funcionalidades.',
    'Enquanto você aguarda, o sistema já está se preparando jogos para você.'
  ];

  // Text animation effect
  useEffect(() => {
    let timer;
    const currentText = textSequence[currentTextIndex];
    
    if (isTyping) {
      // Typing animation
      if (displayText.length < currentText.length) {
        timer = setTimeout(() => {
          setDisplayText(currentText.substring(0, displayText.length + 1));
        }, 30);
      } else {
        // Finished typing, wait 2 seconds then start deleting
        timer = setTimeout(() => {
          setIsTyping(false);
          setIsDeleting(true);
        }, 2000);
      }
    } else if (isDeleting) {
      // Deleting animation
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.substring(0, displayText.length - 1));
        }, 10);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        setCurrentTextIndex((prevIndex) => 
          (prevIndex + 1) % textSequence.length
        );
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, currentTextIndex, isTyping, isDeleting, textSequence]);

  // Generate random particles with individual paths
  const particles = Array.from({ length: 15 }, (_, i) => {
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    const endX = Math.random() * window.innerWidth;
    const endY = Math.random() * window.innerHeight;
    const duration = 15 + Math.random() * 30;
    const delay = Math.random() * 5;
    const size = 3 + Math.random() * 5;
    const opacity = 0.2 + Math.random() * 0.5;
    
    return {
      id: i,
      startX,
      startY,
      endX,
      endY,
      duration,
      delay,
      size,
      opacity
    };
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background particles with individual random paths */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          initial={{
            x: particle.startX,
            y: particle.startY,
            opacity: 0
          }}
          animate={{
            x: [particle.startX, particle.endX, particle.startX],
            y: [particle.startY, particle.endY, particle.startY],
            opacity: [0, particle.opacity, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
          }}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`
          }}
        >
          <Box className="w-full h-full text-muted-foreground" />
        </motion.div>
      ))}

      {/* Floating elements with independent random movements */}
      <motion.div
        className="absolute top-1/4 left-1/4"
        animate={{
          x: [0, 50, 0, -30, 0],
          y: [0, -20, 30, 0, 0],
          rotate: [0, 10, -5, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <Box className="w-8 h-8 text-muted-foreground opacity-70" />
      </motion.div>

      <motion.div
        className="absolute top-1/3 right-1/4"
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -20, 0],
          scale: [1, 1.3, 0.8, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <Box className="w-6 h-6 text-muted-foreground opacity-70" />
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 left-1/3"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 40, 0],
          rotate: [0, -15, 10, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
      >
        <Box className="w-7 h-7 text-muted-foreground opacity-70" />
      </motion.div>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="w-full max-w-4xl"
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-12 md:p-20 shadow-2xl overflow-hidden relative group">
            {/* Inner glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
            
            <div className="relative z-10 text-center">
              {/* Logo APEX ERP */}
              <div className="mx-auto mb-12 flex justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img 
                    src={logoSrc} 
                    alt="APEX ERP Logo" 
                    className="w-32 h-32 md:w-48 md:h-48 object-scale-down drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                  />
                </motion.div>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-10 leading-tight tracking-tight min-h-[4em] flex flex-col justify-center">
                <span className="block">{displayText}</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-blue-400 inline-block h-1 w-12 bg-blue-400 mx-auto mt-2 rounded-full"
                >
                </motion.span>
              </h1>

              <div className="pt-8 border-t border-white/10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full"
                >
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <p className="text-gray-300 text-sm md:text-base font-medium">
                    Status: <span className="text-white">Aguardando aprovação administrativa</span>
                  </p>
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3, duration: 1 }}
                  className="text-gray-500 text-xs md:text-sm mt-6 uppercase tracking-[0.2em] font-bold"
                >
                  Sincronizando ambiente industrial...
                </motion.p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;