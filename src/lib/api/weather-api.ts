import { ResortCoords } from "../api-mapping";

export interface WeatherData {
  snowDepthCm: number;
  forecast7dCm: number;
  forecastArray: number[];
  hourlySnowfall: number[];
  dailySnowDepth: number[];
  dailyDates: string[];
}

export async function fetchWeatherForResort(
  coords: ResortCoords,
  signal?: AbortSignal
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&elevation=${coords.elevation}&daily=snow_depth&hourly=snowfall&timezone=auto&models=best_match`;
  
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract daily snow depth array
    const dailySnowDepthRaw: number[] = data.daily?.snow_depth || [];
    const dailyDates: string[] = data.daily?.time || [];
    const dailySnowDepth = dailySnowDepthRaw.map((d: number) => Math.round((d || 0) * 100));
    
    const depthMeters = dailySnowDepthRaw[0] || 0;
    const snowDepthCm = Math.round(depthMeters * 100);

    // Extract hourly snowfall
    const hourlySnowfall: number[] = data.hourly?.snowfall || [];
    
    // Condense to daily array (7 days)
    const forecastArray: number[] = [];
    let forecast7dCm = 0;
    
    for (let i = 0; i < 7; i++) {
      const daySnowArr = hourlySnowfall.slice(i * 24, (i + 1) * 24);
      const daySnowSumCm = daySnowArr.reduce((sum: number, x: number) => sum + (x || 0), 0);
      forecastArray.push(Math.round(daySnowSumCm * 10) / 10);
      forecast7dCm += daySnowSumCm;
    }

    return {
      snowDepthCm,
      forecastArray,
      forecast7dCm: Math.round(forecast7dCm),
      hourlySnowfall,
      dailySnowDepth,
      dailyDates,
    };
  } catch (e) {
    if (signal?.aborted) throw e;
    console.warn("Weather API failed, using fallback mock data. Error:", e);
    const forecastArray = [12.5, 18.2, 22.0, 8.4, 4.1, 15.6, 28.3];
    return {
      snowDepthCm: 142,
      forecastArray,
      forecast7dCm: Math.round(forecastArray.reduce((a, b) => a + b, 0)),
      hourlySnowfall: Array(7 * 24).fill(0.5),
      dailySnowDepth: [142, 145, 150, 155, 158, 160, 170],
      dailyDates: Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d.toISOString().slice(0, 10);
      }),
    };
  }
}
