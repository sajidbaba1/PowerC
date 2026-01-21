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
                error: testResult.error || "API key test failed",
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
// Helper function to test a Gemini API key
async function testGeminiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Use listModels to validate key without guessing model names
        // distinctively cleaner and more robust
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
            { method: "GET" }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error?.message || `HTTP ${response.status} from Google`
            };
        }

        const data = await response.json();
        if (!data.models) {
            return { success: false, error: "Invalid response format from Google (no models found)" };
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
