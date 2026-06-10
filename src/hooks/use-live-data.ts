import { useQuery } from "@tanstack/react-query";
import { TICKER_RESORT_MAP } from "../lib/api-mapping";
import { fetchWeatherForResort, WeatherData } from "../lib/api/weather-api";
import { fetchStockData, StockData } from "../lib/api/finance-api";

export function useLiveData(ticker: string, region?: string) {
  const query = useQuery({
    queryKey: ["liveData", ticker, region],
    queryFn: async ({ signal }) => {
      const coords = TICKER_RESORT_MAP[ticker];
      if (!coords) throw new Error(`Ticker mapping not found for: ${ticker}`);

      const [weatherRes, stockRes] = await Promise.all([
        fetchWeatherForResort(coords, signal),
        fetchStockData(ticker, signal),
      ]);

      return { weather: weatherRes, stock: stockRes };
    },
    refetchInterval: 3600000, // 1 hour
    staleTime: 3600000,
  });

  return {
    weather: query.data?.weather ?? null,
    stock: query.data?.stock ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
