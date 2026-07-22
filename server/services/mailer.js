const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   465,
  secure: true,
  auth: {
    user: 'bxzaradmin@gmail.com',
    pass: 'ajsqcvvubgjjyfyr',
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 8000,
  greetingTimeout: 5000,
  socketTimeout: 8000,
})

/**
 * Genera un código numérico de 6 dígitos
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Envía el correo de verificación con el código
 */
async function sendVerificationEmail(toEmail, username, code) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { margin:0; padding:0; background:#0a0f0d; font-family: 'Segoe UI', sans-serif; }
      .wrap { max-width:480px; margin:40px auto; background:#0f1a14; border:1px solid rgba(0,230,118,0.15); border-radius:16px; overflow:hidden; }
      .head { background:linear-gradient(135deg,#0a1f12,#071209); padding:32px 32px 24px; text-align:center; border-bottom:1px solid rgba(0,230,118,0.1); }
      .logo { font-size:36px; font-weight:900; background:linear-gradient(135deg,#00e676,#00c853); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-1px; }
      .body { padding:32px; }
      h2 { color:#e8f5e9; font-size:20px; margin:0 0 8px; }
      p  { color:#a5d6a7; font-size:14px; line-height:1.7; margin:0 0 16px; }
      .code-box { background:rgba(0,230,118,0.08); border:2px solid rgba(0,230,118,0.3); border-radius:12px; padding:20px; text-align:center; margin:24px 0; }
      .code { font-size:42px; font-weight:900; letter-spacing:10px; color:#00e676; font-family:monospace; }
      .note { font-size:12px; color:rgba(165,214,167,0.45); margin-top:8px; }
      .foot { padding:20px 32px; border-top:1px solid rgba(0,230,118,0.08); text-align:center; }
      .foot p { color:rgba(165,214,167,0.3); font-size:11px; margin:0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="head">
        <div class="logo">Bazar</div>
        <p style="color:rgba(165,214,167,0.5);font-size:12px;margin:6px 0 0;">marketplace · colombia 🇨🇴</p>
      </div>
      <div class="body">
        <h2>¡Hola, ${username}!</h2>
        <p>Gracias por registrarte en <strong style="color:#00e676">Bazar</strong>. Para verificar tu cuenta, ingresa el siguiente código:</p>

        <div class="code-box">
          <div class="code">${code}</div>
          <p class="note">⏱ Este código expira en <strong style="color:#ffa726">10 minutos</strong></p>
        </div>

        <p>Si no creaste esta cuenta, puedes ignorar este mensaje sin problema.</p>
      </div>
      <div class="foot">
        <p>© 2026 Bazar · Colombia · No respondas a este correo</p>
      </div>
    </div>
  </body>
  </html>
  `

  await transporter.sendMail({
    from:    '"Bazar Marketplace" <bxzaradmin@gmail.com>',
    to:      toEmail,
    subject: '🔐 Código de verificación — Bazar',
    html,
    headers: {
      'List-Unsubscribe': `<mailto:bxzaradmin@gmail.com?subject=unsubscribe>`,
      'X-Mailer': 'Bazar-Marketplace',
      'Precedence': 'bulk',
      'X-Auto-Response-Suppress': 'All',
    },
    replyTo: 'bxzaradmin@gmail.com',
  })
}

module.exports = { generateCode, sendVerificationEmail, sendPasswordResetEmail }

async function sendPasswordResetEmail(toEmail, username, code) {
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { margin:0; padding:0; background:#0a0f0d; font-family: 'Segoe UI', sans-serif; }
      .wrap { max-width:480px; margin:40px auto; background:#0f1a14; border:1px solid rgba(0,230,118,0.15); border-radius:16px; overflow:hidden; }
      .head { background:linear-gradient(135deg,#0a1f12,#071209); padding:32px 32px 24px; text-align:center; border-bottom:1px solid rgba(0,230,118,0.1); }
      .logo { font-size:36px; font-weight:900; background:linear-gradient(135deg,#00e676,#00c853); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-1px; }
      .body { padding:32px; }
      h2 { color:#e8f5e9; font-size:20px; margin:0 0 8px; }
      p  { color:#a5d6a7; font-size:14px; line-height:1.7; margin:0 0 16px; }
      .code-box { background:rgba(255,167,38,0.08); border:2px solid rgba(255,167,38,0.3); border-radius:12px; padding:20px; text-align:center; margin:24px 0; }
      .code { font-size:42px; font-weight:900; letter-spacing:10px; color:#ffa726; font-family:monospace; }
      .note { font-size:12px; color:rgba(165,214,167,0.45); margin-top:8px; }
      .foot { padding:20px 32px; border-top:1px solid rgba(0,230,118,0.08); text-align:center; }
      .foot p { color:rgba(165,214,167,0.3); font-size:11px; margin:0; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="head">
        <div class="logo">Bazar</div>
        <p style="color:rgba(165,214,167,0.5);font-size:12px;margin:6px 0 0;">marketplace · colombia 🇨🇴</p>
      </div>
      <div class="body">
        <h2>Restablecer contraseña</h2>
        <p>Hola <strong style="color:#e8f5e9">${username}</strong>, recibimos una solicitud para cambiar tu contraseña en <strong style="color:#00e676">Bazar</strong>.</p>
        <p>Usa este código para continuar:</p>
        <div class="code-box">
          <div class="code">${code}</div>
          <p class="note">⏱ Expira en <strong style="color:#ffa726">10 minutos</strong></p>
        </div>
        <p>Si no solicitaste esto, ignora este mensaje. Tu contraseña no cambiará.</p>
      </div>
      <div class="foot">
        <p>© 2026 Bazar · Colombia · No respondas a este correo</p>
      </div>
    </div>
  </body>
  </html>
  `
  await transporter.sendMail({
    from:    '"Bazar Marketplace" <bxzaradmin@gmail.com>',
    to:      toEmail,
    subject: '🔑 Restablecer contraseña — Bazar',
    html,
    headers: {
      'List-Unsubscribe': `<mailto:bxzaradmin@gmail.com?subject=unsubscribe>`,
      'X-Mailer': 'Bazar-Marketplace',
      'Precedence': 'bulk',
      'X-Auto-Response-Suppress': 'All',
    },
    replyTo: 'bxzaradmin@gmail.com',
  })
}
