const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'Bazar', user: 'postgres', password: '180905',
})

async function run() {
  console.log('Agregando columnas de perfil...')

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100)`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS doc_type VARCHAR(20)`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS doc_number VARCHAR(30)`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(80)`)


  /* El admin ya tiene perfil completo */
  await pool.query(`UPDATE users SET profile_completed=true WHERE role='administrador'`)

  console.log('✅ Columnas agregadas correctamente')

  const r = await pool.query('SELECT id, username, email, role, profile_completed FROM users')
  console.log('Usuarios:')
  r.rows.forEach(u => console.log(' ', u.username, '|', u.role, '| perfil completo:', u.profile_completed))

  await pool.end()
}

run().catch(e => { console.error(e.message); pool.end() })
