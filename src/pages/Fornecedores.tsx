import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebade/firebase";
import { AppLayout } from "@/components/AppLayout";

interface Fornecedor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
}

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState<Omit<Fornecedor, "id">>({
    nome: "",
    email: "",
    telefone: "",
    cnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const fetchFornecedores = async () => {
    const querySnapshot = await getDocs(collection(db, "fornecedores"));
    const lista: Fornecedor[] = [];
    querySnapshot.forEach((doc) => {
      lista.push({ id: doc.id, ...doc.data() } as Fornecedor);
    });
    setFornecedores(lista);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "fornecedores"), form);
      setForm({
        nome: "",
        email: "",
        telefone: "",
        cnpj: "",
        endereco: "",
        cidade: "",
        estado: "",
      });
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-primary">Cadastro de Fornecedores</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-xl shadow">
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome da Empresa"
            required
            className="input input-bordered w-full"
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="input input-bordered w-full"
          />
          <input
            type="text"
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            placeholder="Telefone"
            required
            className="input input-bordered w-full"
          />
          <input
            type="text"
            name="cnpj"
            value={form.cnpj}
            onChange={handleChange}
            placeholder="CNPJ"
            required
            className="input input-bordered w-full"
          />
          <input
            type="text"
            name="endereco"
            value={form.endereco}
            onChange={handleChange}
            placeholder="Endereço"
            required
            className="input input-bordered w-full"
          />
          <input
            type="text"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            placeholder="Cidade"
            required
            className="input input-bordered w-full"
          />
          <input
            type="text"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            placeholder="Estado"
            required
            className="input input-bordered w-full"
          />

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="btn btn-primary">Cadastrar Fornecedor</button>
          </div>
        </form>

        <h2 className="text-xl font-semibold mt-10 mb-4 text-primary">Fornecedores Cadastrados</h2>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-primary text-white">
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CNPJ</th>
                <th>Cidade</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id} className="hover:bg-gray-100">
                  <td>{fornecedor.nome}</td>
                  <td>{fornecedor.email}</td>
                  <td>{fornecedor.telefone}</td>
                  <td>{fornecedor.cnpj}</td>
                  <td>{fornecedor.cidade}</td>
                  <td>{fornecedor.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}