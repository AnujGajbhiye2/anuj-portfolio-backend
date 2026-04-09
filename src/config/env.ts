import { z } from 'zod';

// Zod parses and validates process.env at startup.
// If any required variable is missing or invalid the server exits immediately
// with a clear error rather than failing silently at runtime.
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  ADMIN_SECRET: z
    .string()
    .min(8, 'ADMIN_SECRET must be at least 8 characters'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_PATH: z.string().default('./portfolio.db'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\n❌  Invalid environment variables — server cannot start:\n');
  const errors = result.error.flatten().fieldErrors;
  for (const [key, messages] of Object.entries(errors)) {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  }
  console.error('\nCopy .env.example → .env and fill in all required values.\n');
  process.exit(1);
}

export const env = result.data;

// Convenience booleans used throughout the app
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
