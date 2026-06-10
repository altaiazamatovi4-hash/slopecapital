import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { sparkSeries } from "@/lib/mock";

type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  positive?: boolean;
  caption?: string;
  sparkSeed?: number;
  tone?: "glacier" | "mint" | "amber";
};

export function KpiCard({ label, value, unit, delta, positive = true, caption, sparkSeed = 1, tone = "glacier" }: Props) {
  const data = sparkSeries(sparkSeed);
  const stroke = tone === "mint" ? "var(--mint)" : tone === "amber" ? "var(--amber)" : "var(--glacier)";
  const gradId = `spark-${label.replace(/\s/g, "")}`;
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="font-mono text-sm text-muted-foreground">{unit}</span>}
      </div>
      {delta && (
        <div className={cn("mt-1 font-mono text-xs", positive ? "text-mint" : "text-bear")}>{delta}</div>
      )}
      {caption && <div className="mt-2 text-xs text-muted-foreground/80">{caption}</div>}
      <div className="absolute inset-x-0 bottom-0 h-12 opacity-70 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.55} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.5} fill={`url(#${gradId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}