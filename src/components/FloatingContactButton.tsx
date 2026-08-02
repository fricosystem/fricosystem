
import { MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const FloatingContactButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show the button after scrolling down a bit
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact-info');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <Button
      onClick={scrollToContact}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
      size="icon"
      aria-label="Contact Us"
    >
      <MessageSquare className="h-5 w-5 md:h-6 md:w-6" />
    </Button>
  );
};

export default FloatingContactButton;
