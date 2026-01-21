import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { keyId, key } = await req.json();

        if (!key) {
            return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }

        // Test the key
        const testResult = await testGeminiKey(key);

        // Update the database if keyId is provided
        if (keyId) {
            const prisma = getPrisma();
            await prisma.geminiKey.update({
                where: { id: keyId },
                data: {
                    lastTested: new Date(),
                    testStatus: testResult.success ? 'success' : 'failed',
                    errorMessage: testResult.error || null
                }
            });
        }

        return NextResponse.json({
            success: testResult.success,
            error: testResult.error,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error("Failed to test Gemini key:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

async function testGeminiKey(apiKey: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Translate 'Hello' to Indonesian. Respond with just the translation." }]
                    }]
                })
            }
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.error?.message || `HTTP ${response.status}`,
                responseTime
            };
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            const text = data.candidates[0]?.content?.parts?.[0]?.text;
            if (text) {
                return { success: true, responseTime };
            }
        }

        return {
            success: false,
            error: "Invalid API response structure",
            responseTime
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
        };
    }
}
