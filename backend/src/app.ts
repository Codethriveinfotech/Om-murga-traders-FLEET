import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environmental variables BEFORE importing custom modules that rely on them
dotenv.config();

import { errorMiddleware } from './middlewares/error';
import { logger } from './utils/logger';
import notificationRoutes from './routes/notificationRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

// Rate limiter for safety
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// Configure Middlewares
app.set('trust proxy', 1); // Trust Render load balancer to get real IPs
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug Request Logger
app.use((req, res, next) => {
  console.log(`[INCOMING] ${req.method} ${req.url}`);
  next();
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', version: 'v32-vehicle-status-fix', timestamp: new Date().toISOString() });
});

import net from 'net';
app.get('/test-db-network', (req, res) => {
  const host = 'ep-young-scene-b525tips-pooler.c-7.us-east-2.aws.neon.tech';
  const port = 5432;
  const client = net.connect({ host, port, timeout: 5000 }, () => {
    res.json({ success: true, message: `Successfully connected to ${host}:${port}` });
    client.end();
  });
  client.on('error', (err) => {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  });
  client.on('timeout', () => {
    res.status(500).json({ success: false, error: 'Connection timed out' });
    client.destroy();
  });
});

import apiRoutes from './routes/api';

// API Routes (supports both with and without /api prefix)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/v1/notifications', notificationRoutes);
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Global Error Handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`FleetTrack Backend server is running on port ${PORT}`);
  });
}

export default app;
