require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INT REFERENCES users(id) ON DELETE CASCADE,
        type       VARCHAR(30) NOT NULL DEFAULT 'sistema',
        title      VARCHAR(200) NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        details    TEXT DEFAULT '',
        read       BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id)')
    await client.query('COMMIT')
    console.log('OK: tabla notifications creada.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error:', err.message)
  } finally {
    client.release()
    process.exit(0)
  }
}
migrate()
