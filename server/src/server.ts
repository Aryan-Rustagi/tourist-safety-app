import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setSOSSocketIO } from './controllers/sosController.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import sosRoutes from './routes/sosRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import safetyZoneRoutes from './routes/safetyZoneRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import smsWebhookRoutes from './routes/smsWebhookRoutes.js';
import redZoneRoutes from './routes/redZoneRoutes.js';
import riskZoneRoutes from './routes/riskZoneRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import smsRoutes from './routes/smsRoutes.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean);

const defaultAllowed = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://tourist-safety-client.onrender.com',
  'https://admin-dashboard-shrd.onrender.com',
];

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [...new Set([...allowedOrigins, ...defaultAllowed])],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
});

setSOSSocketIO(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join_responders', () => {
    socket.join('responders_channel');
    console.log(`[Socket.io] Socket ${socket.id} joined responders channel`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(
  cors({
    origin: [...new Set([...allowedOrigins, ...defaultAllowed])],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Tourist Safety MERN Backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/safety-zones', safetyZoneRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/sms-webhook', smsWebhookRoutes);
app.use('/api/red-zones', redZoneRoutes);
app.use('/api/risk-zones', riskZoneRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/sms', smsRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server & Connect to DB
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`===========================================`);
      console.log(`🚀 Tourist Safety API running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`===========================================`);
    });
  } catch (error) {
    console.error(`[Server] Startup aborted: ${(error as Error).message}`);
    process.exitCode = 1;
  }
};

startServer();

export { app, server, io };
