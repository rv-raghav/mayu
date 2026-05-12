import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Dot } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  hint?: string;
  trend?: string;
  tone?: "accent" | "success" | "neutral";
  live?: boolean;
  className?: string;
}

const toneClasses = {
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  neutral: "bg-secondary text-text-secondary",
};

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  tone = "accent",
  live = false,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className={cn("h-full p-6 sm:p-7", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", toneClasses[tone])}>
            {icon}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-text-secondary">
            {live ? (
              <span className="inline-flex items-center gap-1.5 text-accent">
                <span className="realtime-pulse inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
                Live
              </span>
            ) : null}
            {trend ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-text-primary">
                <ArrowUpRight className="h-3 w-3" />
                {trend}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-secondary">{label}</p>
          <div className="flex items-end justify-between gap-3">
            <p className="font-serif text-4xl leading-none text-text-primary">{value}</p>
            {hint ? (
              <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
                <Dot className="-mx-1 h-4 w-4" />
                {hint}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
