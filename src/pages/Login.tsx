
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import AuthLayout from "@/layouts/AuthLayout";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulando autenticação (em produção isso seria uma chamada real de API)
    setTimeout(() => {
      // Credenciais válidas para login
      if ((formData.email === "admin@frico.com" && formData.senha === "admin") ||
          (formData.email === "bruno.bm3051@gmail.com" && formData.senha === "portal@159")) {
        toast({
          title: "Login bem-sucedido",
          description: "Bem-vindo ao sistema Fricó Alimentos ADM!",
        });
        // Guardar informações de login (em produção seria um token JWT)
        localStorage.setItem("fricoUser", JSON.stringify({ 
          role: "admin", 
          name: formData.email === "bruno.bm3051@gmail.com" ? "Bruno" : "Administrador" 
        }));
        navigate("/dashboard");
      } else {
        toast({
          title: "Falha no login",
          description: "Email ou senha inválidos. Tente novamente.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 1500);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AuthLayout>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  placeholder="seu@email.com"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs text-muted-foreground"
                  onClick={() => toast({
                    title: "Recuperação de senha",
                    description: "Entre em contato com o administrador do sistema",
                  })}
                >
                  Esqueceu a senha?
                </Button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  name="senha"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="pl-10"
                  value={formData.senha}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1"
                  onClick={toggleShowPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ocultar senha" : "Mostrar senha"}
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="text-center mt-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Fricó Alimentos - Todos os direitos reservados
      </div>
    </AuthLayout>
  );
};

export default Login;
