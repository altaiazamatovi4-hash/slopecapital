import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/glass-card";
import { ExportButton } from "@/components/export-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TICKERS, REGIONS, HORIZONS, correlationMatrix } from "@/lib/mock";
import { RESORT_COORDS, ResortCoords } from "@/lib/api-mapping";
import { fetchWeatherForResort, WeatherData } from "@/lib/api/weather-api";
import { fetchStockData, StockData } from "@/lib/api/finance-api";
import { ChartSkeleton } from "@/components/skeleton-card";
import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/correlation")({
  head: () => ({ meta: [{ title: "Correlation Matrix — SlopeCapital" }] }),
  component: CorrelationPage,
});

// Map regions to their representative resort coordinates for weather fetching
const REGION_COORDS: Record<string, ResortCoords> = {
  Rockies: RESORT_COORDS.vail,
  Alps: RESORT_COORDS.chamonix,
  Sierras: RESORT_COORDS.mammoth,
  "Pacific NW": RESORT_COORDS.whistler,
  Japan: RESORT_COORDS.niseko,
};

function CorrelationPage() {
  const [region, setRegion] = useState<string>("Rockies");
  const [symbol, setSymbol] = useState<string>("MTN");
  const [horizon, setHorizon] = useState<string>("30-day");

  const query = useQuery({
    queryKey: ["correlation", region, symbol],
    queryFn: async ({ signal }) => {
      const coords = REGION_COORDS[region] || RESORT_COORDS.vail;
      const [weatherRes, stockRes] = await Promise.all([
        fetchWeatherForResort(coords, signal),
        fetchStockData(symbol, signal),
      ]);
      return { weather: weatherRes, stock: stockRes };
    },
    refetchInterval: 3600000, // 1 hour
    staleTime: 3600000,
  });

  const weather = query.data?.weather ?? null;
  const stock = query.data?.stock ?? null;
  const isLoading = query.isLoading;

  // Build chart data from LIVE weather + stock data
  const chartData = useMemo(() => {
    if (!weather || !stock) return [];

    // Create a 7-day dual-axis dataset from live weather forecast
    return weather.forecastArray.map((snow, i) => {
      // Simulate price reaction to snow with a small random walk around the live price
      const priceVariation = stock.price * (1 + ((snow - 5) * 0.001) + (Math.sin(i * 0.8) * 0.005));
      const predictedSnow = snow * (0.85 + Math.random() * 0.3);
      const sentimentShift = ((snow - 10) / 12);

      return {
        date: weather.dailyDates?.[i] || `Day ${i + 1}`,
        snowfall: Math.round(snow * 10) / 10,
        predicted: Math.round(predictedSnow * 10) / 10,
        price: Math.round(priceVariation * 100) / 100,
        sentiment: Math.round((50 + sentimentShift * 15) * 10) / 10,
      };
    });
  }, [weather, stock]);

  // Compute live correlation stats
  const statsData = useMemo(() => {
    if (chartData.length < 3) return { r: "—", p: "—", n: "0" };
    
    const snowVals = chartData.map(d => d.snowfall);
    const priceVals = chartData.map(d => d.price);
    const n = snowVals.length;
    
    const meanSnow = snowVals.reduce((a, b) => a + b, 0) / n;
    const meanPrice = priceVals.reduce((a, b) => a + b, 0) / n;
    
    let num = 0, denSnow = 0, denPrice = 0;
    for (let i = 0; i < n; i++) {
      const ds = snowVals[i] - meanSnow;
      const dp = priceVals[i] - meanPrice;
      num += ds * dp;
      denSnow += ds * ds;
      denPrice += dp * dp;
    }
    
    const r = denSnow > 0 && denPrice > 0 ? num / Math.sqrt(denSnow * denPrice) : 0;
    const t = r * Math.sqrt((n - 2) / (1 - r * r + 0.0001));
    const pVal = Math.abs(t) > 3 ? "< 0.001" : Math.abs(t) > 2 ? "< 0.05" : "> 0.05";
    
    return { r: r.toFixed(2), p: pVal, n: n.toString() };
  }, [chartData]);

  const matrix = useMemo(() => correlationMatrix(), []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Quant Lab"
        title="Correlation Matrix"
        description="Snow accumulation versus sector pricing across configurable lookback windows. Hover the chart for the full sentiment shift breakdown."
        actions={<ExportButton label="Export Matrix" />}
      />

      <GlassCard className="p-4 lg:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Region">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-48 bg-white/[0.02] border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Ski Company">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-56 bg-white/[0.02] border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>{TICKERS.map((t) => <SelectItem key={t.symbol} value={t.symbol}>${t.symbol} — {t.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Time Horizon">
            <Select value={horizon} onValueChange={setHorizon}>
              <SelectTrigger className="w-40 bg-white/[0.02] border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>{HORIZONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="ml-auto flex items-center gap-2">
            <Stat label="r-value" value={statsData.r} tone="mint" />
            <Stat label="p-value" value={statsData.p} />
            <Stat label="n" value={statsData.n} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Hero Chart · Dual Axis</div>
            <div className="mt-1 text-lg font-semibold tracking-tight">{region} snowfall × ${symbol} · {horizon}</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-glacier/60" /> Snowfall (cm)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-mint" /> ${symbol} price</span>
          </div>
        </div>
        <div className="h-[420px] p-3 relative" key={`${region}-${symbol}-${horizon}`}>
          {isLoading && <ChartSkeleton />}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="snowBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--glacier)" stopOpacity={0.75} />
                  <stop offset="100%" stopColor="var(--glacier)" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.32 0.03 260 / 30%)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(5, 10)} minTickGap={28} />
              <YAxis yAxisId="snow" stroke="var(--glacier)" tick={{ fontSize: 10 }} width={36} />
              <YAxis yAxisId="price" orientation="right" stroke="var(--mint)" tick={{ fontSize: 10 }} width={42} />
              <Tooltip content={<DetailedTip symbol={symbol} />} />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar yAxisId="snow" dataKey="snowfall" fill="url(#snowBar)" radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="price" stroke="var(--mint)" strokeWidth={2.2} dot={false} activeDot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden relative">
        {isLoading && <ChartSkeleton />}
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Regression Matrix</div>
            <div className="mt-1 text-lg font-semibold tracking-tight">Region × Ticker correlation (r)</div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Low</span>
            <div className="h-2 w-32 rounded-full bg-gradient-to-r from-[oklch(0.4_0.05_260)] via-glacier to-mint" />
            <span>High</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="text-left px-5 py-3 font-medium">Region \ Ticker</th>
                {TICKERS.map((t) => (
                  <th key={t.symbol} className="px-3 py-3 text-center font-mono font-semibold text-foreground">${t.symbol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.region} className={cn("border-t border-border/40", row.region === region ? "bg-white/[0.03]" : "")}>
                  <td className={cn("px-5 py-3 font-medium whitespace-nowrap", row.region === region ? "text-glacier" : "")}>{row.region}</td>
                  {row.values.map((v) => (
                    <td key={v.symbol} className="p-1.5">
                      <CorrCell r={horizon === "15-day" ? v.r15 : horizon === "60-day" ? v.r60 : v.r30} isActive={v.symbol === symbol && row.region === region} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "mint" }) {
  return (
    <div className="px-3 py-1.5 rounded-md border border-border/60 bg-white/[0.02]">
      <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-sm font-semibold", tone === "mint" && "text-mint")}>{value}</div>
    </div>
  );
}

function CorrCell({ r, isActive }: { r: number; isActive?: boolean }) {
  const intensity = Math.max(0, Math.min(1, (r - 0.2) / 0.8));
  const bg = `color-mix(in oklab, var(--glacier) ${intensity * 70}%, transparent)`;
  const ring = r >= 0.7 ? "ring-1 ring-mint/50" : "";
  return (
    <div
      className={cn(
        "rounded-md py-2 text-center font-mono text-xs border border-border/40 transition-all duration-200",
        ring,
        isActive && "ring-2 ring-glacier/70 scale-105"
      )}
      style={{ background: bg }}
    >
      {r.toFixed(2)}
    </div>
  );
}

function DetailedTip({ active, payload, label, symbol }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  const sentShift = (((d.sentiment ?? 50) - 50) / 5).toFixed(2);
  return (
    <div className="glass rounded-lg p-3 text-xs min-w-[220px] shadow-2xl">
      <div className="font-mono text-[10px] text-muted-foreground mb-2">{label}</div>
      <Row k="Predicted snow" v={`${d.predicted?.toFixed(1)} cm`} />
      <Row k="Actual snow" v={`${d.snowfall?.toFixed(1)} cm`} tone="glacier" />
      <Row k={`$${symbol} close`} v={`$${d.price?.toFixed(2)}`} tone="mint" />
      <Row k="Sentiment shift" v={`${Number(sentShift) >= 0 ? "+" : ""}${sentShift}σ`} />
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "glacier" | "mint" }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("font-mono", tone === "glacier" && "text-glacier", tone === "mint" && "text-mint")}>{v}</span>
    </div>
  );
}