const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'Bazar', user: 'postgres', password: '180905',
})

async function run() {
  // Eliminar verificaciones pendientes de ese correo
  await pool.query(`
    DELETE FROM email_verifications
    WHERE user_id IN (SELECT id FROM users WHERE email='brysnayyt@gmail.com')
  `)

  // Eliminar el usuario
  const r = await pool.query(
    `DELETE FROM users WHERE email='brysnayyt@gmail.com' RETURNING username, email`
  )

  if (r.rows.length > 0) {
    console.log('✅ Eliminado:', r.rows[0])
  } else {
    console.log('ℹ️  No se encontró ese correo en la DB')
  }

  // Ver usuarios actuales
  const users = await pool.query('SELECT id, username, email, role FROM users')
  console.log('\nUsuarios restantes:')
  users.rows.forEach(u => console.log(' -', u.username, '|', u.email, '|', u.role))

  await pool.end()
}

run().catch(e => { console.error(e.message); pool.end() })
