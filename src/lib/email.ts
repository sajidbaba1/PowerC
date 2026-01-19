import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendMoodEmail(to: string, partnerName: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Email not sent.");
        return;
    }

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: to,
        subject: `❤️ ${partnerName} is missing you!`,
        text: `Hey, ${partnerName} just changed their mood to "Missing You" on Power Couple. Go check in on them!`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                <h1 style="color: #ed64a6; text-align: center;">❤️ Missed You!</h1>
                <p style="font-size: 16px; color: #4a5568;">Hey there,</p>
                <p style="font-size: 16px; color: #4a5568;"><strong>${partnerName}</strong> just changed their mood to <span style="color: #ed64a6; font-weight: bold;">"Missing You"</span> on your Power Couple dashboard.</p>
                <p style="font-size: 16px; color: #4a5568;">Why not send them a sweet message or a virtual hug?</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background-color: #ed64a6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Mood email sent to ${to}`);
    } catch (error) {
        console.error("Failed to send mood email:", error);
    }
}

export async function sendActivityEmail(to: string, partnerName: string, type: "reaction" | "comment", activityText: string, emojiOrComment?: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials missing. Email not sent.");
        return;
    }

    const title = type === "reaction" ? "New Reaction!" : "New Comment!";
    const subject = type === "reaction"
        ? `❤️ ${partnerName} reacted to your activity!`
        : `💬 ${partnerName} commented on your activity!`;

    const content = type === "reaction"
        ? `<strong>${partnerName}</strong> reacted with <span style="font-size: 24px;">${emojiOrComment}</span> to: "${activityText}"`
        : `<strong>${partnerName}</strong> commented: "${emojiOrComment}" on: "${activityText}"`;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                <h1 style="color: #6366f1; text-align: center;">${title}</h1>
                <p style="font-size: 16px; color: #4a5568;">Hey there,</p>
                <p style="font-size: 16px; color: #4a5568;">${content}</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background-color: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Full Dashboard</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Activity ${type} email sent to ${to}`);
    } catch (error) {
        console.error(`Failed to send ${type} email:`, error);
    }
}
