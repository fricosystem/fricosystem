import { Home, BookOpen, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from './ThemeToggle';

export const MainNavigation = () => {
  const location = useLocation();
  
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-6">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="lg" 
                className="gap-2 font-medium"
                data-active={location.pathname === "/"}
              >
                <Home size={18} />
                Home
              </Button>
            </Link>
            <Link to="/beginners-guide">
              <Button 
                variant="ghost" 
                size="lg" 
                className="gap-2 font-medium hover:bg-accent"
                data-active={location.pathname === "/beginners-guide"}
              >
                <BookOpen size={18} />
                Beginners Guide
              </Button>
            </Link>
            <Link to="/community-report">
              <Button 
                variant="ghost" 
                size="lg" 
                className="gap-2 font-medium hover:bg-accent"
                data-active={location.pathname === "/community-report"}
              >
                <BarChart3 size={18} />
                Community Report
              </Button>
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};
