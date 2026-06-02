import { GeoEntity } from '@osiris/shared';

export interface RawADS_BMessage {
  timestamp: number;
  icao24: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  velocity?: number;
  heading?: number;
  onGround?: boolean;
  rawHex: string;
}

export function parseADS_BMessage(message: RawADS_BMessage): GeoEntity | null {
  if (!message.latitude || !message.longitude) {
    return null;
  }

  return {
    id: message.icao24,
    type: 'aircraft',
    lat: message.latitude,
    lon: message.longitude,
    timestamp: message.timestamp,
    altitude: message.altitude,
    velocity: message.velocity,
    heading: message.heading,
    metadata: {
      onGround: message.onGround ?? false
    }
  };
}

export function isValidADS_BMessage(message: RawADS_BMessage): boolean {
  return (
    message.icao24.length === 6 &&
    message.timestamp > 0 &&
    message.latitude !== undefined &&
    message.latitude >= -90 &&
    message.latitude <= 90 &&
    message.longitude !== undefined &&
    message.longitude >= -180 &&
    message.longitude <= 180
  );
}
