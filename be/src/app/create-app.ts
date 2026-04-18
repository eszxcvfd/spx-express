import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
import path from 'path';

// Load env from project root
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  return app;
}
