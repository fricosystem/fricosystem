
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({
  children
}: AuthLayoutProps) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4" 
      style={{ 
        backgroundImage: `url('/lovable-uploads/9556e8ba-3eae-423e-9275-c8a58e182a55.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex flex-col items-center">
            <img src="/lovable-uploads/8c700a7c-8b6b-44bd-ba7c-d2a31d435fb1.png" alt="Fricó Alimentos Logo" className="h-24 w-auto mb-2 rounded-lg shadow-lg" />
          </div>
        </div>
        <div className="backdrop-blur-sm bg-white/40 dark:bg-black/50 rounded-lg shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
