import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            "focus-ring flex min-h-[120px] w-full rounded-xl border bg-white/75 px-4 py-3 text-sm text-text-primary transition-colors placeholder:text-text-secondary/45 disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea";

export { Textarea };
