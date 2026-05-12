import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "focus-ring inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
          {
            "border-accent bg-accent text-white shadow-soft hover:-translate-y-0.5 hover:bg-[#b04326] hover:shadow-medium": variant === "primary",
            "border-transparent bg-secondary text-text-primary hover:-translate-y-0.5 hover:bg-[#e6dfd7]": variant === "secondary",
            "border-border bg-transparent text-text-primary hover:bg-secondary/70 hover:border-text-secondary/25": variant === "outline",
            "border-transparent bg-transparent text-text-secondary hover:bg-secondary/70 hover:text-text-primary": variant === "ghost",
            "border-red-600 bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "h-10 px-4 text-sm": size === "sm",
            "h-11 px-5 py-2.5": size === "md",
            "h-12 px-6 text-sm sm:px-7": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
