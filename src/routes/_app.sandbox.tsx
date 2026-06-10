import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TICKERS } from "@/lib/mock";
import { Plus, Trash2, FlaskConical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine,
} from "recharts";

export const Route = createFileRoute("/_app/sandbox")({
  head: () => ({ meta: [{ title: "Scenario Sandbox — SlopeCapital" }] }),
  component: SandboxPage,
});

type Holding = { id: string; symbol: string; weight: number };

const REGION_BETAS: Record<string, number> = {
  Rockies: 0.42,
  Alps: 0.31,
  Andes: 0.27,
};

function SandboxPage() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { id: "h1", symbol: "MTN", weight: 35 },
    { id: "h2", symbol: "ALTM", weight: 25 },
    { id: "h3", symbol: "POOL", weight: 20 },
    { id: "h4", symbol: "AS", weight: 20 },
  ]);
  const [snow, setSnow] = useState([62]);
  const [confidence, setConfidence] = useState([78]);
  const [region, setRegion] = useState("Rockies");

  // Debounce the inputs that feed expensive computations (chart)
  const [debSnow, setDebSnow] = useState(snow[0]);
  const [debConf, setDebConf] = useState(confidence[0]);
  useEffect(() => {
    const t = setTimeout(() => setDebSnow(snow[0]), 250);
    return () => clearTimeout(t);
  }, [snow]);
  useEffect(() => {
    const t = setTimeout(() => setDebConf(confidence[0]), 250);
    return () => clearTimeout(t);
  }, [confidence]);

  const totalWeight = holdings.reduce((s, h) => s + h.weight, 0);

  const waterfall = useMemo(() => {
    const beta = REGION_BETAS[region] ?? 0.3;
    const conf = debConf / 100;
    const snowPressure = (debSnow - 30) / 70; // -ve below 30in, +ve above
    let cum = 100;
    return holdings.map((h) => {
      const tickerInfo = TICKERS.find((t) => t.symbol === h.symbol);
      const sensitivity = (tickerInfo?.institutionalSentiment ?? 60) / 100;
      const delta = +(snowPressure * beta * sensitivity * conf * h.weight * 0.18).toFixed(2);
      const from = cum;
      cum += delta;
      return {
        symbol: h.symbol,
        delta,
        from,
        to: +cum.toFixed(2),
        absDelta: Math.abs(delta),
      };
    });
  }, [holdings, debSnow, debConf, region]);

  const projectedAlpha = useMemo(() => {
    return +waterfall.reduce((s, r) => s + r.delta, 0).toFixed(2);
  }, [waterfall]);

  const finalValue = 100 + projectedAlpha;

  const addHolding = () => {
    const used = new Set(holdings.map((h) => h.symbol));
    const next = TICKERS.find((t) => !used.has(t.symbol)) ?? TICKERS[0];
    setHoldings((h) => [...h, { id: crypto.randomUUID(), symbol: next.symbol, weight: 10 }]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Scenario Engine"
        title="The Scenario Sandbox"
        description="Inject hypothetical snowfall events into a custom portfolio and watch projected alpha unfold in real time."
        actions={<ExportButton label="Export Scenario" />}
      />

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* LEFT PANEL */}
        <div className="space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Portfolio Builder</div>
                <div className="mt-0.5 text-base font-semibold">Holdings · {holdings.length}</div>
              </div>
              <div className={cn(
                "font-mono text-xs px-2 py-1 rounded-md border",
                totalWeight === 100 ? "bg-mint/10 text-mint border-mint/40" : "bg-amber-500/10 text-amber-400 border-amber-500/30",
              )}>{totalWeight}%</div>
            </div>
            <ul className="space-y-2">
              {holdings.map((h) => (
                <li key={h.id} className="flex items-center gap-2 rounded-lg border border-border/40 bg-white/[0.02] p-2">
                  <Select value={h.symbol} onValueChange={(v) => setHoldings((arr) => arr.map((x) => x.id === h.id ? { ...x, symbol: v } : x))}>
                    <SelectTrigger className="flex-1 h-8 bg-transparent border-border/40 font-mono text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{TICKERS.map((t) => <SelectItem key={t.symbol} value={t.symbol}>${t.symbol} — {t.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="relative">
                    <Input
                      type="number"
                      value={h.weight}
                      onChange={(e) => setHoldings((arr) => arr.map((x) => x.id === h.id ? { ...x, weight: Math.max(0, Math.min(100, +e.target.value || 0)) } : x))}
                      className="h-8 w-20 pr-6 font-mono bg-transparent border-border/40 text-right"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-bear" onClick={() => setHoldings((arr) => arr.filter((x) => x.id !== h.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-3 w-full h-9 border-dashed border-glacier/40 text-glacier hover:bg-glacier/10 hover:text-glacier hover:border-glacier" onClick={addHolding}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Ticker
            </Button>
          </GlassCard>

          <GlassCard>
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Weather Injector</div>
              <div className="mt-0.5 text-base font-semibold">Hypothetical event</div>
            </div>

            <div className="space-y-5">
              <SliderField label="Projected Snowfall" value={snow[0]} unit=" in" tone="glacier">
                <Slider value={snow} onValueChange={setSnow} min={0} max={100} step={1} />
              </SliderField>
              <SliderField label="Forecast Confidence" value={confidence[0]} unit="%" tone="mint">
                <Slider value={confidence} onValueChange={setConfidence} min={0} max={100} step={1} />
              </SliderField>

              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
                  <span>Region</span>
                </div>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="bg-white/[0.02] border-border/40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(REGION_BETAS).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* MAIN STAGE */}
        <div className="space-y-6">
          <GlassCard className="relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-glacier/10 blur-3xl pointer-events-none" />
            <div className="relative flex items-center gap-6">
              <div className="relative shrink-0 h-16 w-16 rounded-2xl border border-glacier/40 bg-glacier/10 flex items-center justify-center">
                <FlaskConical className="h-7 w-7 text-glacier" />
              </div>
              <div className="flex-1 grid grid-cols-3 gap-6">
                <BigStat label="Projected Alpha" value={`${projectedAlpha >= 0 ? "+" : ""}${projectedAlpha}%`} tone={projectedAlpha >= 0 ? "mint" : "bear"} />
                <BigStat label="Portfolio Value" value={`$${finalValue.toFixed(2)}`} sub="per $100 baseline" />
                <BigStat label="Confidence-adj." value={`${(projectedAlpha * (debConf / 100)).toFixed(2)}%`} sub={`σ ${(debConf / 100 * 1.8).toFixed(2)}`} />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Waterfall</div>
                <div className="mt-1 text-lg font-semibold">Portfolio impact attribution</div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-glacier" /> Live re-compute
              </div>
            </div>
            <WaterfallChart rows={waterfall} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, unit, tone, children }: { label: string; value: number; unit: string; tone: "glacier" | "mint"; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
        <span>{label}</span>
        <span className={cn("font-mono text-sm tracking-normal", tone === "mint" ? "text-mint" : "text-glacier")}>
          {value}{unit}
        </span>
      </div>
      {children}
    </div>
  );
}

function BigStat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "mint" | "bear" }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-2xl lg:text-3xl font-semibold tracking-tight", tone === "mint" && "text-mint", tone === "bear" && "text-bear")}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground/80 mt-0.5">{sub}</div>}
    </div>
  );
}

const WaterfallChart = memo(function WaterfallChart({ rows }: { rows: { symbol: string; delta: number; from: number; to: number }[] }) {
  // Recharts "stacked invisible base + visible delta" pattern
  const data = rows.map((r) => ({
    symbol: r.symbol,
    base: Math.min(r.from, r.to),
    delta: Math.abs(r.delta),
    raw: r.delta,
  }));
  return (
    <div className="h-80 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="oklch(0.32 0.03 260 / 25%)" vertical={false} />
          <XAxis dataKey="symbol" stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(s) => `$${s}`} />
          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} width={40} domain={[90, 110]} />
          <ReferenceLine y={100} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{ background: "#111827", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
            formatter={(_v, _k, p: any) => [`${p.payload.raw >= 0 ? "+" : ""}${p.payload.raw}%`, "Δ"]}
          />
          <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="delta" stackId="w" isAnimationActive={false} radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.raw >= 0 ? "var(--mint)" : "var(--bear)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});