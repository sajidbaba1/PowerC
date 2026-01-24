import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

const prisma = getPrisma();

export async function POST(req: Request) {
    const body = await req.json();
    const { healthLogId, text, sender } = body;

    if (!healthLogId || !text || !sender) {
        return NextResponse.json({ error: "Missing details" }, { status: 400 });
    }

    try {
        const comment = await prisma.healthComment.create({
            data: {
                healthLogId,
                text,
                sender
            }
        });

        // Fetch the full log to trigger an update event
        const log = await prisma.healthLog.findUnique({
            where: { id: healthLogId }
        });

        if (log) {
            if (pusherServer) {
                // Trigger update on the health-role channel of the log owner
                await pusherServer.trigger(`health-${log.role}`, 'comment', {
                    date: log.date,
                    comment
                });
            }
        }

        return NextResponse.json(comment);
    } catch (e) {
        console.error("Failed to add comment", e);
        return NextResponse.json({ error: "DB Error" }, { status: 500 });
    }
}
