/**
 * Migración: crea la tabla `products` en PostgreSQL
 * Ejecutar una sola vez: node server/database/add-products-table.js
 */
require('dotenv').config()
const pool = require('../config/db')

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(200) NOT NULL,
        category      VARCHAR(50)  NOT NULL DEFAULT 'otro',
        category_label VARCHAR(80) NOT NULL DEFAULT 'Otro',
        price         NUMERIC(16,2) NOT NULL DEFAULT 0,
        stock         INTEGER NOT NULL DEFAULT 0,
        visible       BOOLEAN NOT NULL DEFAULT TRUE,
        emoji         VARCHAR(10)  NOT NULL DEFAULT '📦',
        description   TEXT NOT NULL DEFAULT '',
        seller        VARCHAR(100) NOT NULL DEFAULT 'Administrador',
        seller_id     VARCHAR(50)  NOT NULL DEFAULT 'admin',
        rating        NUMERIC(3,1) NOT NULL DEFAULT 4.8,
        sales         INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      )
    `)

    /* Trigger para updated_at automático */
    await client.query(`
      CREATE OR REPLACE FUNCTION set_products_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `)

    await client.query(`
      DROP TRIGGER IF EXISTS trg_products_updated ON products
    `)

    await client.query(`
      CREATE TRIGGER trg_products_updated
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE FUNCTION set_products_updated_at()
    `)

    await client.query('COMMIT')
    console.log('✅ Tabla products creada correctamente.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error en migración:', err.message)
  } finally {
    client.release()
    process.exit(0)
  }
}

migrate()
