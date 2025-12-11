import { ButtonHTMLAttributes, forwardRef } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "transparent";
  showArrow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "filled", showArrow = true, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center gap-2 rounded-full uppercase font-bold transition-all duration-200";
    
    const variants = {
      filled: "btn-filled",
      transparent: "btn-transparent",
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        ref={ref}
        {...props}
      >
        {children}
        {showArrow && <ArrowRight className="w-4 h-4" />}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
