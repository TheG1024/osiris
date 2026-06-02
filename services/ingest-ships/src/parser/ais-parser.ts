export interface RawAISMessage {
  timestamp: number;
  mmsi: number;
  latitude?: number;
  longitude?: number;
  sog?: number;
  cog?: number;
  heading?: number;
}

export function parseAISMessage(data: any): RawAISMessage | null {
  if (!data.MMSI || !data.Timestamp) {
    return null;
  }

  return {
    timestamp: data.Timestamp,
    mmsi: data.MMSI,
    latitude: data.Latitude,
    longitude: data.Longitude,
    sog: data.SOG,
    cog: data.COG,
    heading: data.Heading
  };
}

export function isValidMMSI(mmsi: number): boolean {
  return mmsi > 0 && mmsi <= 999999999;
}
