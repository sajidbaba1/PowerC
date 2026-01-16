import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const getPrisma = (): PrismaClient => {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!url) {
        console.warn("No DATABASE_URL found. Database features will be non-functional.");
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

    const client = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
    }

    return client;
};
