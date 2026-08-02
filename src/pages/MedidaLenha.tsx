import { useState } from "react";
import TabelaRegistros from "@/components/Lenha/TabelaRegistros";
import { useAuth } from "@/contexts/AuthContext";
import ModalMedidaLenha from "@/components/Lenha/ModalMedidaLenha";
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
    </AppLayout>
  );
};

export default MedidaLenha;