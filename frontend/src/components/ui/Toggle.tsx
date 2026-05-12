import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, label, description, className, disabled, ...props }, ref) => {
    return (
      <label className="flex items-start gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          ref={ref}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            "focus-ring relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-accent" : "bg-border/90",
            className
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        {(label || description) && (
          <span className="space-y-1">
            {label && <span className="block text-sm font-medium text-text-primary">{label}</span>}
            {description && <span className="block text-sm leading-6 text-text-secondary">{description}</span>}
          </span>
        )}
      </label>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
