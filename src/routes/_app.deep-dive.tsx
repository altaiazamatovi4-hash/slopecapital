import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { ExportButton } from "@/components/export-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { RESORTS, TICKERS } from "@/lib/mock";
import { usePairsData } from "@/hooks/use-pairs-data";
import { ChartSkeleton } from "@/components/skeleton-card";
import { Cloud, Snowflake, Thermometer, Wind, Mountain, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/_app/deep-dive")({
  head: () => ({ meta: [{ title: "Resort × Ticker — SlopeCapital" }] }),
  component: DeepDivePage,
});

function DeepDivePage() {
  const [resortId, setResortId] = useState("vail");
  const [symbol, setSymbol] = useState("MTN");
  const [lag, setLag] = useState([5]);
  // Debounced lag — chart only recomputes 300ms after the user stops dragging.
  const [debouncedLag, setDebouncedLag] = useState(lag[0]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLag(lag[0]), 300);
    return () => clearTimeout(t);
  }, [lag]);

  const { weather, stock, isLoading } = usePairsData(resortId, symbol);

  const resort = useMemo(() => RESORTS.find((r) => r.id === resortId)!, [resortId]);
  const ticker = useMemo(() => TICKERS.find((t) => t.symbol === symbol)!, [symbol]);

  // Build stock price series from LIVE API data
  const stockSeries = useMemo(() => {
    if (!stock?.priceHistory?.length) return null;
    return stock.priceHistory.map(p => ({
      date: p.date,
      price: p.price,
    }));
  }, [stock]);

  // Build combined lag-shifted chart from LIVE data
  const lagShifted = useMemo(() => {
    if (!weather || !stock?.priceHistory?.length) return null;

    const days = debouncedLag;
    const priceHist = stock.priceHistory;
    
    // Build a combined series using weather forecast + price data
    // Use the 7-day forecast as the "snow" dimension and interpolate/extend with daily snow depth
    const combinedLength = Math.max(priceHist.length, 7);
    const result = [];
    
    for (let i = 0; i < combinedLength; i++) {
      const priceIdx = i;
      const snowIdx = Math.max(0, i - Math.round(days));
      
      const priceEntry = priceHist[Math.min(priceIdx, priceHist.length - 1)];
      const snowValue = snowIdx < weather.forecastArray.length 
        ? weather.forecastArray[snowIdx] 
        : (weather.dailySnowDepth?.[snowIdx] || 0);

      result.push({
        date: priceEntry?.date || `D+${i}`,
        price: priceEntry?.price || stock.price,
        snowLagged: Math.round(snowValue * 10) / 10,
      });
    }
    
    return result;
  }, [debouncedLag, weather, stock]);

  // Compute live base depth from weather
  const liveBaseDepth = weather ? weather.snowDepthCm : resort.baseDepthCm;
  const liveForecast7d = weather ? weather.forecast7dCm : resort.forecast7d.reduce((a, b) => a + b, 0);
  const forecastBarData = weather
    ? weather.forecastArray.map((v, i) => ({ d: `D+${i + 1}`, v }))
    : resort.forecast7d.map((v, i) => ({ d: `D+${i + 1}`, v }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Pairs Lab"
        title="Resort × Ticker Deep Dive"
        description="Side-by-side weather and equity telemetry, with a tunable lag slider to visualise propagation delay between snowfall events and price action."
        actions={<ExportButton label="Export Pair Brief" />}
      />

      <div className="flex flex-wrap gap-3">
        <Select value={resortId} onValueChange={setResortId}>
          <SelectTrigger className="w-64 bg-white/[0.02] border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>{RESORTS.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} · {r.region}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-64 bg-white/[0.02] border-border/60"><SelectValue /></SelectTrigger>
          <SelectContent>{TICKERS.map((t) => <SelectItem key={t.symbol} value={t.symbol}>${t.symbol} — {t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2" key={`${resortId}-${symbol}`}>
        {/* RESORT */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="relative h-40 overflow-hidden border-b border-border/40">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,oklch(0.78_0.14_230/40%),transparent_60%),linear-gradient(180deg,oklch(0.25_0.04_260),oklch(0.18_0.03_260))]" />
            <svg viewBox="0 0 400 160" className="absolute inset-0 w-full h-full opacity-80">
              <polygon points="0,160 80,80 140,110 220,40 290,90 360,60 400,100 400,160" fill="oklch(0.3 0.03 260)" />
              <polygon points="0,160 80,80 140,110 220,40 290,90 360,60 400,100 400,160" fill="url(#snowcap)" opacity="0.6" />
              <defs>
                <linearGradient id="snowcap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#F8FAFC" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-3 left-3 flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur border border-border/60 font-mono">LIVE · CAM 02</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-glacier">{resort.region}</div>
                <div className="text-xl font-semibold tracking-tight">{resort.name}</div>
              </div>
              <span className={cn(
                "font-mono text-xs px-2 py-1 rounded-full border",
                resort.status === "Powder Day" ? "bg-mint/15 text-mint border-mint/40" :
                resort.status === "Thin" ? "bg-bear/15 text-bear border-bear/40" :
                "bg-glacier/15 text-glacier border-glacier/40"
              )}>{resort.status}</span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-3 gap-3">
            <Metric icon={Snowflake} label="Base depth" value={`${liveBaseDepth}`} unit="cm" />
            <Metric icon={Thermometer} label="Summit temp" value="-12" unit="°C" />
            <Metric icon={Wind} label="Wind" value="22" unit="km/h" />
          </div>

          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">7-day forecast accumulation</div>
              <div className="font-mono text-sm text-glacier">+{liveForecast7d}cm</div>
            </div>
            <div className="h-28 relative" key={`forecast-${resortId}`}>
              {isLoading && <ChartSkeleton />}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastBarData} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="d" stroke="var(--muted-foreground)" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="v" fill="var(--glacier)" radius={[3, 3, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* TICKER */}
        <GlassCard className="p-0 overflow-hidden">
          <div className="p-5 border-b border-border/40 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-mint">{ticker.sector}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold">${ticker.symbol}</span>
                <span className="text-sm text-muted-foreground">{ticker.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl font-semibold">${stock ? stock.price.toFixed(2) : ticker.price.toFixed(2)}</div>
              <div className={cn("font-mono text-sm inline-flex items-center gap-1", (stock ? stock.delta1d : ticker.delta14d) >= 0 ? "text-mint" : "text-bear")}>
                {(stock ? stock.delta1d : ticker.delta14d) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {(stock ? stock.delta1d : ticker.delta14d) >= 0 ? "+" : ""}{(stock ? stock.delta1d : ticker.delta14d).toFixed(1)}% · {stock ? "1d" : "14d"}
              </div>
            </div>
          </div>

          <div className="h-40 px-2 relative" key={`price-chart-${symbol}`}>
            {isLoading && <ChartSkeleton />}
            {stockSeries ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockSeries} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="pxFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="price" stroke="var(--mint)" strokeWidth={2} fill="url(#pxFill)" isAnimationActive={false} dot={false} activeDot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Loading price data...</div>
            )}
          </div>

          <div className="p-5 pt-3 grid grid-cols-3 gap-3">
            <Metric icon={Mountain} label="Volume" value={`${ticker.volumeM.toFixed(1)}M`} />
            <Metric icon={Cloud} label="P/E" value={ticker.pe.toFixed(1)} />
            <Metric icon={TrendingUp} label="1D" value={`${(stock ? stock.delta1d : ticker.delta1d) >= 0 ? "+" : ""}${(stock ? stock.delta1d : ticker.delta1d).toFixed(2)}%`} tone={(stock ? stock.delta1d : ticker.delta1d) >= 0 ? "mint" : "bear"} />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Institutional sentiment</div>
              <div className="font-mono text-sm">{ticker.institutionalSentiment}/100</div>
            </div>
            <Progress value={ticker.institutionalSentiment} className="h-1.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-glacier [&>div]:to-mint" />
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-5 border-b border-border/40 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Synchronized timeline</div>
            <div className="mt-1 text-lg font-semibold tracking-tight">Lag-adjusted snow vs ${ticker.symbol} price</div>
          </div>
          <div className="flex items-center gap-4 min-w-[260px]">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">Lag offset</div>
            <Slider value={lag} onValueChange={setLag} min={0} max={7} step={1} className="flex-1" />
            <div className="font-mono text-sm text-glacier w-12 text-right">{lag[0]}d</div>
          </div>
        </div>
        <LagChart data={lagShifted} isLoading={isLoading} chartKey={`${resortId}-${symbol}-${debouncedLag}`} />
      </GlassCard>
    </div>
  );
}

const LagChart = memo(function LagChart({ data, isLoading, chartKey }: { data: any[] | null, isLoading?: boolean, chartKey: string }) {
  if (!data) {
    return (
      <div className="h-80 p-3 relative">
        {isLoading && <ChartSkeleton />}
        {!isLoading && <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Awaiting live data...</div>}
      </div>
    );
  }
  
  return (
    <div className="h-80 p-3 relative" key={chartKey}>
      {isLoading && <ChartSkeleton />}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="oklch(0.32 0.03 260 / 30%)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(5, 10)} minTickGap={28} />
          <YAxis yAxisId="s" stroke="var(--glacier)" tick={{ fontSize: 10 }} width={32} />
          <YAxis yAxisId="p" orientation="right" stroke="var(--mint)" tick={{ fontSize: 10 }} width={40} />
          <Tooltip contentStyle={{ background: "#111827", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
          <Bar yAxisId="s" dataKey="snowLagged" fill="var(--glacier)" opacity={0.55} maxBarSize={10} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="p" type="monotone" dataKey="price" stroke="var(--mint)" strokeWidth={2.2} dot={false} activeDot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});

function Metric({ icon: Icon, label, value, unit, tone }: { icon: any; label: string; value: string; unit?: string; tone?: "mint" | "bear" }) {
  return (
    <div className="rounded-lg border border-border/40 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={cn("mt-1 font-mono text-base font-semibold", tone === "mint" && "text-mint", tone === "bear" && "text-bear")}>
        {value}{unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}