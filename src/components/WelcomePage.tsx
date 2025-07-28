import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Box, Square } from 'lucide-react';

const WelcomePage = () => {
  const [showGame, setShowGame] = useState(false);
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
    <div className="min-h-screen bg-black relative overflow-hidden">
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
          <Box className="w-full h-full text-gray-400" />
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
        <Box className="w-8 h-8 text-gray-500 opacity-70" />
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
        <Box className="w-6 h-6 text-gray-400 opacity-70" />
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
        <Box className="w-7 h-7 text-gray-600 opacity-70" />
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
              className="w-28 h-28 object-scale-down" 
            />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 font-sans">
            {displayText}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-gray-400"
            >
              {isTyping || isDeleting ? "|" : ""}
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className="text-gray-400 text-lg mb-8"
          >
            Enquanto isso, que tal um jogo de Tetris?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4, duration: 0.5 }}
          >
            <Button
              onClick={() => setShowGame(!showGame)}
              className="bg-white text-black hover:bg-gray-200 font-medium px-8 py-3 text-lg transition-all duration-200 transform hover:scale-105"
            >
              {showGame ? 'Ocultar Tetris' : 'Jogar Tetris'}
            </Button>
          </motion.div>
        </motion.div>

        {/* Game container */}
        {showGame && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <TetrisGame />
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Tetris Game Component (remain the same as before)
const TetrisGame = () => {
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;
  const EMPTY_CELL = 0;

  const [board, setBoard] = useState(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);

  // Tetris pieces (Tetrominoes)
  const pieces = [
    // I-piece
    [
      [1, 1, 1, 1]
    ],
    // O-piece
    [
      [1, 1],
      [1, 1]
    ],
    // T-piece
    [
      [0, 1, 0],
      [1, 1, 1]
    ],
    // S-piece
    [
      [0, 1, 1],
      [1, 1, 0]
    ],
    // Z-piece
    [
      [1, 1, 0],
      [0, 1, 1]
    ],
    // J-piece
    [
      [1, 0, 0],
      [1, 1, 1]
    ],
    // L-piece
    [
      [0, 0, 1],
      [1, 1, 1]
    ]
  ];

  const getRandomPiece = () => {
    const pieceIndex = Math.floor(Math.random() * pieces.length);
    return {
      shape: pieces[pieceIndex],
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(pieces[pieceIndex][0].length / 2),
      y: 0,
      color: pieceIndex + 1
    };
  };

  const isValidMove = (piece, newX, newY, newShape = piece.shape) => {
    for (let y = 0; y < newShape.length; y++) {
      for (let x = 0; x < newShape[y].length; x++) {
        if (newShape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;

          if (
            boardX < 0 ||
            boardX >= BOARD_WIDTH ||
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && board[boardY][boardX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const rotatePiece = (shape) => {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        rotated[x][rows - 1 - y] = shape[y][x];
      }
    }
    return rotated;
  };

  const placePiece = () => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = currentPiece.y + y;
          const boardX = currentPiece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }

    setBoard(newBoard);
    checkLines(newBoard);
    setCurrentPiece(getRandomPiece());
  };

  const checkLines = (currentBoard) => {
    let linesCleared = 0;
    const newBoard = [];

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (currentBoard[y].every(cell => cell !== EMPTY_CELL)) {
        linesCleared++;
      } else {
        newBoard.unshift(currentBoard[y]);
      }
    }

    // Add empty lines at the top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
    }

    if (linesCleared > 0) {
      setBoard(newBoard);
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + linesCleared * 100 * level);
      setLevel(Math.floor((lines + linesCleared) / 10) + 1);
    }
  };

  const moveDown = useCallback(() => {
    if (!currentPiece || !gameActive) return;

    if (isValidMove(currentPiece, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      placePiece();
    }
  }, [currentPiece, gameActive, board]);

  const handleKeyPress = useCallback((event) => {
    if (!currentPiece || !gameActive) return;

    switch (event.key) {
      case 'ArrowLeft':
        if (isValidMove(currentPiece, currentPiece.x - 1, currentPiece.y)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x - 1 }));
        }
        break;
      case 'ArrowRight':
        if (isValidMove(currentPiece, currentPiece.x + 1, currentPiece.y)) {
          setCurrentPiece(prev => ({ ...prev, x: prev.x + 1 }));
        }
        break;
      case 'ArrowDown':
        moveDown();
        break;
      case 'ArrowUp':
        const rotated = rotatePiece(currentPiece.shape);
        if (isValidMove(currentPiece, currentPiece.x, currentPiece.y, rotated)) {
          setCurrentPiece(prev => ({ ...prev, shape: rotated }));
        }
        break;
    }
  }, [currentPiece, gameActive, moveDown]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(moveDown, Math.max(100, 1000 - (level - 1) * 100));
    return () => clearInterval(interval);
  }, [gameActive, level, moveDown]);

  const startGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL)));
    setCurrentPiece(getRandomPiece());
    setGameActive(true);
    setScore(0);
    setLevel(1);
    setLines(0);
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    // Add current piece to display board
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard;
  };

  const getCellColor = (value) => {
    const colors = [
      'bg-gray-800', // empty
      'bg-cyan-400', // I
      'bg-yellow-400', // O
      'bg-purple-400', // T
      'bg-green-400', // S
      'bg-red-400', // Z
      'bg-blue-400', // J
      'bg-orange-400' // L
    ];
    return colors[value] || 'bg-gray-800';
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-xl font-bold">Tetris</h3>
        <div className="flex gap-4 text-white text-sm">
          <span>Pontos: {score}</span>
          <span>Nível: {level}</span>
          <span>Linhas: {lines}</span>
        </div>
      </div>

      {!gameActive ? (
        <div className="text-center py-8">
          <Button
            onClick={startGame}
            className="bg-white text-black hover:bg-gray-200"
          >
            Iniciar Jogo
          </Button>
          <p className="text-gray-400 text-sm mt-4">
            Use as setas para mover e girar as peças
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="grid grid-cols-10 gap-px bg-gray-700 p-2 rounded">
            {renderBoard().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 ${getCellColor(cell)} border border-gray-600`}
                />
              ))
            )}
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        <Button
          onClick={() => setGameActive(false)}
          variant="outline"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          Parar Jogo
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;