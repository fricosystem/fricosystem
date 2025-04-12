import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    // Otherwise, redirect to login page
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }, [navigate, user]);

  return null;
};

export default Index;
