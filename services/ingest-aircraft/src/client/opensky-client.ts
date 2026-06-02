import axios from 'axios';
import { GeoEntity } from '@osiris/shared';

export interface OpenSkyStateVector {
  icao24: string;
  callsign?: string;
  country_name?: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  true_track: number;
  vertical_rate: number;
  sensors?: number[];
  geo_altitude?: number;
  spir?: number;
  track_rate?: number;
  roll?: number;
  magnetic_heading?: number;
}

export interface OpenSkyResponse {
  states: OpenSkyStateVector[];
}

const BASE_URL = 'https://opensky-network.org/api';

export async function fetchAircraftData(
  lamin?: number,
  lomin?: number,
  lamax?: number,
  lomax?: number
): Promise<GeoEntity[]> {
  const params: Record<string, any> = {};
  if (lamin !== undefined) params.lamin = lamin;
  if (lomin !== undefined) params.lomin = lomin;
  if (lamax !== undefined) params.lamax = lamax;
  if (lomax !== undefined) params.lomax = lomax;

  const response = await axios.get<OpenSkyResponse>(
    `${BASE_URL}/states/all`,
    { params }
  );

  return response.data.states.map(state => stateVectorToEntity(state));
}

function stateVectorToEntity(state: OpenSkyStateVector): GeoEntity {
  return {
    id: state.icao24,
    type: 'aircraft',
    lat: state.latitude,
    lon: state.longitude,
    timestamp: state.time_position * 1000,
    altitude: state.geo_altitude ?? state.baro_altitude,
    velocity: state.velocity * 3.6, // m/s to km/h
    heading: state.true_track,
    metadata: {
      callsign: state.callsign,
      onGround: state.on_ground,
      verticalRate: state.vertical_rate
    }
  };
}
