import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    try {
        const { sender, receiver, type, data } = await req.json();

        if (!sender || !receiver || !type) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const chatKey = [sender, receiver].sort().join('-');

        await pusherServer.trigger(chatKey, "call-signal", {
            type,
            sender,
            data
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Signal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
