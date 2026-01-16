import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET() {
    try {
        const prisma = getPrisma();
        const keys = await prisma.apiKey.findMany({
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(keys);
    } catch (error: any) {
        console.log("Database not connected, returning empty array");
        return NextResponse.json([]);
    }
}

export async function POST(req: Request) {
    try {
        const { key } = await req.json();
        if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });

        const prisma = getPrisma();
        const newKey = await prisma.apiKey.create({
            data: { key, status: "active" }
        });
        return NextResponse.json(newKey);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        const prisma = getPrisma();
        await prisma.apiKey.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
