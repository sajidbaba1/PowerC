import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
    try {
        const { activityId, text, user } = await req.json();
        const prisma = getPrisma();

        const comment = await prisma.activityComment.create({
            data: {
                activityId,
                sender: user,
                text
            }
        });

        // Return the updated activity to ensure client has full state
        const activity = await prisma.activity.findUnique({
            where: { id: activityId },
            include: { comments: { orderBy: { createdAt: 'asc' } } }
        });

        if (activity) {
            const channelName = `activities-${activity.date}`;
            await pusherServer.trigger(channelName, "update-activity", activity);
        }

        return NextResponse.json(comment);
    } catch (e: any) {
        console.error("Comment Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
