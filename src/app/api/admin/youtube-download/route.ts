import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const { youtubeUrl } = await req.json();

        if (!youtubeUrl || !youtubeUrl.trim()) {
            return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
        }

        // Validate YouTube URL
        if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        // Use Cobalt API for download (bypasses YouTube blocks)
        // Using a public instance (api.cobalt.tools)
        const cobaltResponse = await fetch("https://api.cobalt.tools/api/json", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                url: youtubeUrl,
                isAudioOnly: true,
                aFormat: "mp3"
            })
        });

        const cobaltData = await cobaltResponse.json();

        if (!cobaltData.url) {
            console.error("Cobalt API Error:", cobaltData);
            throw new Error(cobaltData.text || "Failed to get download link from Cobalt");
        }

        const downloadUrl = cobaltData.url;

        // Fetch the audio stream
        const audioResponse = await fetch(downloadUrl);
        if (!audioResponse.ok) throw new Error("Failed to fetch audio stream");

        // Use a default title if not available (Cobalt might not return metadata easily in this endpoint)
        const oembedUrl = `https://www.youtube.com/oembed?url=${youtubeUrl}&format=json`;
        let title = `Song ${Date.now()}`;
        try {
            const oembedRes = await fetch(oembedUrl);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                title = oembedData.title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50);
            }
        } catch (e) {
            console.log("Failed to fetch oEmbed title", e);
        }

        // Convert Web Stream to Buffer for Cloudinary upload
        const arrayBuffer = await audioResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video',
                    folder: 'power-couple-songs',
                    public_id: `song_${Date.now()}`,
                    format: 'mp3',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            url: uploadResult.secure_url,
            title: title,
            duration: uploadResult.duration,
        });
    } catch (error: any) {
        console.error("YouTube download error:", error);
        return NextResponse.json({
            error: error.message || "Failed to download YouTube audio"
        }, { status: 500 });
    }
}
