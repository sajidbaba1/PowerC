import { NextResponse } from "next/server";

// In-memory message store (in production, use a database)
const messageStore: Record<string, any[]> = {
    "sajid-nasywa": [],
    "sajid-admin": [],
    "nasywa-admin": []
};

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
        return NextResponse.json(messageStore[chatKey] || []);
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

        if (!messageStore[chatKey]) {
            messageStore[chatKey] = [];
        }

        // Search for existing message by ID and update it, otherwise push new one
        const existingIndex = messageStore[chatKey].findIndex(m => m.id === message.id);
        if (existingIndex !== -1) {
            messageStore[chatKey][existingIndex] = message;
        } else {
            messageStore[chatKey].push(message);
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
