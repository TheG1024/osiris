import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import routes from './routes';
import { WebSocketBroadcaster } from './websocket';

const app = express();
const server = createServer(app);
const ws = new WebSocketBroadcaster(server);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1', routes);

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Osiris API Gateway running on port ${PORT}`);
  console.log(`WebSocket server on ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
