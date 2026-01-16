import { NextResponse } from "next/server";
import { sendDomainNotification } from "@/lib/notifications";

export async function POST(req: Request) {
    try {
        const { email, words, user } = await req.json();

        if (!email || !words || words.length === 0) {
            return NextResponse.json({ error: "Email and words required" }, { status: 400 });
        }

        const wordListHTML = words.map((w: any, idx: number) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 12px;">${w.word}</td>
        <td style="padding: 12px; color: #6366f1;">${w.indonesian || w.hindi || 'N/A'}</td>
        <td style="padding: 12px; color: #666;">${w.meaning}</td>
      </tr>
    `).join('');

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1; text-align: center;">Your Learning Progress 📚</h1>
        <p style="font-size: 16px; color: #333;">Hi ${user},</p>
        <p style="font-size: 14px; color: #666;">
          Great job! You've collected <strong>${words.length} words</strong> during your chat session.
          Keep practicing to improve your language skills!
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background: #6366f1; color: white;">
              <th style="padding: 12px; text-align: left;">#</th>
              <th style="padding: 12px; text-align: left;">English</th>
              <th style="padding: 12px; text-align: left;">Translation</th>
              <th style="padding: 12px; text-align: left;">Meaning</th>
            </tr>
          </thead>
          <tbody>
            ${wordListHTML}
          </tbody>
        </table>
        
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
          Sent from Power Couple - Your Language Learning Bridge
        </p>
      </div>
    `;

        const result = await sendDomainNotification(
            email,
            `Your ${words.length} Learned Words from Power Couple`,
            htmlContent
        );

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Send words error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
