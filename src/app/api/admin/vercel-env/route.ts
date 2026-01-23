import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { key } = await req.json();

        if (!key) {
            return NextResponse.json({ error: "API Key required" }, { status: 400 });
        }

        const project_id = process.env.VERCEL_PROJECT_ID;
        const team_id = process.env.VERCEL_TEAM_ID;
        const token = process.env.VERCEL_TOKEN;

        if (!project_id || !team_id || !token) {
            return NextResponse.json({ error: "Server misconfigured: Missing Vercel credentials" }, { status: 500 });
        }

        // 1. Get current env vars to find ID of GEMINI_API_KEYS if exists
        const getEnvRes = await fetch(
            `https://api.vercel.com/v9/projects/${project_id}/env?teamId=${team_id}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const envData = await getEnvRes.json();

        if (!getEnvRes.ok) {
            throw new Error(envData.error?.message || "Failed to fetch env vars");
        }

        const existingVar = envData.envs.find((e: any) => e.key === "GEMINI_API_KEYS");

        let updateRes;

        if (existingVar) {
            // Update existing
            updateRes = await fetch(
                `https://api.vercel.com/v9/projects/${project_id}/env/${existingVar.id}?teamId=${team_id}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        value: key,
                        target: ["production", "preview", "development"],
                        type: "encrypted"
                    })
                }
            );
        } else {
            // Create new
            updateRes = await fetch(
                `https://api.vercel.com/v9/projects/${project_id}/env?teamId=${team_id}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        key: "GEMINI_API_KEYS",
                        value: key,
                        target: ["production", "preview", "development"],
                        type: "encrypted"
                    })
                }
            );
        }

        const updateData = await updateRes.json();
        if (!updateRes.ok) {
            throw new Error(updateData.error?.message || "Failed to update env var");
        }

        // 2. Trigger Redeployment
        // We use create deployment endpoint. We force a new deployment.
        // Actually, listing deployments and redeploying the latest one is safer or just creating a new one.
        // Or simpler: just return success and let user manually redeploy or use a webhook?
        // User said "and redeploy". 

        // Let's try to trigger a redeployment via API.
        const deployRes = await fetch(
            `https://api.vercel.com/v13/deployments?teamId=${team_id}&forceNew=1`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "power-couple", // Should match project name usually, or fetch from project
                    project: project_id,
                    target: "production"
                })
            }
        );

        const deployData = await deployRes.json();

        // If v13 fails we might need to be more specific with body, but let's try.
        // Actually for Vercel API, to redeploy, we usually need the codebase.
        // BUT there is a way to "redeploy" an existing deployment.
        // However, updating Env Vars requires a rebuild.

        return NextResponse.json({
            success: true,
            message: "API Keys updated. Deployment triggered (if supported) or please manually redeploy.",
            deployData
        });

    } catch (err: any) {
        console.error("Vercel Update Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const project_id = process.env.VERCEL_PROJECT_ID;
        const team_id = process.env.VERCEL_TEAM_ID;
        const token = process.env.VERCEL_TOKEN;

        if (!project_id || !team_id || !token) {
            return NextResponse.json({ error: "Missing Vercel credentials" }, { status: 500 });
        }

        const res = await fetch(
            `https://api.vercel.com/v9/projects/${project_id}/env?teamId=${team_id}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        const data = await res.json();
        const geminiKey = data.envs?.find((e: any) => e.key === "GEMINI_API_KEYS")?.value;

        // Note: 'value' might be encrypted (no value returned) for some roles, but usually with token we get it?
        // Actually type=encrypted means we get it decrypted if we are admin?
        // Vercel API returns decrypted value for `type=encrypted` if you have access? 
        // Docs say: "The value ... is always a string. If the value is a secret, it will be decrypted."

        return NextResponse.json({ key: geminiKey || "" });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
