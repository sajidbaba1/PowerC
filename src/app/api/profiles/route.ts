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
        const { role, name, avatarUrl, mood, expoPushToken, hometown, country } = await req.json();

        if (!role) {
            return NextResponse.json({ error: "Role required" }, { status: 400 });
        }

        const prisma = getPrisma();
        const data: any = {};
        if (name) data.name = name;
        if (avatarUrl) data.avatarUrl = avatarUrl;
        if (mood) {
            data.mood = mood;
            data.moodUpdatedAt = new Date();
            console.log('📊 Mood Update Received:', { role, mood, timestamp: new Date().toISOString() });
        }
        if (expoPushToken) data.expoPushToken = expoPushToken;
        if (hometown) data.hometown = hometown;
        if (country) data.country = country;

        const profile = await prisma.profile.upsert({
            where: { role },
            update: data,
            create: {
                role,
                name: name || (role === 'sajid' ? 'Sajid' : 'Nasywa'),
                avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${role}&background=random`,
                ...data
            }
        });

        // Trigger email if mood is "Miss You" or "Missing You"
        if (mood && (mood.toLowerCase().includes("miss you") || mood.toLowerCase().includes("missing you"))) {
            console.log('💌 Mood contains "miss you" - Triggering email...');
            console.log('   Role:', role);
            console.log('   Mood:', mood);

            const { sendMoodEmail } = await import("@/lib/email");
            const recipientEmail = role === "nasywa" ? "ss2727303@gmail.com" : "nasywanazhifariyandi@gmail.com";
            const partnerName = role === "nasywa" ? "Nasywa" : "Sajid";

            console.log('   Recipient:', recipientEmail);
            console.log('   Partner Name:', partnerName);
            console.log('   SMTP User:', process.env.SMTP_USER ? '✅ Set' : '❌ Missing');
            console.log('   SMTP Pass:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');

            // We fire and forget the email to not block the response
            sendMoodEmail(recipientEmail, partnerName)
                .then(() => console.log('✅ Mood email sent successfully to', recipientEmail))
                .catch(err => console.error('❌ Mood email failed:', err));
        } else if (mood) {
            console.log('ℹ️ Mood update does not trigger email:', mood);
        }

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
