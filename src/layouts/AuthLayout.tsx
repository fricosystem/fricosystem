
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({
  children
}: AuthLayoutProps) => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center p-4 sm:p-6 md:p-8" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url('/Uploads/9556e8ba-3eae-423e-9275-c8a58e182a55.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              src="/Uploads/IconeFrico3D.png" 
              alt="Fricó Alimentos Logo" 
              className="h-24 w-auto mb-2 rounded-lg shadow-xl" 
            />
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-semibold text-white drop-shadow-md"
            >
              Sistema de Gestão de Estoque
            </motion.h1>
          </div>
        </div>
        <div className="backdrop-blur-sm rounded-lg shadow-2xl">
          {children}
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-white/80 text-sm mt-6"
        >
          © 2025 Fricó Alimentos - Todos os direitos reservados
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
