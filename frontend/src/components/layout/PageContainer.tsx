import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "reading" | "wide" | "full";
}

const sizeClasses: Record<NonNullable<PageContainerProps["size"]>, string> = {
  default: "max-w-[1280px]",
  reading: "max-w-[860px]",
  wide: "max-w-[1440px]",
  full: "max-w-none",
};

export function PageContainer({
  className,
  children,
  size = "default",
  ...props
}: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-6 lg:px-8", sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
}
