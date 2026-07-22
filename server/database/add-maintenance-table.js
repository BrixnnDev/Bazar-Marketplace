require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  try {
    console.log('🔧 Creando tabla maintenance_settings...')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_settings (
        id         SERIAL PRIMARY KEY,
        enabled    BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Tabla creada (o ya existía)')

    await pool.query(`
      INSERT INTO maintenance_settings (id, enabled)
      VALUES (1, FALSE)
      ON CONFLICT (id) DO NOTHING;
    `)
    console.log('✅ Registro por defecto insertado')

    const r = await pool.query('SELECT * FROM maintenance_settings')
    console.log('📋 Estado actual:', r.rows)

    console.log('✅ Migración completada')
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await pool.end()
  }
}

migrate()
