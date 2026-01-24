import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const date = searchParams.get("date");

    if (!role || !date) {
        return NextResponse.json({ error: "Missing role or date" }, { status: 400 });
    }

    try {
        const log = await prisma.healthLog.findUnique({
            where: {
                role_date: {
                    role,
                    date
                }
            },
            include: {
                comments: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        return NextResponse.json(log || { water: 0, meals: { snacks: [] }, comments: [] });
    } catch (e) {
        console.error("Failed to fetch health log", e);
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const { role, date, water, meals } = body;

    if (!role || !date) {
        return NextResponse.json({ error: "Missing role or date" }, { status: 400 });
    }

    try {
        const log = await prisma.healthLog.upsert({
            where: {
                role_date: {
                    role,
                    date
                }
            },
            update: {
                water,
                meals
            },
            create: {
                role,
                date,
                water,
                meals: meals || { snacks: [] }
            }
        });

        // Push update for real-time syncing
        if (pusherServer) {
            await pusherServer.trigger(`health-${role}`, 'update', { date, log });
        }

        return NextResponse.json(log);
    } catch (e) {
        console.error("Failed to save health log", e);
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
