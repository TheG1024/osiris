     1|export interface RawMETAR {
     2|  stationId: string = '';
     3|  observationTime: string = '';
     4|  rawOb: string = '';
     5|}
     6|
     7|export function parseMETAR(rawOb: string): Partial<RawMETAR> {
     8|  const result: Partial<RawMETAR> = {};
     9|  
    10|  // Extract station ID (4 letters at start)
    11|  const stationMatch = rawOb.match(/^([A-Z]{4})\s/);
    12|  if (stationMatch) {
    13|    result.stationId = stationMatch[1];
    14|  }
    15|
    16|  // Extract observation time (Z indicates Zulu/UTC time)
    17|  const timeMatch = rawOb.match(/\d{6}Z/);
    18|  if (timeMatch) {
    19|    result.observationTime = timeMatch[0];
    20|  }
    21|
    22|  return result;
    23|}
    24|
    25|export function isValidMETAR(rawOb: string): boolean {
    26|  return /^[A-Z]{4}\s/.test(rawOb) && rawOb.includes('Z');
    27|}
    28|