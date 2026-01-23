import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET() {
    try {
        const prisma = getPrisma();
        const profiles = await prisma.profile.findMany();
        return NextResponse.json(profiles);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
