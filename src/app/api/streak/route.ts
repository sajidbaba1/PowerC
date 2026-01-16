import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

// GET - Get streak data and activity heatmap
export async function GET() {
    try {
        const prisma = getPrisma();

        // Get all chat activity for the last 365 days
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

        const activities = await prisma.chatActivity.findMany({
            where: {
                date: {
                    gte: oneYearAgoStr
                }
            },
            orderBy: { date: 'asc' }
        });

        // Calculate current streak
        const today = new Date().toISOString().split('T')[0];
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Sort activities by date descending to calculate current streak
        const sortedActivities = [...activities].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Check if today or yesterday had activity to start streak
        const todayActivity = sortedActivities.find(a => a.date === today);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayActivity = sortedActivities.find(a => a.date === yesterdayStr);

        if (todayActivity && (todayActivity.sajidActive && todayActivity.nasywaActive)) {
            currentStreak = 1;
            // Count backwards from yesterday
            let checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - 1);

            for (let i = 0; i < 365; i++) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const activity = activities.find(a => a.date === dateStr);
                if (activity && activity.sajidActive && activity.nasywaActive) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        } else if (yesterdayActivity && (yesterdayActivity.sajidActive && yesterdayActivity.nasywaActive)) {
            currentStreak = 1;
            // Count backwards from day before yesterday
            let checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - 2);

            for (let i = 0; i < 365; i++) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const activity = activities.find(a => a.date === dateStr);
                if (activity && activity.sajidActive && activity.nasywaActive) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Calculate longest streak
        const sortedAsc = [...activities].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (const activity of sortedAsc) {
            if (activity.sajidActive && activity.nasywaActive) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        // Calculate total active days
        const totalActiveDays = activities.filter(a =>
            a.sajidActive && a.nasywaActive
        ).length;

        // Create heatmap data (last 365 days)
        const heatmapData: { date: string; level: number; count: number }[] = [];
        const currentDate = new Date();

        for (let i = 364; i >= 0; i--) {
            const date = new Date();
            date.setDate(currentDate.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const activity = activities.find(a => a.date === dateStr);

            let level = 0;
            if (activity) {
                if (activity.sajidActive && activity.nasywaActive) {
                    level = activity.messageCount >= 50 ? 4 :
                        activity.messageCount >= 20 ? 3 :
                            activity.messageCount >= 5 ? 2 : 1;
                } else if (activity.sajidActive || activity.nasywaActive) {
                    level = 1;
                }
            }

            heatmapData.push({
                date: dateStr,
                level,
                count: activity?.messageCount || 0
            });
        }

        return NextResponse.json({
            currentStreak,
            longestStreak,
            totalActiveDays,
            heatmapData,
            todayActive: todayActivity ? (todayActivity.sajidActive && todayActivity.nasywaActive) : false
        });
    } catch (error) {
        console.error("Error fetching streak:", error);
        return NextResponse.json({ error: "Failed to fetch streak" }, { status: 500 });
    }
}

// POST - Record chat activity for today
export async function POST(request: NextRequest) {
    try {
        const { role } = await request.json();
        const prisma = getPrisma();

        const today = new Date().toISOString().split('T')[0];

        // Upsert the activity for today
        const existingActivity = await prisma.chatActivity.findUnique({
            where: { date: today }
        });

        if (existingActivity) {
            await prisma.chatActivity.update({
                where: { date: today },
                data: {
                    sajidActive: role === "sajid" ? true : existingActivity.sajidActive,
                    nasywaActive: role === "nasywa" ? true : existingActivity.nasywaActive,
                    messageCount: { increment: 1 }
                }
            });
        } else {
            await prisma.chatActivity.create({
                data: {
                    date: today,
                    sajidActive: role === "sajid",
                    nasywaActive: role === "nasywa",
                    messageCount: 1
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error recording activity:", error);
        return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
    }
}
