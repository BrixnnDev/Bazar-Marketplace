/**
 * Migración: crea la tabla `recharge_requests` en PostgreSQL
 * Ejecutar: node server/database/add-recharges-table.js
 */
require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS recharge_requests (
        id             VARCHAR(40) PRIMARY KEY,
        user_id        INT REFERENCES users(id) ON DELETE CASCADE,
        user_code      VARCHAR(20) NOT NULL,
        username       VARCHAR(100) NOT NULL,
        user_avatar    VARCHAR(10) DEFAULT '👤',
        account_name   VARCHAR(100) NOT NULL,
        account_number VARCHAR(80) NOT NULL,
        amount         NUMERIC(16,2) NOT NULL,
        type           VARCHAR(20) NOT NULL DEFAULT 'balance',
        method         VARCHAR(30) NOT NULL DEFAULT 'nequi',
        img_preview    TEXT,
        status         VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMP DEFAULT NOW(),
        processed_at   TIMESTAMP
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_rr_user_code ON recharge_requests(user_code)`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rr_status   ON recharge_requests(status)`)

    await client.query('COMMIT')
    console.log('✅ Tabla recharge_requests creada correctamente.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migración:', err.message)
  } finally {
    client.release()
    process.exit(0)
  }
}

migrate()
