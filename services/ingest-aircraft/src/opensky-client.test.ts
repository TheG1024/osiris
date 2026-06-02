import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { OpenSkyClient, OpenSkyConfig, OpenSkyStateVector } from './opensky-client';

vi.mock('axios');

describe('OpenSkyClient', () => {
  const mockConfig: OpenSkyConfig = {
    apiUrl: 'https://opensky-network.org/api',
    username: 'testuser',
    password: 'testpass',
  };

  let client: OpenSkyClient;
  const mockGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.create as vi.Mock).mockReturnValue({
      get: mockGet,
    });
    client = new OpenSkyClient(mockConfig);
  });

  describe('getStateVectors', () => {
    it('should fetch state vectors without bounds', async () => {
      const mockResponse = {
        states: [
          ['abc123', 'UAL123  ', 'United States', 1234567890, 1234567890, -122.5, 37.5, 10000, false, 250, 90, 0, null, 10000, '1234', false, 0, 3],
        ],
      };
      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await client.getStateVectors();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<OpenSkyStateVector>({
        icao24: 'abc123',
        callsign: 'UAL123',
        origin_country: 'United States',
        time_position: 1234567890,
        last_contact: 1234567890,
        longitude: -122.5,
        latitude: 37.5,
        baro_altitude: 10000,
        on_ground: false,
        velocity: 250,
        true_track: 90,
        vertical_rate: 0,
        sensors: null,
        geo_altitude: 10000,
        squawk: '1234',
        spi: false,
        position_source: 0,
        category: 3,
      });
    });

    it('should fetch state vectors with geographic bounds', async () => {
      const mockResponse = { states: [] };
      mockGet.mockResolvedValue({ data: mockResponse });

      await client.getStateVectors(30, 40, -130, -120);

      expect(mockGet).toHaveBeenCalledWith('/states/all', {
        params: {
          lamin: '30',
          lmax: '40',
          omin: '-130',
          omax: '-120',
        },
        auth: {
          username: 'testuser',
          password: 'testpass',
        },
      });
    });

    it('should handle empty results', async () => {
      mockGet.mockResolvedValue({ data: { states: [] } });

      const result = await client.getStateVectors();

      expect(result).toEqual([]);
    });

    it('should trim callsign whitespace', async () => {
      const mockResponse = {
        states: [
          ['abc123', '  UAL456  ', 'United States', 1234567890, 1234567890, -122.5, 37.5, 10000, false, 250, 90, 0, null, 10000, '1234', false, 0, 0],
        ],
      };
      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await client.getStateVectors();

      expect(result[0].callsign).toBe('UAL456');
    });
  });

  describe('getStateVectorByIcao', () => {
    it('should fetch single aircraft by ICAO24', async () => {
      const mockResponse = {
        states: [
          ['def456', 'DAL789  ', 'United States', 1234567890, 1234567890, -118.5, 34.5, 8000, false, 200, 180, -100, null, 8000, '7777', false, 0, 2],
        ],
      };
      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await client.getStateVectorByIcao('def456');

      expect(result).not.toBeNull();
      expect(result!.icao24).toBe('def456');
      expect(result!.callsign).toBe('DAL789');
    });

    it('should return null when aircraft not found', async () => {
      mockGet.mockResolvedValue({ data: { states: [] } });

      const result = await client.getStateVectorByIcao('nonexistent');

      expect(result).toBeNull();
    });
  });
});