import axios, { AxiosInstance } from 'axios';

/**
 * OpenSky Network API client
 * @see https://opensky-network.org/apidoc/
 */
export interface OpenSkyConfig {
  username?: string;
  password?: string;
  apiUrl: string;
}

export interface OpenSkyStateVector {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  true_track: number;
  vertical_rate: number;
  sensors: number[] | null;
  geo_altitude: number;
  squawk: string;
  spi: boolean;
  position_source: number;
  category: number;
}

export interface OpenSkyResponse {
  states: OpenSkyStateVector[][];
}

/**
 * OpenSky API Client
 */
export class OpenSkyClient {
  private client: AxiosInstance;
  private username?: string;
  private password?: string;

  constructor(config: OpenSkyConfig) {
    this.username = config.username;
    this.password = config.password;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 10000,
    });
  }

  /**
   * Fetch all state vectors (aircraft positions)
   */
  async getStateVectors(lamin?: number[], lmax?: number[], omin?: number[], omax?: number[]): Promise<OpenSkyStateVector[]> {
    const params: Record<string, string> = {};
    if (lamin !== undefined && lmax !== undefined && omin !== undefined && omax !== undefined) {
      params.lamin = lamin.toString();
      params.lmax = lmax.toString();
      params.omin = omin.toString();
      params.omax = omax.toString();
    }

    const response = await this.client.get<OpenSkyResponse>('/states/all', {
      params,
      auth: this.username && this.password ? {
        username: this.username,
        password: this.password,
      } : undefined,
    });

    return response.data.states.map(state => ({
      icao24: state[0],
      callsign: state[1].trim(),
      origin_country: state[2],
      time_position: state[3],
      last_contact: state[4],
      longitude: state[5],
      latitude: state[6],
      baro_altitude: state[7],
      on_ground: state[8],
      velocity: state[9],
      true_track: state[10],
      vertical_rate: state[11],
      sensors: state[12],
      geo_altitude: state[13],
      squawk: state[14],
      spi: state[15],
      position_source: state[16],
      category: state[17] ?? 0,
    }));
  }

  /**
   * Fetch state vectors for specific aircraft by ICAO24
   */
  async getStateVectorByIcao(icao24: string): Promise<OpenSkyStateVector | null> {
    const response = await this.client.get<OpenSkyResponse>(`/states/all?icao24=${icao24}`, {
      auth: this.username && this.password ? {
        username: this.username,
        password: this.password,
      } : undefined,
    });

    if (response.data.states.length === 0) {
      return null;
    }

    const state = response.data.states[0];
    return {
      icao24: state[0],
      callsign: state[1].trim(),
      origin_country: state[2],
      time_position: state[3],
      last_contact: state[4],
      longitude: state[5],
      latitude: state[6],
      baro_altitude: state[7],
      on_ground: state[8],
      velocity: state[9],
      true_track: state[10],
      vertical_rate: state[11],
      sensors: state[12],
      geo_altitude: state[13],
      squawk: state[14],
      spi: state[15],
      position_source: state[16],
      category: state[17] ?? 0,
    };
  }
}