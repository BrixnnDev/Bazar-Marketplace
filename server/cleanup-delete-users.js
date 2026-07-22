const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'Bazar',
  user: 'postgres',
  password: '180905',
})

async function main() {
  await pool.query('BEGIN')
  try {
    await pool.query(`DELETE FROM email_verifications
      WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@bazar.com')`)
    await pool.query(`DELETE FROM password_resets
      WHERE user_id IN (SELECT id FROM users WHERE email != 'admin@bazar.com')`)
    await pool.query(`DELETE FROM users WHERE email != 'admin@bazar.com'`)
    await pool.query('COMMIT')

    const result = await pool.query('SELECT COUNT(*) AS count FROM users')
    console.log(JSON.stringify({ remainingUsers: Number(result.rows[0].count) }))
  } catch (error) {
    await pool.query('ROLLBACK')
    throw error
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
