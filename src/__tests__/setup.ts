// Test setup file
import 'dotenv/config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_db';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global test timeout
jest.setTimeout(10000);

// Handle circular JSON references in test output
const originalStringify = JSON.stringify;
JSON.stringify = function(value: any, replacer?: ((key: string, value: any) => any) | (string | number)[] | null, space?: string | number): string {
  const seen = new WeakSet();
  return originalStringify(value, (key, val) => {
    if (val != null && typeof val === "object") {
      if (seen.has(val)) {
        return '[Circular]';
      }
      seen.add(val);
    }
    if (typeof replacer === 'function') {
      return replacer(key, val);
    }
    return val;
  }, space);
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
}); 