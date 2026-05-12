import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "outline"
    | "active"
    | "published"
    | "expired"
    | "draft";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
        {
          "border-transparent bg-secondary text-text-primary": variant === "default",
          "border-success/15 bg-success/10 text-success": variant === "success" || variant === "published",
          "border-[rgba(156,116,77,0.18)] bg-[rgba(156,116,77,0.1)] text-[#8d6242]":
            variant === "warning" || variant === "expired",
          "border-red-200 bg-red-50 text-red-700": variant === "danger",
          "border-border bg-transparent text-text-secondary": variant === "outline" || variant === "draft",
          "border-accent/15 bg-accent/10 text-accent": variant === "active",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
