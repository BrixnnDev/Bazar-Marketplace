const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'Bazar', user: 'postgres', password: '180905',
})

async function run() {
  // Actualizar el code del admin a formato nuevo #XXXXXXXX (8 dígitos)
  await pool.query(`UPDATE users SET code='#00000001' WHERE email='admin@bazar.com'`)
  
  const r = await pool.query('SELECT id, code, username, email, role FROM users')
  console.log('✅ Usuarios actualizados:')
  r.rows.forEach(u => console.log(' ', u.code, '|', u.username, '|', u.email, '|', u.role))
  
  await pool.end()
}

run().catch(e => { console.error(e.message); pool.end() })
