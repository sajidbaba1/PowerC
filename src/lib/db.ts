import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const getPrisma = (): PrismaClient => {
    const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

    if (!url) {
        const createProxy = (path: string): any => {
            return new Proxy(() => { }, {
                get: (target, prop) => {
                    if (prop === 'then') return undefined;
                    return createProxy(`${path}.${String(prop)}`);
                },
                apply: () => {
                    throw new Error(`Database connection not configured. Please check your DATABASE_URL environment variable.`);
                }
            });
        };
        return createProxy("prisma") as unknown as PrismaClient;
    }

    if (!globalForPrisma.prisma) {
        const pool = new Pool({ connectionString: url });
        const adapter = new PrismaPg(pool);
        globalForPrisma.prisma = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        });
    }

    return globalForPrisma.prisma;
};
