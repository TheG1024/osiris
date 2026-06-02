import axios from 'axios';
import { GeoEntity } from '@osiris/shared';

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
}

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements';

export async function fetchSatelliteTLEs(_category: string = 'active'): Promise<TLEData[]> {
  const response = await axios.get(`${CELESTRAK_BASE}/gpss.php`, {
    params: { format: 'tle' }
  });
  
  return parseTLE(response.data);
}

export function parseTLE(tleText: string): TLEData[] {
  const lines = tleText.split('\n').filter(l => l.trim());
  const tles: TLEData[] = [];
  
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      tles.push({
        name: (lines[i] ?? '').trim(),
        line1: (lines[i + 1] ?? '').trim(),
        line2: (lines[i + 2] ?? '').trim()
      });
    }
  }
  
  return tles;
}

// Simplified: real implementation would propagate TLEs to calculate positions
export function tleToEntity(tle: TLEData): GeoEntity {
  // Placeholder - would need SGP4 propagation
  return {
    id: tle.name.replace(/\s+/g, '-'),
    type: 'satellite',
    lat: 0,
    lon: 0,
    timestamp: Date.now(),
    metadata: {
      tle: tle,
      status: 'tracked'
    }
  };
}
