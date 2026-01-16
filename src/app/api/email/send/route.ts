import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { to, subject, content, userName } = await req.json();

        if (!to || !content) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const appName = process.env.APP_NAME || "Event";

        const mailOptions = {
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject || `${appName} - Word List for ${userName || 'User'}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: white; border-radius: 16px;">
                    <h2 style="color: #818cf8; margin-bottom: 20px;">${appName} - Your Vocabulary List</h2>
                    <p>Hello,</p>
                    <p>Here are the words you've collected during your language learning journey:</p>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-top: 20px;">
                        ${content}
                    </div>
                    <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">
                        Keep practicing! <br>
                        Sent from ${appName} App
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Email Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
