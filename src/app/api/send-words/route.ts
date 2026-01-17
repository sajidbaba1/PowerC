import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { email, words, user, targetLang } = await req.json();

    if (!email || !words || words.length === 0) {
      return NextResponse.json({ error: "Email and words required" }, { status: 400 });
    }

    const tableRows = words.map((w: any, idx: number) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px; font-size: 14px; color: #64748b;">#${idx + 1}</td>
                <td style="padding: 12px; font-size: 15px; font-weight: 600; color: #1e293b;">${w.word}</td>
                <td style="padding: 12px; font-size: 15px; color: #818cf8; font-weight: 500;">${w.indonesian || w.hindi || w.translation || 'N/A'}</td>
                <td style="padding: 12px; font-size: 14px; color: #475569; line-height: 1.4;">${w.meaning}</td>
            </tr>
        `).join('');

    const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px;">
                <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%); padding: 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Power Couple Learning</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Your vocabulary collection for ${targetLang}</p>
                    </div>
                    
                    <div style="padding: 32px;">
                        <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">Hi <strong>${user}</strong>,</p>
                        <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 32px;">
                            Amazing progress! You've collected <strong>${words.length}</strong> new words during your recent chat session. Here is your personalized study list:
                        </p>
                        
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; min-width: 400px;">
                                <thead>
                                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Pos</th>
                                        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">English</th>
                                        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Translation</th>
                                        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em;">Meaning</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </div>
                        
                        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="font-size: 14px; color: #94a3b8; font-style: italic;">"The more you chat, the more you learn!"</p>
                        </div>
                    </div>
                </div>
                
                <p style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
                    This email was sent from your Power Couple App.<br/>
                    Keep building your bridge! ❤️
                </p>
            </div>
        `;

    if (!resend) {
      console.log("Resend API Key not set. Simulating email send to:", email);
      console.log("Words:", words.length);
      return NextResponse.json({ success: true, simulated: true });
    }

    await resend.emails.send({
      from: 'Power Couple Learning <onboarding@resend.dev>',
      to: [email],
      subject: `📚 Your ${words.length} Learned Words from Power Couple`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Send words error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
