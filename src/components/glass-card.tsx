import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-5 transition-all duration-300 hover:border-glacier/30",
        className,
      )}
      {...props}
    />
  );
}