import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrisma } from "./db";

export async function getGeminiModel() {
    let allKeys: string[] = [];

    // 1. Collect from Env keys
    const envKeys = process.env.GEMINI_API_KEYS?.split(",") || [];
    allKeys = [...allKeys, ...envKeys.map(k => k.trim()).filter(Boolean)];

    // 2. Collect from DB (with fallback/timeout)
    const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    const isLocalProxy = dbUrl?.startsWith("prisma+postgres://");
    const hasDb = !!dbUrl && !isLocalProxy;

    if (hasDb) {
        try {
            console.log("Fetching additional keys from DB...");
            const prisma = getPrisma();
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("DB Timeout")), 3000)
            );

            const dbKeys = await Promise.race([
                prisma.apiKey.findMany({
                    where: { status: "active" },
                }),
                timeout
            ]) as any[];

            if (dbKeys && Array.isArray(dbKeys)) {
                allKeys = [...allKeys, ...dbKeys.map(k => k.key)];
            }
        } catch (e: any) {
            console.warn(`DB Keys fetch failed: ${e.message}`);
        }
    }

    // 3. Selection Logic
    // REMOVED HARDCODED KEY (it was flagged as leaked). Use Vercel ENV instead.

    let apiKey = "";
    if (allKeys.length > 0) {
        // Simple rotation based on time
        const index = Math.floor(Date.now() / 1000) % allKeys.length;
        apiKey = allKeys[index];
    }

    if (!apiKey) {
        console.error("CRITICAL: No Gemini API keys found in ENV or DB.");
        throw new Error("No API keys configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Standard stable model
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function translateAndAnalyze(text: string, sourceLang: string, targetLang: string) {
    // TEMPORARILY DISABLED: Returning original text to avoid API errors/quota issues
    console.log(`Translation temporarily disabled for: "${text}"`);

    return {
        translation: text,
        hindiTranslation: "AI Logic Temporarily Offline",
        wordBreakdown: []
    };
}
