import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.test file
config({ path: join(__dirname, '../.env.test') });

// Set default timeout for all tests
jest.setTimeout(30000);

// Define environment variable types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AUTH_SERVICE_URL: string;
      EVENT_SERVICE_URL: string;
      JWT_SECRET: string;
      MONGODB_URI: string;
      PORT: string;
      NODE_ENV: string;
    }
  }
}

// Set default environment variables for testing
const defaultEnv = {
  AUTH_SERVICE_URL: 'http://localhost:3001',
  EVENT_SERVICE_URL: 'http://localhost:3002',
  JWT_SECRET: 'test-secret',
  MONGODB_URI: 'mongodb://localhost:27017/test',
  PORT: '3000',
  NODE_ENV: 'test',
};

// Set environment variables with defaults
Object.entries(defaultEnv).forEach(([key, value]) => {
  process.env[key] = process.env[key] || value;
});

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}; 