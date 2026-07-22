const { Pool }  = require('pg')
const bcrypt    = require('bcryptjs')

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'Bazar', user: 'postgres', password: '180905',
})

async function run() {
  const hash = await bcrypt.hash('Admin@Bazar2026', 10)
  await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, 'admin@bazar.com'])
  console.log('✅ Hash actualizado correctamente')

  // Verificar
  const r = await pool.query('SELECT id, username, email, role, is_verified FROM users')
  console.log('Usuarios:', r.rows)
  await pool.end()
}

run().catch(e => { console.error(e.message); pool.end() })
