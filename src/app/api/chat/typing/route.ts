import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    try {
        const { chatKey, user, isTyping } = await req.json();

        if (!chatKey || !user) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await pusherServer.trigger(chatKey, "typing", {
            user,
            isTyping
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
