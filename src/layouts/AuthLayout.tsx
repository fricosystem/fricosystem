
import { ReactNode } from "react";
interface AuthLayoutProps {
  children: ReactNode;
}
const AuthLayout = ({
  children
}: AuthLayoutProps) => {
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center">
            <img src="/lovable-uploads/8c700a7c-8b6b-44bd-ba7c-d2a31d435fb1.png" alt="Fricó Alimentos Logo" className="h-24 w-auto mb-2 rounded-lg border-2 border-white" />
            <h1 className="text-2xl font-bold text-center">
              Fricó Alimentos <span className="text-primary">ADM</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Sistema de Gestão de Estoque
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>;
};
export default AuthLayout;
