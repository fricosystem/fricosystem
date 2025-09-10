import React from "react";
import TurnoForm from "@/components/PCP/TurnoForm";

const SegundoTurno: React.FC = () => {
  try {
    return <TurnoForm turno="2" titulo="2° Turno" />;
  } catch (error) {
    console.error("Erro no componente SegundoTurno:", error);
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-red-600">Erro ao carregar 2° Turno</h2>
        <p className="text-sm text-muted-foreground">Tente recarregar a página</p>
      </div>
    );
  }
};

export default SegundoTurno;