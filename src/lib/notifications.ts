import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendDomainNotification(email: string, subject: string, content: string) {
    if (!resend) {
        console.log("Resend API Key not set. Simulating email send to:", email);
        return { success: true, simulated: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'Power Couple Bridge <bridge@yourdomain.com>',
            to: [email],
            subject: subject,
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #6366f1;">Power Couple Notification</h1>
          <p>${content}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">This is an automated notification from your Multilingual Bridge.</p>
        </div>
      `,
        });
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error };
    }
}
