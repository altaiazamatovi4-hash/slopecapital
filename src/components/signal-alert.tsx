import { AlertTriangle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { PredictionResult } from "@/hooks/use-predictive-engine";

export function SignalAlert({ prediction }: { prediction?: PredictionResult | null }) {
  if (!prediction) return null;

  const isBullish = prediction.hasSignal;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-2",
        isBullish
          ? "border-mint/50 bg-mint/5 shadow-[0_0_40px_-15px_rgba(52,211,153,0.3)]"
          : "border-border/60 bg-white/[0.02]"
      )}
    >
      {/* Background glow fx */}
      {isBullish && (
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-mint/20 blur-3xl" />
      )}

      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
            isBullish
              ? "border-mint/30 bg-mint/10 text-mint"
              : "border-border/60 bg-white/[0.05] text-muted-foreground"
          )}
        >
          {isBullish ? <BrainCircuit className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3
              className={cn(
                "font-mono text-sm font-bold uppercase tracking-wider",
                isBullish ? "text-mint" : "text-muted-foreground"
              )}
            >
              {prediction.signal}
            </h3>
            {isBullish && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mint/20 bg-mint/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-mint backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint"></span>
                </span>
                CONFIDENCE: {prediction.confidenceScore}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {prediction.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}