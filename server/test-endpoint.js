// Prueba el endpoint de login via HTTP
const http = require('http')

const body = JSON.stringify({ email: 'admin@bazar.com', password: 'Admin@Bazar2026' })

const options = {
  hostname: 'localhost',
  port:     3001,
  path:     '/api/auth/login',
  method:   'POST',
  headers:  {
    'Content-Type':   'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    const parsed = JSON.parse(data)
    if (parsed.token) {
      console.log('✅ Login exitoso!')
      console.log('   Usuario:', parsed.user.username)
      console.log('   Rol:    ', parsed.user.role)
      console.log('   Token:  ', parsed.token.slice(0, 40) + '...')
    } else {
      console.log('❌ Error:', parsed.error)
    }
  })
})

req.on('error', e => console.error('❌ Conexión fallida:', e.message))
req.write(body)
req.end()
