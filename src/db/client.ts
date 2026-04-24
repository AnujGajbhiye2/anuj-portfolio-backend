import { PrismaClient } from "@prisma/client";

// Singleton — reuse the same PrismaClient instance across the process.
// In dev (tsx watch), hot reloads can create multiple instances without this guard.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
