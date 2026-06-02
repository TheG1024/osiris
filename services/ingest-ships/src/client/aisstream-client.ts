import { EventEmitter } from 'events';
import { GeoEntity } from '@osiris/shared';

interface AisMessage {
  MMSI: number;
  Lat: number;
  Lon: number;
  SOG?: number;
  COG?: number;
  Heading?: number;
  MessageType: number;
}

export class AisStreamClient extends EventEmitter {
  // private messageCount = 0; // reserved for future use

  constructor() {
    super();
  }

  async connect(): Promise<void> {
    // Mock connection for now
    console.log('AIS Stream connected');
  }

  async disconnect(): Promise<void> {
    console.log('AIS Stream disconnected');
  }

  async startListening(handler: (entity: GeoEntity) => void): Promise<void> {
      // Mock implementation
      this.on('message', (msg: AisMessage) => {
        const entity: GeoEntity = {
          id: msg.MMSI.toString(),
          type: 'ship' as const,
          lat: msg.Lat,
          lon: msg.Lon,
          timestamp: Date.now(),
          velocity: msg.SOG ?? 0,
          heading: msg.Heading ?? msg.COG ?? 0,
          metadata: {
            mmsi: msg.MMSI,
            messageType: msg.MessageType,
          },
        };
        handler(entity);
      });
    }
}
