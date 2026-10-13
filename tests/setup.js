process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-min-32-characters-long';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
