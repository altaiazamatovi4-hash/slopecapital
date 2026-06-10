export interface ResortCoords {
  lat: number;
  lon: number;
  elevation: number;
  name: string;
}

export const RESORT_COORDS: Record<string, ResortCoords> = {
  vail: {
    name: "Vail Mountain",
    lat: 39.6061,
    lon: -106.3549,
    elevation: 2450,
  },
  whistler: {
    name: "Whistler Blackcomb",
    lat: 50.1163,
    lon: -122.9574,
    elevation: 650,
  },
  chamonix: {
    name: "Chamonix Mont-Blanc",
    lat: 45.9227,
    lon: 6.8685,
    elevation: 1030,
  },
  aspen: { name: "Aspen", lat: 39.1911, lon: -106.8175, elevation: 2400 },
  stmoritz: { name: "St. Moritz", lat: 46.4908, lon: 9.8355, elevation: 1822 },
  mammoth: { name: "Mammoth", lat: 37.6309, lon: -119.0326, elevation: 2300 },
  niseko: { name: "Niseko", lat: 42.8048, lon: 140.6874, elevation: 300 },
  parkcity: { name: "Park City", lat: 40.6461, lon: -111.4980, elevation: 2100 },
};

export const TICKER_RESORT_MAP: Record<string, ResortCoords> = {
  MTN: RESORT_COORDS.vail,
  BIRD: RESORT_COORDS.whistler,
  DOOO: RESORT_COORDS.chamonix,
  AS: RESORT_COORDS.whistler,
  SKIS: RESORT_COORDS.aspen,
  POOL: RESORT_COORDS.parkcity,
  ALTM: RESORT_COORDS.mammoth,
  GLCR: RESORT_COORDS.chamonix,
  ALPN: RESORT_COORDS.stmoritz,
};
