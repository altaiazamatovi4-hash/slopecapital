import { useLiveData } from "./use-live-data";

export interface PredictionResult {
  hasSignal: boolean;
  signal: string;
  confidenceScore: number;
  reasoning: string;
}

export function usePredictiveEngine(ticker: string, region?: string) {
  const { stock, weather, isLoading, error, refetch } = useLiveData(ticker, region);

  let prediction: PredictionResult | null = null;

  if (weather && stock) {
    // Prediction Algorithm
    if (weather.forecast7dCm > 30) {
      // Calculate confidence based on snow volume and current stock price delta
      const baseConfidence = 70;
      const snowBonus = Math.min(20, (weather.forecast7dCm - 30) * 0.5);
      // Give a slight boost if the stock is currently down for the day (better entry point)
      const valueBonus = stock.delta1d < 0 ? 5 : 0;
      
      const score = Math.round(baseConfidence + snowBonus + valueBonus);
      
      prediction = {
        hasSignal: true,
        signal: "BULLISH SENTIMENT SIGNAL",
        confidenceScore: score,
        reasoning: `${weather.forecast7dCm}cm 7-day snow forecast detected for ${ticker}. High conviction algorithm trigger.`,
      };
    } else {
      prediction = {
        hasSignal: false,
        signal: "NEUTRAL / NO CLEAR CATALYST",
        confidenceScore: 40,
        reasoning: `${weather.forecast7dCm}cm 7-day snow forecast for ${ticker}. Insufficient near-term weather catalyst detected.`,
      };
    }
  }

  return {
    prediction,
    weather,
    stock,
    isLoading,
    error,
    refetch,
  };
}
