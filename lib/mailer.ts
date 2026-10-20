import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "no-reply@barasystem.my.id";
const APP_NAME = "Cekbar";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"${APP_NAME}" <${FROM}>`,
    to,
    subject,
    html,
  });
}

export function resetPasswordEmail(token: string, baseUrl: string) {
  const url = `${baseUrl}/reset-password?token=${token}`;
  return {
    subject: `Reset Password — ${APP_NAME}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 22px;">Reset Password</h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Anda menerima email ini karena ada permintaan reset password untuk akun ${APP_NAME} Anda.
          Klik tombol di bawah untuk membuat password baru:
        </p>
        <a href="${url}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 32px; border-radius: 10px;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; line-height: 1.5;">
          Link ini berlaku selama 1 jam. Jika Anda tidak merasa meminta reset password, abaikan email ini.
        </p>
      </div>
    `,
  };
}

export function verificationOtpEmail(otp: string) {
  return {
    subject: `Kode Verifikasi — ${APP_NAME}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
        <h2 style="margin: 0 0 8px; color: #0f172a; font-size: 22px;">Verifikasi Email</h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Gunakan kode berikut untuk menyelesaikan registrasi akun ${APP_NAME} Anda:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background: #1e293b; color: #fff; font-size: 32px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; line-height: 1.5;">
          Kode ini berlaku selama 10 menit. Jika Anda tidak mendaftar di ${APP_NAME}, abaikan email ini.
        </p>
      </div>
    `,
  };
}
