import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { getPrisma } from "@/lib/db";
import { kafka, KAFKA_TOPICS } from "@/lib/kafka";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const chatKey = searchParams.get("chatKey");
        const prisma = getPrisma();

        if (!chatKey) return NextResponse.json({ error: "Missing chatKey" }, { status: 400 });

        const songs = await prisma.playlistSong.findMany({
            where: { chatKey },
            orderBy: { order: 'asc' }
        });

        const playlist = songs.map(s => ({
            id: s.id,
            url: s.url,
            title: s.title,
            effect: s.effect
        }));

        return NextResponse.json({ playlist });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { chatKey, playlist } = body;

        // Handle both index/currentIndex and isPlaying/playing
        const index = body.index !== undefined ? body.index : body.currentIndex;
        const isPlaying = body.isPlaying !== undefined ? body.isPlaying : body.playing;

        const prisma = getPrisma();

        if (!chatKey) {
            return NextResponse.json({ error: "Missing chatKey" }, { status: 400 });
        }

        // Broadcast update via Pusher (including the playlist for instant sync)
        await pusherServer.trigger(chatKey, "music-update", {
            playlist,
            index,
            isPlaying,
            effect: body.effect,
            sajidVolume: body.sajidVolume,
            nasywaVolume: body.nasywaVolume
        });

        // Log to Kafka (Asynchronous)
        kafka.publish(KAFKA_TOPICS.VIBE_EVENTS, {
            chatKey,
            index,
            isPlaying,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Music API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
