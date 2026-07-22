require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  try {
    console.log('🔧 Creando tabla withdrawal_requests...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id             VARCHAR(50) PRIMARY KEY,
        user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_code      VARCHAR(12),
        username       VARCHAR(50),
        user_avatar    VARCHAR(10) DEFAULT '👤',
        bank_id        VARCHAR(30) NOT NULL,
        bank_label     VARCHAR(50),
        account_number VARCHAR(30) NOT NULL,
        owner_name     VARCHAR(100),
        nit            VARCHAR(30),
        amount         NUMERIC(16,2) NOT NULL,
        status         VARCHAR(20) DEFAULT 'pending',
        processed_at   TIMESTAMP,
        created_at     TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Tabla creada')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_wr_user_id ON withdrawal_requests(user_id);
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_wr_status ON withdrawal_requests(status);
    `)
    console.log('✅ Índices creados')

    console.log('✅ Migración completada')
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await pool.end()
  }
}

migrate()
