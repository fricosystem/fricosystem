
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para a página de login
    navigate("/");
  }, [navigate]);

  return null;
};

export default Index;
