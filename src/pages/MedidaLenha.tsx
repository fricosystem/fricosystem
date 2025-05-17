import { useState } from "react";
import TabelaRegistros from "@/components/Lenha/TabelaRegistros";
import { useAuth } from "@/contexts/AuthContext";
import ModalMedidaLenha from "@/components/Lenha/ModalMedidaLenha";
import ModalFornecedor from "@/components/Lenha/ModalFornecedor";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import AppLayout from "@/layouts/AppLayout";

const MedidaLenha = () => {
  const [atualizarDados, setAtualizarDados] = useState(false);
  const [modalMedidaAberto, setModalMedidaAberto] = useState(false);
  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);
  const { userData } = useAuth();

  const handleSaveSuccess = () => {
    // Força uma atualização da tabela
    setAtualizarDados(prev => !prev);
  };

  return (
    <AppLayout title="Cálculo de cubagem de Lenha">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Histórico de Registros</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setModalFornecedorAberto(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>
      
      <TabelaRegistros 
        onClickNovo={() => setModalMedidaAberto(true)} 
        atualizarDados={atualizarDados}
      />
    
      {/* Modais */}
      <ModalMedidaLenha 
        isOpen={modalMedidaAberto}
        onClose={() => setModalMedidaAberto(false)}
        onSaveSuccess={handleSaveSuccess}
      />
      
      <ModalFornecedor 
        isOpen={modalFornecedorAberto}
        onClose={() => setModalFornecedorAberto(false)}
        onSaveSuccess={handleSaveSuccess}
      />
    </AppLayout>
  );
};

export default MedidaLenha;