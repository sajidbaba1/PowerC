import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    try {
        const { role, chatKey, isTyping } = await req.json();

        if (!role || !chatKey) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await pusherServer.trigger(chatKey, "typing", { role, isTyping });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
