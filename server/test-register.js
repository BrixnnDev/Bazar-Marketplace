const http = require('http')

const body = JSON.stringify({
  username: 'testuser',
  email:    'brysnayyt@gmail.com',
  password: 'Test123456'
})

const options = {
  hostname: 'localhost', port: 3001,
  path: '/api/auth/register', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
}

const req = http.request(options, (res) => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => {
    console.log('Status:', res.statusCode)
    const d = JSON.parse(data)
    console.log(d)
    if (d.devCode) console.log('\n⚠️  Código (correo no enviado):', d.devCode)
  })
})
req.on('error', e => console.error('❌', e.message))
req.write(body)
req.end()
