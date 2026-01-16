import { PrismaClient } from "@prisma/client";

// Global variable to prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const getPrisma = (): PrismaClient => {
    // If we already have a prisma instance, return it
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    const hasUrl = !!(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);

    if (!hasUrl) {
        console.warn("No DATABASE_URL found. Database features will be non-functional.");
        // Fallback proxy to prevent crashes, but it will throw on actual calls
        const createProxy = (path: string): any => {
            return new Proxy(() => { }, {
                get: (target, prop) => {
                    if (prop === 'then') return undefined;
                    return createProxy(`${path}.${String(prop)}`);
                },
                apply: (target, thisArg, args) => {
                    throw new Error(`Database connection not configured. Please check your DATABASE_URL environment variable.`);
                }
            });
        };
        return createProxy("prisma") as unknown as PrismaClient;
    }

    // Initialize Prisma Client
    // We don't need to pass options because it reads DATABASE_URL automatically from the environment
    const client = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    // Cache the client in development
    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
    }

    return client;
};
