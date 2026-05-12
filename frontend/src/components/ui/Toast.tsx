import { useToastStore, Toast as ToastType } from '@/store/toastStore';
import { cn } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex w-auto max-w-sm flex-col gap-3 sm:inset-x-auto sm:right-4 sm:top-auto sm:bottom-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-accent" />,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 8, filter: "blur(8px)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "surface-card pointer-events-auto flex w-full items-center gap-3 rounded-[18px] border p-4 shadow-medium",
        {
          "border-success/20": toast.type === 'success',
          "border-red-200": toast.type === 'error',
          "border-border": toast.type === 'info',
        }
      )}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="flex-1 text-sm font-medium text-text-primary">{toast.message}</p>
      <button
        onClick={onClose}
        className="focus-ring ml-auto shrink-0 rounded-full p-1 text-text-secondary transition-colors hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
