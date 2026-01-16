import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET() {
    try {
        const prisma = getPrisma();
        // Try a simple count
        const count = await prisma.message.count();
        const first = await prisma.message.findFirst({ orderBy: { createdAt: 'desc' } });

        return NextResponse.json({
            status: "connected",
            messageCount: count,
            lastMessage: first,
            env: process.env.NODE_ENV,
            hasDbUrl: !!(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL)
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "error",
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
