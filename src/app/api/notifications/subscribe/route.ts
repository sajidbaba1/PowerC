import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { subscription, userId } = await req.json();

        if (!subscription || !userId) {
            return NextResponse.json({ error: "Missing subscription or userId" }, { status: 400 });
        }

        const prisma = getPrisma();

        // Check if subscription already exists for this endpoint
        const existing = await prisma.pushSubscription.findUnique({
            where: { endpoint: subscription.endpoint }
        });

        if (existing) {
            // Update user if changed (e.g. logging in as different user on same device)
            if (existing.userId !== userId) {
                await prisma.pushSubscription.update({
                    where: { id: existing.id },
                    data: { userId }
                });
            }
            return NextResponse.json({ success: true, message: "Subscription updated" });
        }

        // Create new subscription
        await prisma.pushSubscription.create({
            data: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        });

        return NextResponse.json({ success: true, message: "Subscription created" });
    } catch (error: any) {
        console.error("Subscription Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
