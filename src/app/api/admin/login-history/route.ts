import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET() {
    try {
        const prisma = getPrisma();
        const history = await prisma.loginHistory.findMany({
            orderBy: { timestamp: "desc" },
            take: 50 // Last 50 logins
        });
        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { role } = await req.json();
        if (!role) return NextResponse.json({ error: "Role required" }, { status: 400 });

        const prisma = getPrisma();
        const entry = await prisma.loginHistory.create({
            data: { role }
        });

        return NextResponse.json(entry);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
