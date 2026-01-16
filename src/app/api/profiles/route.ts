import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");

        if (!role) {
            return NextResponse.json({ error: "Role required" }, { status: 400 });
        }

        const prisma = getPrisma();
        let profile = await prisma.profile.findUnique({
            where: { role }
        });

        // Initialize if not exists
        if (!profile) {
            profile = await prisma.profile.create({
                data: {
                    role,
                    name: role.charAt(0).toUpperCase() + role.slice(1),
                    avatarUrl: null
                }
            });
        }

        return NextResponse.json(profile);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { role, name, avatarUrl, mood } = await req.json();

        if (!role) {
            return NextResponse.json({ error: "Role required" }, { status: 400 });
        }

        const prisma = getPrisma();
        const data: any = { name, avatarUrl };
        if (mood) {
            data.mood = mood;
            data.moodUpdatedAt = new Date();
        }

        const profile = await prisma.profile.upsert({
            where: { role },
            update: data,
            create: { role, ...data }
        });

        // Broadcast profile update
        const sorted = ["sajid", "nasywa"].sort();
        const chatKey = `${sorted[0]}-${sorted[1]}`;
        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger(chatKey, "profile-update", {
            role,
            profile
        });

        return NextResponse.json(profile);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
