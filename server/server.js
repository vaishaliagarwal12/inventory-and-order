import dotenv from 'dotenv';
import app from './src/app.js';
import { testDbConnection } from './src/config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting Inventory & Order Management API Server...');
  
  // Test PostgreSQL connection on server startup
  const dbStatus = await testDbConnection();
  if (dbStatus.connected) {
    console.log(`✅ [Database] ${dbStatus.message}`);
  } else {
    console.warn(`⚠️ [Database] ${dbStatus.message}`);
    console.warn('   Server will start, but database operations may fail until connection is configured.');
  }

  app.listen(PORT, () => {
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔍 Health Check endpoint: http://localhost:${PORT}/api/health`);
    console.log('----------------------------------------------------');
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
