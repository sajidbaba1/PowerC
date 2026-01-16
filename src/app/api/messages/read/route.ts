import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    try {
        const { messageIds, chatKey } = await req.json();

        if (!messageIds || !Array.isArray(messageIds) || !chatKey) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const prisma = getPrisma();

        await prisma.message.updateMany({
            where: {
                id: { in: messageIds },
                status: { not: "seen" }
            },
            data: {
                status: "seen"
            }
        });

        // Notify the sender that messages were seen
        await pusherServer.trigger(chatKey, "messages-seen", {
            messageIds
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
