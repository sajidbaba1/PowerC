import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { cacheDel } from "@/lib/redis";

// POST /api/chat/messages/delete
// Body: { messageId, userId, chatKey, deleteForEveryone }
export async function POST(req: Request) {
    try {
        const { messageId, userId, chatKey, deleteForEveryone } = await req.json();

        if (!messageId || !userId || !chatKey) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const prisma = getPrisma();

        // 1. Fetch the message to verify ownership
        const originalMessage = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!originalMessage) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Allow both sender and receiver to delete for themselves
        if (deleteForEveryone && originalMessage.sender !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Perform Delete Operation - Parallel execution for speed
        if (deleteForEveryone) {
            // Update DB and notify via Pusher in parallel
            await Promise.all([
                prisma.message.update({
                    where: { id: messageId },
                    data: {
                        text: "This message was deleted",
                        type: "deleted",
                        imageUrl: null,
                        audioUrl: null,
                        translation: null,
                        reactions: []
                    }
                }),
                pusherServer.trigger(chatKey, "message-deleted", {
                    id: messageId,
                    deleteForEveryone: true
                }),
                cacheDel(`chat:${chatKey}`) // Invalidate Redis cache
            ]);
        } else {
            // "Delete for Me" - Just notify the client
            await Promise.all([
                pusherServer.trigger(chatKey, "message-deleted", {
                    id: messageId,
                    deleteForEveryone: false,
                    targetUser: userId
                }),
                cacheDel(`chat:${chatKey}`)
            ]);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
