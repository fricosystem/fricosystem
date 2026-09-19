import { useEffect } from "react";

export function useBlockBackNavigation() {
  useEffect(() => {
    // Push a new state to prevent going back
    window.history.pushState(null, "", window.location.href);
    
    const handlePopState = (event: PopStateEvent) => {
      // Prevent navigation by pushing state again
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
