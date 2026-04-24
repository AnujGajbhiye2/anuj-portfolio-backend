// These must be set before any module that imports env.ts is loaded.
// Vitest runs setupFiles before test files, so this block executes first.
// env.ts calls process.exit(1) at import time if any var is missing.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.ADMIN_SECRET = "test-admin-secret-12345";
process.env.ADMIN_PASSWORD = "test-password-12345";
process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars!!";
process.env.CORS_ORIGIN = "http://localhost:3000";
