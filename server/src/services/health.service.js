import { testDbConnection } from '../config/db.js';

export const getHealthStatus = async () => {
  const dbStatus = await testDbConnection();

  return {
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
      details: dbStatus.message,
      ...(dbStatus.timestamp && { serverTime: dbStatus.timestamp }),
    },
  };
};
