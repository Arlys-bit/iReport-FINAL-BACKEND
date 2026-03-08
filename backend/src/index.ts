import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import liveIncidentRoutes from './routes/liveIncidentRoutes';
import studentRoutes from './routes/studentRoutes';
import buildingRoutes from './routes/buildingRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:8081').split(','),
    credentials: true,
  })
);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'iReport Backend API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/live-incidents', liveIncidentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/buildings', buildingRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
