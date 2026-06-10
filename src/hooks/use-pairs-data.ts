import { useQuery } from "@tanstack/react-query";
import { RESORT_COORDS } from "../lib/api-mapping";
import { fetchWeatherForResort, WeatherData } from "../lib/api/weather-api";
import { fetchStockData, StockData } from "../lib/api/finance-api";

export function usePairsData(resortId: string, symbol: string) {
  const query = useQuery({
    queryKey: ["pairsData", resortId, symbol],
    queryFn: async ({ signal }) => {
      const coords = RESORT_COORDS[resortId];
      if (!coords) throw new Error(`Resort mapping not found for: ${resortId}`);

      const [weatherRes, stockRes] = await Promise.all([
        fetchWeatherForResort(coords, signal),
        fetchStockData(symbol, signal),
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
  };
}
