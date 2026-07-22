/**
 * Migración: crea la tabla `purchases` en PostgreSQL
 * Ejecutar: node server/database/add-purchases-table.js
 */
require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id           SERIAL PRIMARY KEY,
        buyer_id     INT REFERENCES users(id) ON DELETE SET NULL,
        buyer_code   VARCHAR(20) NOT NULL,
        product_id   INT,
        product_name VARCHAR(200) NOT NULL,
        product_emoji VARCHAR(10) DEFAULT '📦',
        category     VARCHAR(50) DEFAULT 'otro',
        category_label VARCHAR(80) DEFAULT 'Otro',
        price        NUMERIC(16,2) NOT NULL,
        seller       VARCHAR(100) NOT NULL DEFAULT 'Administrador',
        seller_id    VARCHAR(50)  NOT NULL DEFAULT 'admin',
        status       VARCHAR(20)  NOT NULL DEFAULT 'disponible',
        for_sale     BOOLEAN DEFAULT FALSE,
        sale_price   NUMERIC(16,2),
        description  TEXT DEFAULT '',
        created_at   TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_code)`)

    await client.query('COMMIT')
    console.log('✅ Tabla purchases creada correctamente.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migración:', err.message)
  } finally {
    client.release()
    process.exit(0)
  }
}

migrate()
