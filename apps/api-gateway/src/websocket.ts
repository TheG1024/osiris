import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { TOPICS } from '@osiris/shared';

interface WSClient extends WebSocket {
  id: string;
  isAlive: boolean;
  subscribedTopics: Set<string>;
}

export class WebSocketBroadcaster {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as WSClient;
      client.id = Math.random().toString(36).substring(7);
      client.isAlive = true;
      client.subscribedTopics = new Set(Object.values(TOPICS));

      this.clients.set(client.id, client);
      console.log(`Client connected: ${client.id} (total: ${this.clients.size})`);

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error) {
          console.error('WS message parse error:', error);
        }
      });

      client.on('close', () => {
        this.clients.delete(client.id);
        console.log(`Client disconnected: ${client.id} (total: ${this.clients.size})`);
      });
    });

    // Heartbeat
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as WSClient;
        if (!client.isAlive) {
          client.terminate();
          this.clients.delete(client.id);
          return;
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  private handleMessage(client: WSClient, message: any) {
    if (message.type === 'subscribe' && Array.isArray(message.topics)) {
      message.topics.forEach((topic: string) => client.subscribedTopics.add(topic));
      client.send(JSON.stringify({ type: 'subscribed', topics: Array.from(client.subscribedTopics) }));
    }
  }

  broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
