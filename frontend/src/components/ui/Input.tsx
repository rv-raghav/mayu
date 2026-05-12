import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "focus-ring flex h-12 w-full rounded-xl border bg-white/75 px-4 py-3 text-sm text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary/45 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-400 bg-red-50/60" : "border-[rgba(26,23,20,0.08)] hover:border-[rgba(26,23,20,0.16)] focus-visible:border-accent/40",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
