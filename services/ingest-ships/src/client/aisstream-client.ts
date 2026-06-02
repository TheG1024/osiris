import { EventEmitter } from 'events';
import { GeoEntity } from '@osiris/shared';

export interface AISMessage {
  MessageType: number;
  MMSI: number;
  Latitude?: number;
  Longitude?: number;
  SOG?: number; // Speed over ground
  COG?: number; // Course over ground
  Heading?: number;
  Timestamp: number;
}

const AISSTREAM_WS_URL = 'wss://data.aisstream.io/v1/stream';

export class AISStreamClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private messageCount = 0;
  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(AISSTREAM_WS_URL);
      
      this.ws.onopen = () => {
        console.log('Connected to AISStream');
        // Connected
        this.startSubscription();
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('AISStream connection error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.$type === 'VesselReport') {
          this.emit('message', aisMessageToEntity(message));
        }
      };

      this.ws.onclose = () => {
        console.log('AISStream connection closed');
        // Disconnected
      };
    });
  }

  private startSubscription(): void {
    // Subscribe to area (simplified - would use bounding box in production)
    const subscription = {
      apiKey: this.apiKey,
      latitudeDegreesMin: -90,
      latitudeDegreesMax: 90,
      longitudeDegreesMin: -180,
      longitudeDegreesMax: 180
    };
    this.ws?.send(JSON.stringify(subscription));
  }

  disconnect(): void {
    this.ws?.close();
    // Disconnected
  }
}

function aisMessageToEntity(msg: AISMessage): GeoEntity {
  return {
    id: msg.MMSI.toString(),
    type: 'ship',
    lat: msg.Latitude ?? 0,
    lon: msg.Longitude ?? 0,
    timestamp: msg.Timestamp,
    velocity: msg.SOG ?? 0,
    heading: msg.Heading ?? msg.COG,
    metadata: {
      mmsi: msg.MMSI,
      messageType: msg.MessageType
    }
  };
}
