// Deterministic mock data for SlopeCapital.
// Seeded PRNG so charts look identical on every load.

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Resort = {
  id: string;
  name: string;
  region: "Rockies" | "Alps" | "Sierras" | "Pacific NW" | "Japan";
  country: string;
  baseDepthCm: number;
  forecast7d: number[];
  variancePct: number;
  status: "Powder Day" | "Building" | "Stable" | "Thin";
};

export const RESORTS: Resort[] = [
  { id: "vail",      name: "Vail",            region: "Rockies",   country: "USA",    baseDepthCm: 142, forecast7d: [12, 18, 22, 8, 4, 15, 28], variancePct: 24,  status: "Powder Day" },
  { id: "whistler",  name: "Whistler Blackcomb", region: "Pacific NW", country: "Canada", baseDepthCm: 188, forecast7d: [22, 14, 9, 18, 32, 24, 11], variancePct: 31, status: "Powder Day" },
  { id: "aspen",     name: "Aspen Snowmass",  region: "Rockies",   country: "USA",    baseDepthCm: 121, forecast7d: [6, 9, 12, 14, 8, 4, 7],    variancePct: 11,  status: "Building" },
  { id: "chamonix",  name: "Chamonix",        region: "Alps",      country: "France", baseDepthCm: 156, forecast7d: [14, 8, 6, 22, 18, 9, 12],  variancePct: 18,  status: "Stable" },
  { id: "stmoritz",  name: "St. Moritz",      region: "Alps",      country: "Swiss",  baseDepthCm: 98,  forecast7d: [4, 6, 9, 11, 8, 5, 7],     variancePct: -6,  status: "Thin" },
  { id: "mammoth",   name: "Mammoth Mountain",region: "Sierras",   country: "USA",    baseDepthCm: 167, forecast7d: [18, 24, 12, 6, 9, 22, 28], variancePct: 28,  status: "Powder Day" },
  { id: "niseko",    name: "Niseko",          region: "Japan",     country: "Japan",  baseDepthCm: 214, forecast7d: [28, 32, 24, 18, 22, 36, 30], variancePct: 42, status: "Powder Day" },
  { id: "parkcity",  name: "Park City",       region: "Rockies",   country: "USA",    baseDepthCm: 134, forecast7d: [9, 12, 18, 14, 6, 8, 16],  variancePct: 16,  status: "Building" },
];

export type Ticker = {
  symbol: string;
  name: string;
  sector: "Resort Operator" | "Equipment" | "Hospitality" | "Apparel";
  price: number;
  delta1d: number;
  delta14d: number;
  pe: number;
  volumeM: number;
  institutionalSentiment: number; // 0-100
};

export const TICKERS: Ticker[] = [
  { symbol: "MTN",  name: "Vail Resorts",         sector: "Resort Operator", price: 184.32, delta1d: 1.24,  delta14d: 5.4,  pe: 28.4, volumeM: 1.2,  institutionalSentiment: 78 },
  { symbol: "AS",   name: "Amer Sports",          sector: "Equipment",       price: 22.18,  delta1d: 0.62,  delta14d: 3.1,  pe: 31.2, volumeM: 4.8,  institutionalSentiment: 71 },
  { symbol: "SKIS", name: "Peak Resorts Holdings",sector: "Resort Operator", price: 41.22,  delta1d: -0.48, delta14d: 2.2,  pe: 22.1, volumeM: 0.7,  institutionalSentiment: 64 },
  { symbol: "POOL", name: "Powder Lodging Co.",   sector: "Hospitality",     price: 312.05, delta1d: 0.88,  delta14d: 4.6,  pe: 36.8, volumeM: 0.9,  institutionalSentiment: 69 },
  { symbol: "ALTM", name: "Altimeter Apparel",    sector: "Apparel",         price: 58.71,  delta1d: 1.92,  delta14d: 7.8,  pe: 24.6, volumeM: 2.1,  institutionalSentiment: 82 },
  { symbol: "GLCR", name: "Glacier Outfitters",   sector: "Equipment",       price: 14.55,  delta1d: -0.21, delta14d: -1.4, pe: 19.8, volumeM: 1.5,  institutionalSentiment: 48 },
  { symbol: "ALPN", name: "Alpine Hospitality",   sector: "Hospitality",     price: 96.42,  delta1d: 0.34,  delta14d: 3.9,  pe: 27.5, volumeM: 0.6,  institutionalSentiment: 73 },
];

export type TimePoint = {
  date: string;
  snowfall: number;     // weekly cumulative cm
  predicted: number;    // forecast cm
  price: number;        // stock price
  sentiment: number;    // 0-100
  volume: number;
};

export function buildSeries(seed = 7, weeks = 180): TimePoint[] {
  const rand = mulberry32(seed);
  const out: TimePoint[] = [];
  const start = new Date(2022, 0, 3);
  let price = 120;
  let sentiment = 55;
  for (let i = 0; i < weeks; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i * 7);
    const month = d.getMonth();
    // seasonal snow curve — peaks Dec-Feb
    const seasonal = Math.max(0, Math.cos(((month - 0) / 12) * Math.PI * 2) + 0.4);
    const snow = Math.max(0, seasonal * 40 + (rand() - 0.4) * 24);
    const predicted = Math.max(0, snow * (0.85 + rand() * 0.3));
    const snowImpulse = (snow - 18) * 0.06;
    price = Math.max(40, price + snowImpulse + (rand() - 0.5) * 2.4);
    sentiment = Math.min(98, Math.max(8, sentiment + snowImpulse * 4 + (rand() - 0.5) * 6));
    out.push({
      date: d.toISOString().slice(0, 10),
      snowfall: +snow.toFixed(1),
      predicted: +predicted.toFixed(1),
      price: +price.toFixed(2),
      sentiment: +sentiment.toFixed(1),
      volume: +(0.5 + rand() * 2.4).toFixed(2),
    });
  }
  return out;
}

export const PRIMARY_SERIES = buildSeries(11);

/** Monthly-aggregated view of PRIMARY_SERIES — ~60 points instead of 180.
 *  Use this for hero charts; it dramatically reduces SVG nodes. */
function aggregateMonthly(src: TimePoint[]): TimePoint[] {
  const buckets = new Map<string, TimePoint[]>();
  for (const p of src) {
    const key = p.date.slice(0, 7); // YYYY-MM
    const arr = buckets.get(key) ?? [];
    arr.push(p);
    buckets.set(key, arr);
  }
  return Array.from(buckets.entries()).map(([key, rows]) => {
    const avg = (k: keyof TimePoint) =>
      rows.reduce((s, r) => s + (r[k] as number), 0) / rows.length;
    const sum = (k: keyof TimePoint) =>
      rows.reduce((s, r) => s + (r[k] as number), 0);
    return {
      date: `${key}-01`,
      snowfall: +sum("snowfall").toFixed(1),
      predicted: +sum("predicted").toFixed(1),
      price: +avg("price").toFixed(2),
      sentiment: +avg("sentiment").toFixed(1),
      volume: +avg("volume").toFixed(2),
    };
  });
}

export const MONTHLY_SERIES = aggregateMonthly(PRIMARY_SERIES);

export function sparkSeries(seed: number, n = 24) {
  const r = mulberry32(seed);
  let v = 50 + r() * 30;
  return Array.from({ length: n }, (_, i) => {
    v += (r() - 0.45) * 6;
    return { i, v: +v.toFixed(2) };
  });
}

export const REGIONS = ["Rockies", "Alps", "Sierras", "Pacific NW", "Japan"] as const;
export const HORIZONS = ["15-day", "30-day", "60-day"] as const;

// Correlation matrix: region × ticker × horizon → r value
export function correlationMatrix() {
  const r = mulberry32(42);
  const rows: { region: string; values: { symbol: string; r15: number; r30: number; r60: number }[] }[] = [];
  for (const region of REGIONS) {
    const values = TICKERS.map((t) => {
      const base = 0.3 + r() * 0.55;
      return {
        symbol: t.symbol,
        r15: +(base + (r() - 0.5) * 0.2).toFixed(2),
        r30: +(base + 0.05 + (r() - 0.5) * 0.18).toFixed(2),
        r60: +(base - 0.04 + (r() - 0.5) * 0.2).toFixed(2),
      };
    });
    rows.push({ region, values });
  }
  return rows;
}

export type FeedItem = {
  id: string;
  headline: string;
  source: "NOAA" | "OpenSnow" | "Bloomberg" | "Reuters" | "MeteoSwiss" | "ECMWF";
  region: string;
  impact: "High" | "Medium" | "Low";
  sentiment: "Bullish" | "Bearish" | "Neutral";
  sentimentImpact: number; // %
  time: string;
  tickers: string[];
};

export const FEED: FeedItem[] = [
  { id: "1", headline: "La Niña pattern confirmed; heavy early accumulation expected for Pacific Northwest resorts through December.", source: "NOAA", region: "Pacific NW", impact: "High", sentiment: "Bullish", sentimentImpact: 12, time: "14m ago", tickers: ["MTN", "ALTM", "AS"] },
  { id: "2", headline: "Unseasonably warm November ridge threatens early opening dates across Colorado Rockies.", source: "OpenSnow", region: "Rockies", impact: "High", sentiment: "Bearish", sentimentImpact: -8, time: "32m ago", tickers: ["MTN", "SKIS"] },
  { id: "3", headline: "ECMWF ensemble shifts toward above-normal snowfall across the Alps for Q1 2026.", source: "ECMWF", region: "Alps", impact: "Medium", sentiment: "Bullish", sentimentImpact: 6, time: "1h ago", tickers: ["AS", "ALPN"] },
  { id: "4", headline: "Hokkaido bracing for record sea-effect snow events — Niseko forecast +220cm in 10 days.", source: "MeteoSwiss", region: "Japan", impact: "High", sentiment: "Bullish", sentimentImpact: 14, time: "2h ago", tickers: ["ALTM", "POOL"] },
  { id: "5", headline: "Vail Resorts Q1 guidance raised on strong forward bookings; analysts cite snow forecast tailwind.", source: "Bloomberg", region: "Rockies", impact: "High", sentiment: "Bullish", sentimentImpact: 9, time: "3h ago", tickers: ["MTN"] },
  { id: "6", headline: "Sierra snowpack survey shows 138% of average — Mammoth opens upper-mountain lifts early.", source: "NOAA", region: "Sierras", impact: "Medium", sentiment: "Bullish", sentimentImpact: 7, time: "5h ago", tickers: ["MTN", "POOL"] },
  { id: "7", headline: "Atmospheric river expected to deliver 3-foot totals along Cascades next week.", source: "OpenSnow", region: "Pacific NW", impact: "High", sentiment: "Bullish", sentimentImpact: 11, time: "6h ago", tickers: ["ALTM", "AS"] },
  { id: "8", headline: "Glacier Outfitters Q3 inventory writedown weighs on equipment sector sentiment.", source: "Reuters", region: "Global", impact: "Medium", sentiment: "Bearish", sentimentImpact: -5, time: "8h ago", tickers: ["GLCR"] },
  { id: "9", headline: "European Alps gondola operators report 22% rise in season-pass renewals YoY.", source: "Reuters", region: "Alps", impact: "Low", sentiment: "Bullish", sentimentImpact: 3, time: "11h ago", tickers: ["ALPN"] },
  { id: "10", headline: "Polar vortex displacement signal strengthens — extended cold snap likely mid-January.", source: "NOAA", region: "Rockies", impact: "Medium", sentiment: "Bullish", sentimentImpact: 5, time: "1d ago", tickers: ["MTN", "POOL"] },
];