import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "xl";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-accent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
          "h-8 w-8": size === "lg",
          "h-12 w-12": size === "xl",
        },
        className
      )}
      {...props}
    />
  );
}
