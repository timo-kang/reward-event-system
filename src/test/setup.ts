import { config } from 'dotenv';


config({ path: '.env.test' });


jest.setTimeout(30000);

// Mock environment variables
process.env.AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'; 