import { cn } from "@/lib/utils";

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-xl", className)}>
      {/* Loading animation inside the chart */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end gap-1.5 h-16 opacity-50">
          <div className="w-3 rounded-t-sm bg-glacier animate-pulse" style={{ height: "40%", animationDelay: "0ms" }} />
          <div className="w-3 rounded-t-sm bg-glacier animate-pulse" style={{ height: "70%", animationDelay: "150ms" }} />
          <div className="w-3 rounded-t-sm bg-glacier animate-pulse" style={{ height: "50%", animationDelay: "300ms" }} />
          <div className="w-3 rounded-t-sm bg-glacier animate-pulse" style={{ height: "90%", animationDelay: "450ms" }} />
          <div className="w-3 rounded-t-sm bg-glacier animate-pulse" style={{ height: "60%", animationDelay: "600ms" }} />
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground animate-pulse">Syncing APIs...</div>
      </div>
    </div>
  );
}
