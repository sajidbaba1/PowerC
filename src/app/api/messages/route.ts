import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

function getChatKey(user1: string, user2: string) {
    const sorted = [user1, user2].sort();
    return `${sorted[0]}-${sorted[1]}`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const user1 = searchParams.get("user1");
        const user2 = searchParams.get("user2");

        if (!user1 || !user2) {
            return NextResponse.json({ error: "Both users required" }, { status: 400 });
        }

        const chatKey = getChatKey(user1, user2);
        const prisma = getPrisma();

        const messages = await prisma.message.findMany({
            where: { chatKey },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json(messages);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { user1, user2, message } = await req.json();

        if (!user1 || !user2 || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const chatKey = getChatKey(user1, user2);
        const prisma = getPrisma();

        // Check if message already exists by id (optimistic update from client)
        const existingMessage = await prisma.message.findUnique({
            where: { id: message.id }
        });

        let savedMessage;
        if (existingMessage) {
            savedMessage = await prisma.message.update({
                where: { id: message.id },
                data: {
                    translation: message.translation,
                    hindiTranslation: message.hindiTranslation,
                    wordBreakdown: message.wordBreakdown,
                    status: message.status || "sent"
                }
            });
        } else {
            savedMessage = await prisma.message.create({
                data: {
                    id: message.id,
                    text: message.text,
                    translation: message.translation,
                    hindiTranslation: message.hindiTranslation,
                    sender: message.sender,
                    receiver: user2 === message.sender ? user1 : user2, // determine receiver
                    chatKey: chatKey,
                    wordBreakdown: message.wordBreakdown,
                    status: message.status || "sent"
                }
            });
        }

        return NextResponse.json({ success: true, message: savedMessage });
    } catch (error: any) {
        console.error("POST failure:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const user1 = searchParams.get("user1");
        const user2 = searchParams.get("user2");

        if (!user1 || !user2) {
            return NextResponse.json({ error: "Both users required" }, { status: 400 });
        }

        const chatKey = getChatKey(user1, user2);
        const prisma = getPrisma();

        await prisma.message.deleteMany({
            where: { chatKey }
        });

        return NextResponse.json({ success: true, message: "Chat cleared" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
