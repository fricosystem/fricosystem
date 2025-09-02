import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Box, Square } from 'lucide-react';

const WelcomePage = () => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  
  const textSequence = [
    'Aguarde aprovação pela nossa equipe administrativa Fricó Alimentos',
    'Já conhece a inteligência do FR Stock Manager?',
    'Sabia que o FR Stock Manager otimiza seu estoque em tempo real?',
    'Você está prestes a experimentar um novo nível de controle logístico.',
    'Com o FR Stock Manager, cada produto tem seu lugar certo.',
    'Estoque semiautomatizado com decisões inteligentes.',
    'FR Stock Manager: feito para reduzir desperdícios e maximizar eficiência.',
    'Sabia que você pode rastrear cada movimentação de forma precisa?',
    'Um arrasta e solta pode ser o suficiente para reorganizar seu inventário.',
    'Precisa de uma requisição? Faça direto pelo sistema!',
    'O FR Stock Manager avisa para não deixar faltar produtos no estoque.',
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
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-center mb-12"
        >
          {/* Ícone da Fricó fixo no centro */}
          <div className="mx-auto mb-8 flex justify-center">
            <img 
              src="/Uploads/IconeFrico3D.png" 
              alt="Fricó Alimentos Logo" 
              className="w-40 h-40 object-scale-down" 
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-8 font-sans">
            {displayText}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-muted-foreground"
            >
              {isTyping || isDeleting ? "|" : ""}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className="text-muted-foreground text-lg mb-8"
          >
            Aguarde a aprovação ou procure o nosso departamento administrativo.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;