export interface StockData {
  ticker: string;
  price: number;
  isSimulated: boolean;
  delta1d: number;
  priceHistory: { date: string; price: number }[];
}

// Global cache to maintain realistic random walks during simulation
const simCache: Record<string, { price: number; history: { date: string; price: number }[]; lastUpdate: number }> = {};

function initSimCache(ticker: string, basePrice: number) {
  if (simCache[ticker]) return;
  // Build a synthetic 30-day history
  const history: { date: string; price: number }[] = [];
  let p = basePrice * 0.95;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const volatility = 0.015;
    const drift = 1 + (Math.random() * volatility * 2 - volatility);
    p = p * drift;
    history.push({ date: d.toISOString().slice(0, 10), price: Math.round(p * 100) / 100 });
  }
  simCache[ticker] = { price: p, history, lastUpdate: Date.now() };
}

// Initialize default tickers
const defaultTickers: Record<string, number> = {
  MTN: 215.42, BIRD: 14.85, DOOO: 62.30,
  AS: 22.18, SKIS: 41.22, POOL: 312.05,
  ALTM: 58.71, GLCR: 14.55, ALPN: 96.42,
};
Object.entries(defaultTickers).forEach(([t, p]) => initSimCache(t, p));

export async function fetchStockData(
  ticker: string,
  signal?: AbortSignal
): Promise<StockData> {
  const apiKey = typeof import.meta !== "undefined" ? (import.meta as any).env?.VITE_FINNHUB_API_KEY : undefined;
  
  // Live Fetch (if key is present)
  if (apiKey) {
    try {
      const resp = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`, { signal });
      if (!resp.ok) throw new Error("Finnhub rate limited or error");
      const data = await resp.json();
      if (data && data.c) {
        return {
          ticker,
          price: data.c,
          delta1d: ((data.c - data.pc) / data.pc) * 100,
          isSimulated: false,
          priceHistory: [], // Live mode — history not available from quote endpoint
        };
      }
    } catch (e) {
      if (signal?.aborted) throw e;
      console.warn("Falling back to simulation for " + ticker);
    }
  }

  // Fallback Simulation (Random Walk)
  initSimCache(ticker, 100);
  const cache = simCache[ticker];
  
  // Drift price
  const volatility = ticker === "BIRD" ? 0.05 : 0.02;
  const drift = 1 + (Math.random() * volatility - volatility / 2);
  const newPrice = cache.price * drift;
  
  // Push a new history point
  const today = new Date().toISOString().slice(0, 10);
  const lastEntry = cache.history[cache.history.length - 1];
  if (lastEntry && lastEntry.date === today) {
    lastEntry.price = Math.round(newPrice * 100) / 100;
  } else {
    cache.history.push({ date: today, price: Math.round(newPrice * 100) / 100 });
    if (cache.history.length > 60) cache.history.shift();
  }
  
  cache.price = newPrice;
  cache.lastUpdate = Date.now();

  return {
    ticker,
    price: newPrice,
    delta1d: (drift - 1) * 100,
    isSimulated: true,
    priceHistory: [...cache.history],
  };
}
