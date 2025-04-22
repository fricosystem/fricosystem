import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

const Funcionarios = () => {
  const { data, isLoading, error } = useFuncionarios();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funcionários</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>Carregando...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4}>Erro ao carregar funcionários.</TableCell>
                </TableRow>
              ) : data && data.length > 0 ? (
                data.map(funcionario => (
                  <TableRow key={funcionario.id}>
                    <TableCell>{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.email}</TableCell>
                    <TableCell>{funcionario.cargo}</TableCell>
                    <TableCell>
                      {funcionario.ativo === "sim" ? (
                        <span className="text-green-600">Ativo</span>
                      ) : (
                        <span className="text-red-600">Inativo</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>Nenhum funcionário encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Funcionarios;
