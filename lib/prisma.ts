import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL environment variable is required");

  // On Vercel each serverless function instance gets its own pool.
  // Keeping max low prevents exhausting the cloud DB's connection limit.
  const isServerless = process.env.VERCEL === "1";
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString,
      max: isServerless ? 3 : 10,
      idleTimeoutMillis: isServerless ? 10000 : 30000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: false,
      // Keep TCP connections alive so warm serverless invocations skip the
      // TCP handshake + TLS negotiation on every request (~100-300ms saved).
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

  if (!globalForPrisma.pool) globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma: PrismaClient = globalForPrisma.prisma;
