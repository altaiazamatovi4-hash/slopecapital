import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { ExportButton } from "@/components/export-button";
import { FEED, PRIMARY_SERIES } from "@/lib/mock";
import { Newspaper, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_app/sentiment")({
  head: () => ({ meta: [{ title: "Sentiment Engine — SlopeCapital" }] }),
  component: SentimentPage,
});

const GAUGE_VAL = 72; // 0-100

function SentimentPage() {
  const sentSeries = PRIMARY_SERIES.slice(-40);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Sentiment Engine"
        title="Investor Powder Sentiment"
        description="Weather-conditioned sentiment scoring across the ski-exposed equity universe — blending forecast ensembles, news flow, and option-skew signals."
        actions={<ExportButton label="Export Sentiment Report" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Current reading</div>
          <Gauge value={GAUGE_VAL} />
          <div className="mt-2 font-mono text-5xl font-semibold tracking-tight">{GAUGE_VAL}</div>
          <div className="mt-1 text-sm text-mint font-medium">Strong Bullish · Powder Euphoria</div>
          <div className="mt-4 grid grid-cols-3 gap-2 w-full text-[10px]">
            {["Saturated", "Bearish", "Neutral", "Bullish", "Euphoria"].slice(0, 3).map((l) => (
              <div key={l} className="rounded-md border border-border/40 py-1 text-muted-foreground">{l}</div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Updated 14m ago · n=2,418 signals</div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/40">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sentiment Curve</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">Trailing 40 weeks · sector aggregate</div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded-full bg-mint/15 text-mint border border-mint/40">+12.4σ MoM</span>
            </div>
          </div>
          <div className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentSeries}>
                <defs>
                  <linearGradient id="sentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(2, 7)} minTickGap={32} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} width={32} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="sentiment" stroke="var(--mint)" strokeWidth={2} fill="url(#sentArea)" isAnimationActive={false} dot={false} activeDot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-glacier" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Forecast News Aggregator</div>
              <div className="mt-0.5 text-lg font-semibold tracking-tight">Signals shaping sentiment now</div>
            </div>
          </div>
          <ExportButton label="Export Feed" />
        </div>
        <ul className="divide-y divide-border/40">
          {FEED.map((item) => {
            const bull = item.sentiment === "Bullish";
            return (
              <li key={item.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "shrink-0 mt-1 h-9 w-9 rounded-lg flex items-center justify-center border",
                    bull ? "bg-mint/10 border-mint/40 text-mint" : item.sentiment === "Bearish" ? "bg-bear/10 border-bear/40 text-bear" : "bg-white/5 border-border text-muted-foreground"
                  )}>
                    {bull ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <span className="font-mono text-foreground/80">{item.source}</span>
                      <span>·</span><span>{item.region}</span>
                      <span>·</span><span>{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{item.headline}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <Tag tone={bull ? "mint" : item.sentiment === "Bearish" ? "bear" : "muted"}>{item.sentiment}</Tag>
                      <Tag tone="glacier">Impact: {item.impact}</Tag>
                      <Tag tone={item.sentimentImpact >= 0 ? "mint" : "bear"}>
                        Sentiment Impact: {item.sentimentImpact >= 0 ? "+" : ""}{item.sentimentImpact}%
                      </Tag>
                      {item.tickers.map((t) => (
                        <span key={t} className="font-mono px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">${t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </div>
  );
}

function Tag({ tone, children }: { tone: "mint" | "bear" | "glacier" | "muted"; children: React.ReactNode }) {
  const map = {
    mint: "bg-mint/10 text-mint border-mint/40",
    bear: "bg-bear/10 text-bear border-bear/40",
    glacier: "bg-glacier/10 text-glacier border-glacier/40",
    muted: "bg-white/5 text-muted-foreground border-border",
  };
  return <span className={cn("font-mono px-1.5 py-0.5 rounded border", map[tone])}>{children}</span>;
}

function Gauge({ value }: { value: number }) {
  // semi-circle 180° arc
  const r = 88;
  const cx = 110;
  const cy = 100;
  const angle = Math.PI * (1 - value / 100);
  const x = cx + r * Math.cos(angle);
  const y = cy - r * Math.sin(angle);
  return (
    <svg viewBox="0 0 220 120" className="w-full max-w-[280px] mt-4">
      <defs>
        <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.65 0.2 25)" />
          <stop offset="50%" stopColor="var(--glacier)" />
          <stop offset="100%" stopColor="var(--mint)" />
        </linearGradient>
      </defs>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="oklch(0.3 0.03 260 / 50%)" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`} stroke="url(#gauge)" strokeWidth={14} fill="none" strokeLinecap="round" />
      <circle cx={x} cy={y} r={7} fill="var(--background)" stroke="var(--mint)" strokeWidth={2.5} />
    </svg>
  );
}