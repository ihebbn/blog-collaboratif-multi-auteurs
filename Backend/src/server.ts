import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { User, Article, Comment } from './models';
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import commentRoutes from './routes/comments';
import { apiLimiter, securityLogger } from './middleware/security';

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
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(securityLogger);
app.use(apiLimiter);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health
let mongoConnected = false;
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', db: mongoConnected ? 'connected' : 'connecting' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

// Test endpoint to verify models
app.get('/api/test-models', async (_req: Request, res: Response) => {
  try {
    const userCount = await User.countDocuments();
    const articleCount = await Article.countDocuments();
    const commentCount = await Comment.countDocuments();
    
    res.json({
      models: 'loaded',
      counts: {
        users: userCount,
        articles: articleCount,
        comments: commentCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Models not accessible' });
  }
});

// Socket.io real-time notifications
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join article room for real-time updates
  socket.on('join-article', (articleId) => {
    socket.join(`article-${articleId}`);
    console.log(`Client ${socket.id} joined article ${articleId}`);
  });

  // Leave article room
  socket.on('leave-article', (articleId) => {
    socket.leave(`article-${articleId}`);
    console.log(`Client ${socket.id} left article ${articleId}`);
  });

  // Handle comment creation notifications
  socket.on('comment-created', (data) => {
    // Broadcast to all clients in the article room
    socket.to(`article-${data.articleId}`).emit('new-comment', data);
  });

  // Handle comment updates
  socket.on('comment-updated', (data) => {
    socket.to(`article-${data.articleId}`).emit('comment-updated', data);
  });

  // Handle comment deletion
  socket.on('comment-deleted', (data) => {
    socket.to(`article-${data.articleId}`).emit('comment-deleted', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally for use in controllers
(global as any).io = io;

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


