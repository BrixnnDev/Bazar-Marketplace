require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id         SERIAL PRIMARY KEY,
        session_id VARCHAR(60) NOT NULL,
        user_id    INT REFERENCES users(id) ON DELETE CASCADE,
        user_code  VARCHAR(20) NOT NULL,
        username   VARCHAR(100) NOT NULL,
        user_avatar VARCHAR(10) DEFAULT '👤',
        from_role  VARCHAR(10) NOT NULL DEFAULT 'user',
        text       TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_sm_session ON support_messages(session_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_sm_user    ON support_messages(user_id)')
    await client.query('COMMIT')
    console.log('OK: tabla support_messages creada.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error:', err.message)
  } finally {
    client.release()
    process.exit(0)
  }
}
migrate()
