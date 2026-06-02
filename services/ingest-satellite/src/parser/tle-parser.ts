export interface RawTLE {
  name: string;
  line1: string;
  line2: string;
}

export function validateTLE(tle: RawTLE): boolean {
  return (
    tle.name.length > 0 &&
    tle.line1.length === 69 &&
    tle.line2.length === 69
  );
}

export function extractSatelliteNumber(line1: string): string {
  return line1.substring(2, 7).trim();
}

export function extractClassification(line1: string): string {
  return line1.substring(7, 8).trim();
}

export function extractLaunchYear(line1: string): string {
  return line1.substring(9, 11).trim();
}
