const { Pool } = require('pg')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'Bazar', user: 'postgres', password: '180905',
})

async function test() {
  const r    = await pool.query('SELECT * FROM users WHERE email=$1', ['admin@bazar.com'])
  const user = r.rows[0]

  const ok = await bcrypt.compare('Admin@Bazar2026', user.password_hash)
  console.log('Password match:', ok)

  if (ok) {
    const token = jwt.sign({ id: user.id, role: user.role }, 'bazar_super_secret_key_2026_xK9mP2nQ', { expiresIn: '7d' })
    console.log('✅ Login OK — Token:', token.slice(0, 40) + '...')
  }

  await pool.end()
}

test().catch(e => { console.error(e.message); pool.end() })
