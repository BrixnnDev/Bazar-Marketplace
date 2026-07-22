/**
 * Auto-setup: crea todas las tablas si no existen
 * Se ejecuta automáticamente al iniciar el servidor
 */

const pool = require('../config/db')
const bcrypt = require('bcryptjs')

async function setupDatabase() {
  const queries = [
    // ENUM
    `DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('administrador', 'vendedor', 'comprador', 'usuario');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

    // users
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, code VARCHAR(12) UNIQUE NOT NULL, username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      role user_role DEFAULT 'usuario', avatar VARCHAR(10) DEFAULT '👤',
      full_name VARCHAR(100), doc_type VARCHAR(20), doc_number VARCHAR(30),
      phone VARCHAR(20), city VARCHAR(50), profile_completed BOOLEAN DEFAULT FALSE,
      nequi VARCHAR(20), balance NUMERIC(16,2) DEFAULT 0, credits NUMERIC(16,2) DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // email_verifications
    `CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(8) NOT NULL, expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
    );`,

    // password_resets
    `CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(100) NOT NULL, expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
    );`,

    // products
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY, seller_id INT REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL, description TEXT, price NUMERIC(16,2) NOT NULL,
      image_url TEXT, category VARCHAR(50), is_visible BOOLEAN DEFAULT TRUE,
      stock INT DEFAULT 1, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // purchases
    `CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY, buyer_id INT REFERENCES users(id),
      seller_id INT REFERENCES users(id), product_id INT REFERENCES products(id),
      amount NUMERIC(16,2) NOT NULL, status VARCHAR(20) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // recharges
    `CREATE TABLE IF NOT EXISTS recharges (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), type VARCHAR(20) DEFAULT 'balance',
      amount NUMERIC(16,2) NOT NULL, method VARCHAR(50), reference VARCHAR(100),
      note TEXT, status VARCHAR(20) DEFAULT 'approved', admin_id INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(30) DEFAULT 'sistema', title VARCHAR(100) NOT NULL,
      body TEXT, details TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
    );`,

    // support_messages
    `CREATE TABLE IF NOT EXISTS support_messages (
      id SERIAL PRIMARY KEY, session_id VARCHAR(50) NOT NULL, user_id INT REFERENCES users(id),
      user_code VARCHAR(12), username VARCHAR(50), user_avatar VARCHAR(10),
      from_role VARCHAR(10) NOT NULL, text TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
    );`,

    // withdrawal_requests
    `CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), bank_id VARCHAR(50),
      bank_label VARCHAR(100), account_number VARCHAR(30), owner_name VARCHAR(100),
      nit VARCHAR(30), amount NUMERIC(16,2) NOT NULL, status VARCHAR(20) DEFAULT 'pending',
      admin_note TEXT, created_at TIMESTAMP DEFAULT NOW(), reviewed_at TIMESTAMP
    );`,

    // maintenance_settings
    `CREATE TABLE IF NOT EXISTS maintenance_settings (
      id SERIAL PRIMARY KEY, enabled BOOLEAN NOT NULL DEFAULT FALSE, updated_at TIMESTAMP DEFAULT NOW()
    );`,
    `INSERT INTO maintenance_settings (id, enabled) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;`,

    // payment_methods
    `CREATE TABLE IF NOT EXISTS payment_methods (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
      bank_id VARCHAR(50), account_number VARCHAR(30), owner_name VARCHAR(100),
      nit VARCHAR(30), is_default BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW()
    );`,

    // sessions
    `CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL, device VARCHAR(100), browser VARCHAR(100),
      ip VARCHAR(50), is_current BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(), last_active TIMESTAMP DEFAULT NOW()
    );`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);`,
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
    `CREATE INDEX IF NOT EXISTS idx_users_code     ON users(code);`,
    `CREATE INDEX IF NOT EXISTS idx_ev_user        ON email_verifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_support_session ON support_messages(session_id);`,

    // Trigger function
    `CREATE OR REPLACE FUNCTION set_updated_at()
     RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;`,
    `DO $$ BEGIN
      CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN
      CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  ]

  for (const sql of queries) {
    try { await pool.query(sql) } catch (err) {
      if (err.code !== '42710' && !err.message.includes('already exists') && !err.message.includes('duplicate_object')) {
        console.error('Setup error:', err.message)
      }
    }
  }

  // Admin user
  try {
    const adminHash = await bcrypt.hash('Admin@Bazar2026', 12)
    await pool.query(`
      INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, balance, credits)
      VALUES ($1, $2, $3, $4, 'administrador', '👑', TRUE, TRUE, $5, $5)
      ON CONFLICT (email) DO NOTHING;
    `, ['#ADMIN1', 'admin', 'admin@bazar.com', adminHash, 999999999999])
  } catch (err) {
    if (!err.message.includes('duplicate')) console.error('Admin setup error:', err.message)
  }

  console.log('✅ Database tables ready')
}

module.exports = setupDatabase
