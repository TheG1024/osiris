import axios from 'axios';
import { GeoEntity } from '@osiris/shared';

// OpenSky /states/all returns state vectors as positional arrays.
// Index map (per OpenSky docs):
//   0: icao24, 1: callsign, 2: origin_country, 3: time_position,
//   4: last_contact, 5: longitude, 6: latitude, 7: baro_altitude,
//   8: on_ground, 9: velocity, 10: true_track, 11: vertical_rate,
//   12: sensors, 13: geo_altitude, 14: squawk, 15: spi, 16: position_source
type StateVector = (string | number | boolean | null | number[])[];

const BASE_URL = 'https://opensky-network.org/api';

export async function fetchAircraftData(
  lamin?: number,
  lomin?: number,
  lamax?: number,
  lomax?: number
): Promise<GeoEntity[]> {
  const params: Record<string, number> = {};
  if (lamin !== undefined) params.lamin = lamin;
  if (lomin !== undefined) params.lomin = lomin;
  if (lamax !== undefined) params.lamax = lamax;
  if (lomax !== undefined) params.lomax = lomax;

  const response = await axios.get<{ time: number; states: StateVector[] | null }>(
    `${BASE_URL}/states/all`,
    { params }
  );
  if (!response.data.states) return [];
  return response.data.states.map(stateVectorToEntity);
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' ? v.trim() || undefined : undefined;
}

function stateVectorToEntity(s: StateVector): GeoEntity | null {
  const lon = num(s[5]);
  const lat = num(s[6]);
  // Drop rows with no position (aircraft on ground with no GPS fix)
  if (lat === undefined || lon === undefined) return null;
  const timePos = num(s[3]);
  return {
    id: str(s[0]) || 'unknown',
    type: 'aircraft',
    lat,
    lon,
    timestamp: timePos ? timePos * 1000 : Date.now(),
    altitude: num(s[13]) ?? num(s[7]),
    velocity: num(s[9]) !== undefined ? num(s[9])! * 3.6 : undefined, // m/s → km/h
    heading: num(s[10]),
    metadata: {
      callsign: str(s[1]),
      country: str(s[2]),
      onGround: s[8] === true,
      verticalRate: num(s[11]),
    },
  };
}
