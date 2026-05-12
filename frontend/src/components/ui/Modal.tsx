import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-dark/36 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 12, filter: "blur(10px)" }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className={cn(
              "surface-card relative z-10 w-full max-w-xl overflow-hidden rounded-[24px] border border-[rgba(26,23,20,0.08)] p-6 shadow-large sm:p-8",
              className
            )}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                {title && <h3 className="font-serif text-2xl font-medium leading-6 text-text-primary">{title}</h3>}
                {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="focus-ring rounded-full p-2 text-text-secondary transition-colors hover:bg-secondary/70 hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
