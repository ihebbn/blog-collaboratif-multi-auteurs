import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();
console.log('Environment loaded:', {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ? 'SET' : 'NOT SET',
  NODE_ENV: process.env.NODE_ENV
});

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health
let mongoConnected = false;
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', db: mongoConnected ? 'connected' : 'connecting' });
});

// Socket.io basic wiring
io.on('connection', (socket) => {
  socket.emit('connected', { id: socket.id });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// Bootstrap
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog';

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log('Connecting to MongoDB...');
  // Show redacted connection string to verify .env is loaded and host is correct
  try {
    const redacted = String(MONGO_URI).replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    // eslint-disable-next-line no-console
    console.log('Mongo URI (redacted):', redacted);
  } catch (_) {
    // ignore
  }
});

// Connection event diagnostics
mongoose.connection.on('connected', () => {
  // eslint-disable-next-line no-console
  console.log('Mongoose event: connected');
});
mongoose.connection.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Mongoose event: error ->', err?.message || err);
});
mongoose.connection.on('disconnected', () => {
  // eslint-disable-next-line no-console
  console.log('Mongoose event: disconnected');
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    mongoConnected = true;
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to MongoDB:', err?.message || err);
  });


