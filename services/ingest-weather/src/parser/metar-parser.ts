export interface RawMETAR {
  stationId?: string;
  observationTime?: string;
  rawOb?: string;
}

export function parseMETAR(rawOb: string): Partial<RawMETAR> {
  const result: Partial<RawMETAR> = {
    stationId: '',
    observationTime: '',
    rawOb: '',
  };
  
  const stationMatch = rawOb.match(/^([A-Z]{4})\s/);
  if (stationMatch) {
    result.stationId = stationMatch[1];
  }

  const timeMatch = rawOb.match(/\d{6}Z/);
  if (timeMatch) {
    result.observationTime = timeMatch[0];
  }

  result.rawOb = rawOb;
  
  return result;
}

export function isValidMETAR(rawOb: string): boolean {
  return /^[A-Z]{4}\s/.test(rawOb) && rawOb.includes('Z');
}
