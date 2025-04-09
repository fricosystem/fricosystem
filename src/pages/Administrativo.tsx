
import React, { useState, useEffect } from "react";
import AppLayout from "@/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema para validação do formulário
const formSchema = z.object({
  nome: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres",
  }),
  email: z.string().email({
    message: "Email inválido",
  }),
  cargo: z.string().min(1, {
    message: "Cargo é obrigatório",
  }),
  perfil: z.string().min(1, {
    message: "Perfil é obrigatório",
  }),
});

// Verificação se o usuário atual tem permissão para acessar esta página
const Administrativo = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      nome: "Bruno Martins",
      email: "bruno.bm3051@gmail.com",
      cargo: "Administrador",
      perfil: "Admin",
      status: "Ativo",
      ultimoAcesso: "12/04/2023 às 14:30",
    },
    {
      id: 2,
      nome: "João Silva",
      email: "joao.silva@frico.com.br",
      cargo: "Estoquista",
      perfil: "Padrão",
      status: "Ativo",
      ultimoAcesso: "10/04/2023 às 09:15",
    },
    {
      id: 3,
      nome: "Maria Santos",
      email: "maria.santos@frico.com.br",
      cargo: "Vendedora",
      perfil: "Padrão",
      status: "Inativo",
      ultimoAcesso: "05/04/2023 às 16:22",
    },
  ]);

  const [logEntries, setLogEntries] = useState([
    {
      id: 1,
      usuario: "Bruno Martins",
      acao: "Login no sistema",
      data: "12/04/2023 14:30:22",
    },
    {
      id: 2,
      usuario: "Bruno Martins",
      acao: "Alteração de produto #1245",
      data: "12/04/2023 14:45:10",
    },
    {
      id: 3,
      usuario: "João Silva",
      acao: "Adição de estoque de produto #789",
      data: "10/04/2023 09:30:45",
    },
    {
      id: 4,
      usuario: "Maria Santos",
      acao: "Emissão de nota fiscal #45678",
      data: "05/04/2023 16:15:05",
    },
    {
      id: 5,
      usuario: "Bruno Martins",
      acao: "Cadastro de novo produto #2001",
      data: "11/04/2023 10:22:18",
    },
  ]);

  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Verificando se o usuário atual tem permissão
  useEffect(() => {
    const userJson = localStorage.getItem("fricoUser");
    if (userJson) {
      const user = JSON.parse(userJson);
      setCurrentUser(user);
      
      // Apenas o usuário com email bruno.bm3051@gmail.com tem acesso
      if (user.email === "bruno.bm3051@gmail.com") {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      cargo: "",
      perfil: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Adiciona o novo usuário
    const newUser = {
      id: users.length + 1,
      nome: values.nome,
      email: values.email,
      cargo: values.cargo,
      perfil: values.perfil,
      status: "Ativo",
      ultimoAcesso: "Nunca acessou",
    };

    setUsers([...users, newUser]);

    // Adiciona um log
    const newLog = {
      id: logEntries.length + 1,
      usuario: currentUser?.email || "Sistema",
      acao: `Cadastro de novo usuário: ${values.nome}`,
      data: new Date().toLocaleString("pt-BR"),
    };

    setLogEntries([newLog, ...logEntries]);

    toast({
      title: "Usuário cadastrado",
      description: "O usuário foi cadastrado com sucesso!",
    });

    form.reset();
  };

  if (!isAuthorized) {
    return (
      <AppLayout title="Acesso Negado">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Entre em contato com o administrador para obter acesso.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Administrativo">
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Gestão de Usuários</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Adicionar Usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para cadastrar um novo usuário no sistema.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cargo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input placeholder="Cargo na empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perfil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfil</FormLabel>
                          <FormControl>
                            <Input placeholder="Perfil de acesso" {...field} />
                          </FormControl>
                          <FormDescription>
                            Ex: Admin, Padrão, Visualizador
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Cadastrar</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.cargo}</TableCell>
                      <TableCell>{user.perfil}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "Ativo" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.ultimoAcesso}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm">
                          Desativar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Histórico de atividades realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logEntries.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.usuario}</TableCell>
                      <TableCell>{log.acao}</TableCell>
                      <TableCell>{log.data}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Exportar Logs</Button>
              <Button variant="ghost" size="sm">
                Limpar Filtros
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Administrativo;
