import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

// GET: Fetch all Gemini API keys
export async function GET() {
    try {
        const prisma = getPrisma();
        const keys = await prisma.geminiKey.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(keys);
    } catch (error: any) {
        console.error("Failed to fetch Gemini keys:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a new Gemini API key
export async function POST(req: Request) {
    try {
        const { key, label } = await req.json();

        if (!key || !key.trim()) {
            return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }

        const prisma = getPrisma();

        // Test the key before adding
        const testResult = await testGeminiKey(key);

        if (!testResult.success) {
            return NextResponse.json({
                error: "API key test failed",
                details: testResult.error
            }, { status: 400 });
        }

        const newKey = await prisma.geminiKey.create({
            data: {
                key: key.trim(),
                label: label || `Key ${Date.now()}`,
                isActive: false,
                lastTested: new Date(),
                testStatus: 'success'
            }
        });

        return NextResponse.json(newKey);
    } catch (error: any) {
        console.error("Failed to add Gemini key:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update key status or set as active
export async function PATCH(req: Request) {
    try {
        const { id, isActive } = await req.json();

        const prisma = getPrisma();

        if (isActive) {
            // Deactivate all other keys first
            await prisma.geminiKey.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const updatedKey = await prisma.geminiKey.update({
            where: { id },
            data: { isActive }
        });

        return NextResponse.json(updatedKey);
    } catch (error: any) {
        console.error("Failed to update Gemini key:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove a Gemini API key
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
        }

        const prisma = getPrisma();
        await prisma.geminiKey.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete Gemini key:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper function to test a Gemini API key
async function testGeminiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Hello, this is a test. Please respond with 'OK'." }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.error?.message || "API key validation failed"
            };
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            return { success: true };
        }

        return { success: false, error: "Unexpected API response format" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
