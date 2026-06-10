import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { SignalAlert } from "@/components/signal-alert";
import { KpiCard } from "@/components/kpi-card";
import { GlassCard } from "@/components/glass-card";
import { ExportButton } from "@/components/export-button";
import { TICKERS } from "@/lib/mock";
import { ArrowUpRight, ArrowDownRight, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePredictiveEngine } from "@/hooks/use-predictive-engine";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartSkeleton } from "@/components/skeleton-card";
import type { WeatherData } from "@/lib/api/weather-api";
import type { StockData } from "@/lib/api/finance-api";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard — SlopeCapital" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [ticker, setTicker] = useState("MTN");
  const { prediction, stock, weather, isLoading } = usePredictiveEngine(ticker);

  // Build chart data from LIVE weather data
  const forecastChartData = useMemo(() => {
    if (!weather) return null;
    return weather.forecastArray.map((v, i) => ({ day: `D+${i + 1}`, snowfall: v }));
  }, [weather]);

  // Build a combined sentiment chart from weather + stock data
  const sentimentChartData = useMemo(() => {
    if (!weather || !stock) return null;
    // Create a 7-day view combining snow forecast and derived sentiment
    return weather.forecastArray.map((snow, i) => {
      const cumulativeSnow = weather.forecastArray.slice(0, i + 1).reduce((a, b) => a + b, 0);
      const sentiment = Math.min(95, 40 + cumulativeSnow * 1.2 + (stock.delta1d > 0 ? 10 : 0));
      return {
        date: `Day ${i + 1}`,
        snowfall: Math.round(snow * 10) / 10,
        sentiment: Math.round(sentiment * 10) / 10,
      };
    });
  }, [weather, stock]);

  const topMovers = useMemo(() => {
    let movers = [...TICKERS].sort((a, b) => b.delta14d - a.delta14d).slice(0, 5);
    // If we have live stock data for the active ticker, update it in the top movers list dynamically
    if (stock) {
      movers = movers.map(m => m.symbol === stock.ticker ? { ...m, price: stock.price, delta1d: stock.delta1d } : m);
    }
    return movers;
  }, [stock]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Q4 2026 · Live"
        title="Snow-Equity Intelligence, in real time."
        description="Quant-grade correlations between early-season snowfall anomalies and ski-sector equities — refreshed every market open."
        actions={
          <div className="flex items-center gap-3">
            <Select value={ticker} onValueChange={setTicker}>
              <SelectTrigger className="w-56 bg-white/[0.02] border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TICKERS.map((t) => (
                  <SelectItem key={t.symbol} value={t.symbol}>${t.symbol} — {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportButton label="Export Daily Brief" />
          </div>
        }
      />

      <SignalAlert prediction={prediction} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" key={`kpis-${ticker}`}>
        <KpiCard
          label="Live Price (1D)"
          value={stock ? `$${stock.price.toFixed(2)}` : "—"}
          unit=""
          delta={stock ? `${stock.delta1d >= 0 ? "↑" : "↓"} ${Math.abs(stock.delta1d).toFixed(2)}%` : "Loading..."}
          caption={`Dynamic fetch for ${ticker}`}
          sparkSeed={3}
          tone={stock && stock.delta1d >= 0 ? "mint" : "amber"}
        />
        <KpiCard
          label="7-Day Snow Forecast"
          value={weather ? weather.forecast7dCm.toString() : "—"}
          unit="cm"
          delta={weather && weather.forecast7dCm > 30 ? "Heavy powder" : "Tracking"}
          caption="Open-Meteo best_match model"
          sparkSeed={5}
          tone="glacier"
        />
        <KpiCard
          label="Forecast Confidence Index"
          value={prediction ? prediction.confidenceScore.toString() : "—"}
          unit="/ 100"
          delta={prediction?.hasSignal ? "High Conviction" : "Neutral"}
          caption="Ensemble correlation check"
          sparkSeed={11}
          tone={prediction?.hasSignal ? "mint" : "amber"}
        />
        <KpiCard
          label="Live Status"
          value={isLoading ? "SYNCING" : "LIVE"}
          delta={stock?.isSimulated ? "Simulated Prices" : "Connected"}
          caption={isLoading ? "Fetching APIs..." : "State-linked architecture"}
          sparkSeed={7}
          tone={isLoading ? "amber" : "mint"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden relative">
          {isLoading && <ChartSkeleton />}
          <div className="flex items-center justify-between p-5 border-b border-border/40">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live Forecast</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">Snowfall × Sentiment · ${ticker} · 7-day</div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-glacier" /> Snowfall</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-mint" /> Sentiment</span>
            </div>
          </div>
          <HeroChart data={sentimentChartData} chartKey={ticker} />
        </GlassCard>

        <GlassCard className="relative overflow-hidden">
          {isLoading && <ChartSkeleton />}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Live Anomalies</div>
              <div className="mt-1 text-base font-semibold">7-Day Snow Forecast</div>
            </div>
            <Snowflake className="h-4 w-4 text-glacier" />
          </div>
          {/* Live forecast bar chart */}
          {forecastChartData && (
            <div className="h-40 mb-3" key={`forecast-bars-${ticker}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastChartData} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="snowfall" fill="var(--glacier)" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                  <Tooltip content={<MiniTip />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <ul className="space-y-2">
            {weather ? (
              <li className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">${ticker} mapped resort</div>
                  <div className="text-xs text-muted-foreground">{weather.snowDepthCm}cm base depth</div>
                </div>
                <div className="font-mono text-sm tabular-nums text-glacier">
                  +{weather.forecast7dCm}cm 7d
                </div>
              </li>
            ) : null}
          </ul>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden relative">
        {isLoading && <ChartSkeleton />}
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Top Movers · 14d</div>
            <div className="mt-1 text-lg font-semibold tracking-tight">Weather-sensitive equities</div>
          </div>
        </div>
        <div className="divide-y divide-border/40">
          <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <div className="col-span-2">Ticker</div>
            <div className="col-span-4">Company</div>
            <div className="col-span-2">Sector</div>
            <div className="col-span-1 text-right">Price</div>
            <div className="col-span-1 text-right">1D</div>
            <div className="col-span-1 text-right">14D</div>
            <div className="col-span-1 text-right">Sent.</div>
          </div>
          {topMovers.map((t) => {
            const up14 = t.delta14d >= 0;
            const up1 = t.delta1d >= 0;
            return (
              <div key={t.symbol} className={cn("grid grid-cols-12 gap-3 px-5 py-3 text-sm items-center hover:bg-white/[0.02] transition-colors", t.symbol === ticker ? "bg-white/[0.04]" : "")}>
                <div className={cn("col-span-2 font-mono font-semibold", t.symbol === ticker ? "text-glacier" : "")}>${t.symbol}</div>
                <div className="col-span-4 truncate">{t.name}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{t.sector}</div>
                <div className="col-span-1 text-right font-mono">{t.price.toFixed(2)}</div>
                <div className={cn("col-span-1 text-right font-mono inline-flex items-center justify-end gap-0.5", up1 ? "text-mint" : "text-bear")}>
                  {up1 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {up1 ? "+" : ""}{t.delta1d.toFixed(2)}%
                </div>
                <div className={cn("col-span-1 text-right font-mono", up14 ? "text-mint" : "text-bear")}>
                  {up14 ? "+" : ""}{t.delta14d.toFixed(1)}%
                </div>
                <div className="col-span-1 text-right font-mono text-muted-foreground">{t.institutionalSentiment}</div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

function MiniTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-mono text-glacier">{payload[0]?.value?.toFixed(1)} cm</div>
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-mono text-[10px] text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}</span>
          <span className="ml-auto text-foreground">{p.value?.toFixed?.(1) ?? p.value}</span>
        </div>
      ))}
    </div>
  );
}

const HeroChart = memo(function HeroChart({ data, chartKey }: { data: { date: string; snowfall: number; sentiment: number }[] | null, chartKey: string }) {
  if (!data) {
    return <div className="h-72 p-2 flex items-center justify-center text-muted-foreground text-sm">Awaiting live data...</div>;
  }
  
  return (
    <div className="h-72 p-2" key={`hero-chart-${chartKey}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
          <defs>
            <linearGradient id="dashGlac" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--glacier)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--glacier)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dashMint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} minTickGap={40} />
          <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} width={32} />
          <Tooltip content={<ChartTip />} />
          <Area type="monotone" dataKey="snowfall" stroke="var(--glacier)" strokeWidth={1.8} fill="url(#dashGlac)" isAnimationActive={false} dot={false} activeDot={false} />
          <Area type="monotone" dataKey="sentiment" stroke="var(--mint)" strokeWidth={1.8} fill="url(#dashMint)" isAnimationActive={false} dot={false} activeDot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});