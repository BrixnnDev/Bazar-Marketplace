const { Resend } = require('resend')

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_YSs3wQAj_9bepLTYhghb9QQrWnayAZ6Rv'
const FROM_EMAIL = process.env.SMTP_USER || 'bxzaradmin@gmail.com'

let resend = null
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY)
  console.log('✅ Resend listo')
} else {
  console.error('❌ RESEND_API_KEY no configurada')
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function verificationHtml(username, code) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0f0d;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0f1a14;border:1px solid rgba(0,230,118,0.15);border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0a1f12,#071209);padding:32px;text-align:center;border-bottom:1px solid rgba(0,230,118,0.1);">
      <div style="font-size:36px;font-weight:900;background:linear-gradient(135deg,#00e676,#00c853);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Bazar</div>
      <p style="color:rgba(165,214,167,0.5);font-size:12px;margin:6px 0 0;">marketplace</p>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#e8f5e9;font-size:20px;margin:0 0 8px;">Hola, ${username}!</h2>
      <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 16px;">Tu codigo de verificacion para <strong style="color:#00e676">Bazar</strong>:</p>
      <div style="background:rgba(0,230,118,0.08);border:2px solid rgba(0,230,118,0.3);border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
        <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#00e676;font-family:monospace;">${code}</div>
        <p style="font-size:12px;color:rgba(165,214,167,0.45);margin-top:8px;">Expira en 10 minutos</p>
      </div>
      <p style="color:#a5d6a7;font-size:14px;margin:0;">Si no creaste esta cuenta, ignora este mensaje.</p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid rgba(0,230,118,0.08);text-align:center;">
      <p style="color:rgba(165,214,167,0.3);font-size:11px;margin:0;">2026 Bazar</p>
    </div>
  </div>
</body>
</html>`
}

function resetHtml(username, code) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0f0d;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#0f1a14;border:1px solid rgba(0,230,118,0.15);border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0a1f12,#071209);padding:32px;text-align:center;border-bottom:1px solid rgba(0,230,118,0.1);">
      <div style="font-size:36px;font-weight:900;background:linear-gradient(135deg,#00e676,#00c853);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Bazar</div>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#e8f5e9;font-size:20px;margin:0 0 8px;">Restablecer contrasena</h2>
      <p style="color:#a5d6a7;font-size:14px;line-height:1.7;margin:0 0 16px;">Hola <strong style="color:#e8f5e9">${username}</strong>, tu codigo para restablecer contrasena en <strong style="color:#00e676">Bazar</strong>:</p>
      <div style="background:rgba(255,167,38,0.08);border:2px solid rgba(255,167,38,0.3);border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
        <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#ffa726;font-family:monospace;">${code}</div>
        <p style="font-size:12px;color:rgba(165,214,167,0.45);margin-top:8px;">Expira en 10 minutos</p>
      </div>
      <p style="color:#a5d6a7;font-size:14px;margin:0;">Si no solicitaste esto, ignora este mensaje.</p>
    </div>
  </div>
</body>
</html>`
}

async function sendEmail(toEmail, subject, html) {
  if (!resend) throw new Error('RESEND_API_KEY no configurada en Railway')
  const { data, error } = await resend.emails.send({
    from: `Bazar <onboarding@resend.dev>`,
    to:   [toEmail],
    subject,
    html,
  })
  if (error) throw new Error(error.message)
  console.log('📧 Correo enviado:', data.id)
  return data
}

async function sendVerificationEmail(toEmail, username, code) {
  return sendEmail(toEmail, 'Codigo de verificacion - Bazar', verificationHtml(username, code))
}

async function sendPasswordResetEmail(toEmail, username, code) {
  return sendEmail(toEmail, 'Restablecer contrasena - Bazar', resetHtml(username, code))
}

module.exports = { generateCode, sendVerificationEmail, sendPasswordResetEmail }
