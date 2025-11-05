import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationCode(email, code) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Tu código de verificación',
      text: `Tu código es: ${code}\n\nExpira en 3 minutos.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.response);
  } catch (err) {
    console.error('❌ Error al enviar correo:', err);
  }
}
