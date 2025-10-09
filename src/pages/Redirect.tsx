
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const Redirect = () => {
  useEffect(() => {
    // Set this to your Lovable URL
    const lovableUrl = "https://be2b6496-4d2c-45db-818f-6fb03f2dfd6e.lovableproject.com";
    
    // Disable caching for this page
    document.querySelector('meta[http-equiv="Cache-Control"]') || 
      document.head.appendChild(
        Object.assign(document.createElement('meta'), {
          httpEquiv: 'Cache-Control',
          content: 'no-store, no-cache, must-revalidate, max-age=0'
        })
      );
    
    // Auto redirect after 5 seconds
    const redirectTimer = setTimeout(() => {
      window.location.href = `${lovableUrl}?t=${new Date().getTime()}`;
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, []);

  const handleManualRedirect = () => {
    // Set this to your Lovable URL with cache-busting parameter
    window.location.href = `https://be2b6496-4d2c-45db-818f-6fb03f2dfd6e.lovableproject.com?t=${new Date().getTime()}`;
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
      <img 
        src={`/lovable-uploads/b75b628b-2cba-4748-8f80-792a5ae8ee1d.png?v=${new Date().getTime()}`} 
        alt="Rest Recovery Wellness" 
        className="h-24 w-24 object-contain mb-6"
      />
      <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center">
        Rest Recovery Wellness
      </h1>
      <p className="text-xl mb-8 text-center max-w-md">
        Our website has moved! You will be redirected in 5 seconds...
      </p>
      <Button 
        onClick={handleManualRedirect}
        className="bg-white text-black hover:bg-white/90 py-6 px-8 rounded-full text-lg"
      >
        Go to new website now
      </Button>
    </div>
  );
};

export default Redirect;
