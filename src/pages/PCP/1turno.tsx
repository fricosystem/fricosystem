import React from "react";
import TurnoForm from "@/components/PCP/TurnoForm";

const PrimeiroTurno: React.FC = () => {
  try {
    return <TurnoForm turno="1" titulo="1° Turno" />;
  } catch (error) {
    console.error("Erro no componente PrimeiroTurno:", error);
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-red-600">Erro ao carregar 1° Turno</h2>
        <p className="text-sm text-muted-foreground">Tente recarregar a página</p>
      </div>
    );
  }
};

export default PrimeiroTurno;