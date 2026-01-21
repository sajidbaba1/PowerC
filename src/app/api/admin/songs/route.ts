import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getPrisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const effect = (formData.get("effect") as string) || "none";

        if (!file || !title) {
            return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
        }

        // Convert file to base64 for Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Audio = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(base64Audio, {
            folder: "power-couple/songs",
            resource_type: "video", // Cloudinary uses "video" for audio files
        });

        // Save to database
        const prisma = getPrisma();
        const song = await prisma.playlistSong.create({
            data: {
                url: uploadResponse.secure_url,
                title,
                effect,
                chatKey: "sajid-nasywa", // Default chat key
                order: 0,
            },
        });

        return NextResponse.json({
            success: true,
            song
        });
    } catch (error: any) {
        console.error("Audio upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const prisma = getPrisma();
        const songs = await prisma.playlistSong.findMany({
            orderBy: {
                createdAt: "asc",
            },
        });
        return NextResponse.json(songs);
    } catch (error: any) {
        console.error("Fetch songs error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        const prisma = getPrisma();
        await prisma.playlistSong.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
