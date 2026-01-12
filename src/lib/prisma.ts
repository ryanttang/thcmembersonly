import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a new Prisma client instance for each request in production
// to avoid prepared statement conflicts with connection pooling
const createPrismaClient = () => {
  // Check if we're in build mode (no DATABASE_URL available or dummy value)
  const dbUrl = process.env.DATABASE_URL || '';
  const isDummyDb = dbUrl.includes('dummy') || 
                    dbUrl.includes('localhost:5432/dummy') ||
                    dbUrl === 'postgresql://dummy:dummy@localhost:5432/dummy' ||
                    !dbUrl;
  const isBuildTime = process.env.NODE_ENV === 'production' && isDummyDb;
  
  if (isBuildTime && !dbUrl) {
    console.warn('[createPrismaClient] WARNING: DATABASE_URL is missing. Using mock client. Configure GitHub Secrets to use real database.');
  }
  
  if (isBuildTime) {
    // Return a mock client for build time
    return {
      user: { count: () => Promise.resolve(0) },
      event: {
        findMany: () => Promise.resolve([]),
        findFirst: () => Promise.resolve(null),
        findUnique: () => Promise.resolve(null),
        count: () => Promise.resolve(0),
        updateMany: () => Promise.resolve({ count: 0 }),
        create: () => Promise.resolve({} as any),
        update: () => Promise.resolve({} as any),
        delete: () => Promise.resolve({} as any),
      },
      $executeRaw: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
    } as any;
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

// Always create a new client to avoid prepared statement conflicts
export const prisma = createPrismaClient();

// Helper function to set user context for RLS
export async function setUserContext(userId: string | null) {
  try {
    if (userId) {
      await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    } else {
      await prisma.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    }
  } catch (error) {
    // Log error but don't throw to avoid breaking the application
    console.error('Failed to set user context:', error);
  }
}
