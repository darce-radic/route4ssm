import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { setupRoutes } from './routes';
import { logger } from './utils/logger';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    logger.info('Database connection initialized');
    
    // Setup routes
    setupRoutes(app);
    
    // Start server
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    logger.error('Error initializing database:', error);
    process.exit(1);
  }); 