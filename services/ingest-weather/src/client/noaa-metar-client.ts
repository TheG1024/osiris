import axios from 'axios';
import { GeoEntity } from '@osiris/shared';

export interface METARData {
  stationId: string;
  observationTime: string;
  latitude: number;
  longitude: number;
  tempC?: number;
  dewpointC?: number;
  windDirDegrees?: number;
  windSpeedKt?: number;
  visibilityStatuteMi?: number;
  altimInHg?: number;
  flightCategory?: string;
  rawOb: string;
}

const NOAA_METAR_URL = 'https://aviationweather.gov/api/data/metar';

export async function fetchMETARData(
  stationIds?: string[],
  hours: number = 1
): Promise<METARData[]> {
  const params: Record<string, any> = {
    format: 'json',
    hours: hours.toString()
  };
  
  if (stationIds && stationIds.length > 0) {
    params.ids = stationIds.join(',');
  }

  const response = await axios.get<METARData[]>(NOAA_METAR_URL, { params });
  return response.data;
}

export function metarToEntity(metar: METARData): GeoEntity {
  return {
    id: metar.stationId,
    type: 'weather',
    lat: metar.latitude,
    lon: metar.longitude,
    timestamp: new Date(metar.observationTime).getTime(),
    metadata: {
      tempC: metar.tempC,
      dewpointC: metar.dewpointC,
      windDirDegrees: metar.windDirDegrees,
      windSpeedKt: metar.windSpeedKt,
      visibilityStatuteMi: metar.visibilityStatuteMi,
      altimInHg: metar.altimInHg,
      flightCategory: metar.flightCategory,
      rawOb: metar.rawOb
    }
  };
}
