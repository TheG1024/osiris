import axios from 'axios';
import { GeoEntity } from '@osiris/shared';

// NOAA AviationWeather API v1 returns station objects (not the old flat METARData type).
// Key fields: icaoId, obsTime (unix sec), lat, lon, temp, dewp, wdir, wspd, altim, rawOb.
export interface MetarObs {
  icaoId?: string;
  obsTime?: number;
  reportTime?: string;
  lat?: number;
  lon?: number;
  temp?: number;
  dewp?: number;
  wdir?: number;
  wspd?: number;
  visib?: string | number;
  altim?: number;
  cover?: string;
  rawOb?: string;
  name?: string;
}

const NOAA_METAR_URL = 'https://aviationweather.gov/api/data/metar';

export async function fetchMETARData(
  stationIds?: string[],
  hours: number = 1
): Promise<MetarObs[]> {
  const params: Record<string, string> = {
    format: 'json',
    hours: String(hours),
  };
  if (stationIds && stationIds.length > 0) {
    params.ids = stationIds.join(',');
  }
  const response = await axios.get<MetarObs[]>(NOAA_METAR_URL, { params, timeout: 30000 });
  return response.data || [];
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function metarToEntity(metar: MetarObs): GeoEntity | null {
  const lat = num(metar.lat);
  const lon = num(metar.lon);
  if (lat === undefined || lon === undefined) return null;
  const ts = metar.obsTime ? metar.obsTime * 1000 : Date.now();
  return {
    id: metar.icaoId || 'UNKNOWN',
    type: 'weather',
    lat,
    lon,
    timestamp: ts,
    metadata: {
      tempC: num(metar.temp),
      dewpointC: num(metar.dewp),
      windDirDegrees: num(metar.wdir),
      windSpeedKt: num(metar.wspd),
      altimInHg: num(metar.altim),
      visibility: metar.visib,
      cover: metar.cover,
      stationName: metar.name,
      rawOb: metar.rawOb,
      observedAt: metar.reportTime,
    },
  };
}
