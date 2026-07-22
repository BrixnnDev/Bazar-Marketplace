/**
 * SETUP DE BASE DE DATOS — crea todas las tablas necesarias
 * Ejecutar: node database/setup.js
 * Ahora soporta DATABASE_URL (Railway) o credenciales locales
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { Pool } = require('pg')

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'Bazar',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '180905',
    })

async function setup() {
  console.log('🔌 Conectando a PostgreSQL...')

  try {
    await pool.query('SELECT 1')
    console.log('✅ Conexión exitosa\n')
  } catch (err) {
    console.error('❌ No se pudo conectar:', err.message)
    process.exit(1)
  }

  try {
    // 1. ENUM
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('administrador', 'vendedor', 'comprador', 'usuario');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    console.log('✓ user_role')

    // 2. users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        code          VARCHAR(12) UNIQUE NOT NULL,
        username      VARCHAR(50) UNIQUE NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          user_role DEFAULT 'usuario',
        avatar        VARCHAR(10) DEFAULT '👤',
        full_name     VARCHAR(100),
        doc_type      VARCHAR(20),
        doc_number    VARCHAR(30),
        phone         VARCHAR(20),
        city          VARCHAR(50),
        profile_completed BOOLEAN DEFAULT FALSE,
        nequi         VARCHAR(20),
        balance       NUMERIC(16,2) DEFAULT 0,
        credits       NUMERIC(16,2) DEFAULT 0,
        is_verified   BOOLEAN DEFAULT FALSE,
        is_active     BOOLEAN DEFAULT TRUE,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ users')

    // 3. email_verifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id          SERIAL PRIMARY KEY,
        user_id     INT REFERENCES users(id) ON DELETE CASCADE,
        code        VARCHAR(8) NOT NULL,
        expires_at  TIMESTAMP NOT NULL,
        used        BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ email_verifications')

    // 4. password_resets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id          SERIAL PRIMARY KEY,
        user_id     INT REFERENCES users(id) ON DELETE CASCADE,
        token       VARCHAR(100) NOT NULL,
        expires_at  TIMESTAMP NOT NULL,
        used        BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ password_resets')

    // 5. products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            SERIAL PRIMARY KEY,
        seller_id     INT REFERENCES users(id) ON DELETE CASCADE,
        name          VARCHAR(100) NOT NULL,
        description   TEXT,
        price         NUMERIC(16,2) NOT NULL,
        image_url     TEXT,
        category      VARCHAR(50),
        is_visible    BOOLEAN DEFAULT TRUE,
        stock         INT DEFAULT 1,
        created_at    TIMESTAMP DEFAULT NOW(),
        updated_at    TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ products')

    // 6. purchases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id            SERIAL PRIMARY KEY,
        buyer_id      INT REFERENCES users(id),
        seller_id     INT REFERENCES users(id),
        product_id    INT REFERENCES products(id),
        amount        NUMERIC(16,2) NOT NULL,
        status        VARCHAR(20) DEFAULT 'completed',
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ purchases')

    // 7. recharges
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recharges (
        id            SERIAL PRIMARY KEY,
        user_id       INT REFERENCES users(id),
        type          VARCHAR(20) DEFAULT 'balance',
        amount        NUMERIC(16,2) NOT NULL,
        method        VARCHAR(50),
        reference     VARCHAR(100),
        note          TEXT,
        status        VARCHAR(20) DEFAULT 'approved',
        admin_id      INT REFERENCES users(id),
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ recharges')

    // 8. notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id            SERIAL PRIMARY KEY,
        user_id       INT REFERENCES users(id) ON DELETE CASCADE,
        type          VARCHAR(30) DEFAULT 'sistema',
        title         VARCHAR(100) NOT NULL,
        body          TEXT,
        details       TEXT,
        is_read       BOOLEAN DEFAULT FALSE,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ notifications')

    // 9. support_messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id            SERIAL PRIMARY KEY,
        session_id    VARCHAR(50) NOT NULL,
        user_id       INT REFERENCES users(id),
        user_code     VARCHAR(12),
        username      VARCHAR(50),
        user_avatar   VARCHAR(10),
        from_role     VARCHAR(10) NOT NULL,
        text          TEXT NOT NULL,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ support_messages')

    // 10. withdrawal_requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawal_requests (
        id              SERIAL PRIMARY KEY,
        user_id         INT REFERENCES users(id),
        bank_id         VARCHAR(50),
        bank_label      VARCHAR(100),
        account_number  VARCHAR(30),
        owner_name      VARCHAR(100),
        nit             VARCHAR(30),
        amount          NUMERIC(16,2) NOT NULL,
        status          VARCHAR(20) DEFAULT 'pending',
        admin_note      TEXT,
        created_at      TIMESTAMP DEFAULT NOW(),
        reviewed_at     TIMESTAMP
      );
    `)
    console.log('✓ withdrawal_requests')

    // 11. maintenance_settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_settings (
        id          SERIAL PRIMARY KEY,
        enabled     BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at  TIMESTAMP DEFAULT NOW()
      );
    `)
    await pool.query(`
      INSERT INTO maintenance_settings (id, enabled) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;
    `)
    console.log('✓ maintenance_settings')

    // 12. payment_methods
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id              SERIAL PRIMARY KEY,
        user_id         INT REFERENCES users(id) ON DELETE CASCADE,
        bank_id         VARCHAR(50),
        account_number  VARCHAR(30),
        owner_name      VARCHAR(100),
        nit             VARCHAR(30),
        is_default      BOOLEAN DEFAULT FALSE,
        created_at      TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ payment_methods')

    // 13. sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id            SERIAL PRIMARY KEY,
        user_id       INT REFERENCES users(id) ON DELETE CASCADE,
        token         VARCHAR(255) UNIQUE NOT NULL,
        device        VARCHAR(100),
        browser       VARCHAR(100),
        ip            VARCHAR(50),
        is_current    BOOLEAN DEFAULT TRUE,
        created_at    TIMESTAMP DEFAULT NOW(),
        last_active   TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✓ sessions')

    // Índices
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_code     ON users(code);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ev_user        ON email_verifications(user_id);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_support_session ON support_messages(session_id);`)
    console.log('✓ índices')

    // Trigger updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    `)
    await pool.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    await pool.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `)
    console.log('✓ triggers')

    // Admin por defecto
    const bcrypt = require('bcryptjs')
    const adminHash = await bcrypt.hash('Admin@Bazar2026', 12)
    await pool.query(`
      INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, balance, credits)
      VALUES ($1, $2, $3, $4, 'administrador', '👑', TRUE, TRUE, $5, $5)
      ON CONFLICT (email) DO NOTHING;
    `, ['#ADMIN1', 'admin', 'admin@bazar.com', adminHash, 999999999999])
    console.log('✓ admin user')

    // Verificar
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
    `)
    console.log('\n📊 Tablas:', tables.rows.map(r => r.table_name).join(', '))

    console.log('\n🎉 ¡Base de datos configurada!')

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await pool.end()
  }
}

setup()
