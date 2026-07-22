require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   'smtp.gmail.com',
  port:   587,
  secure: false,
  auth: {
    user: 'brysnayyt@gmail.com',
    pass: 'iysdawkphfhezatl',
  },
})

async function test() {
  console.log('Probando conexión SMTP...')
  await transporter.verify()
  console.log('✅ Conexión SMTP OK')

  await transporter.sendMail({
    from:    '"Bazar" <brysnayyt@gmail.com>',
    to:      'brysnayyt@gmail.com',
    subject: '🔐 Test Bazar — código de prueba',
    html:    '<h2>Código de prueba: <strong style="color:#00e676">123456</strong></h2>',
  })
  console.log('✅ Correo de prueba enviado a vortexplus.contact@gmail.com')
}

test().catch(e => console.error('❌ Error:', e.message))
