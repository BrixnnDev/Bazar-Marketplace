const { Pool } = require('pg')
const pool = new Pool({ host:'localhost', port:5432, database:'Bazar', user:'postgres', password:'180905' })

async function run() {
  await pool.query(`DELETE FROM email_verifications WHERE user_id IN (SELECT id FROM users WHERE role='usuario')`)
  const r = await pool.query(`DELETE FROM users WHERE role='usuario' RETURNING username, email`)
  r.rows.forEach(u => console.log('✅ Eliminado:', u.username, u.email))
  if (r.rows.length === 0) console.log('ℹ️  No había usuarios de prueba')
  const users = await pool.query('SELECT username, email, role FROM users')
  console.log('\nUsuarios restantes:')
  users.rows.forEach(u => console.log(' -', u.username, u.email, u.role))
  await pool.end()
}
run().catch(e => { console.error(e.message); pool.end() })
