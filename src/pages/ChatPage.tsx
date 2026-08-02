import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Login from "@/pages/Login";
import Chat from "@/components/ChatComponent";

const ChatPage = () => {
  const { user } = useAuth();
  
  return (
    <ThemeProvider>
      <div className="h-screen w-full overflow-hidden">
        {user ? <Chat /> : <Login />}
      </div>
    </ThemeProvider>
  );
};

export default ChatPage;