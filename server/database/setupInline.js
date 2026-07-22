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

    // products (matching add-products-table.js)
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'otro',
      category_label VARCHAR(80) NOT NULL DEFAULT 'Otro',
      price NUMERIC(16,2) NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      visible BOOLEAN NOT NULL DEFAULT TRUE,
      emoji VARCHAR(10) NOT NULL DEFAULT '📦',
      description TEXT NOT NULL DEFAULT '',
      seller VARCHAR(100) NOT NULL DEFAULT 'Administrador',
      seller_id VARCHAR(50) NOT NULL DEFAULT 'admin',
      rating NUMERIC(3,1) NOT NULL DEFAULT 4.8,
      sales INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // purchases (matching add-purchases-table.js)
    `CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      buyer_id INT REFERENCES users(id) ON DELETE SET NULL,
      buyer_code VARCHAR(20) NOT NULL,
      product_id INT,
      product_name VARCHAR(200) NOT NULL,
      product_emoji VARCHAR(10) DEFAULT '📦',
      category VARCHAR(50) DEFAULT 'otro',
      category_label VARCHAR(80) DEFAULT 'Otro',
      price NUMERIC(16,2) NOT NULL,
      seller VARCHAR(100) NOT NULL DEFAULT 'Administrador',
      seller_id VARCHAR(50) NOT NULL DEFAULT 'admin',
      status VARCHAR(20) NOT NULL DEFAULT 'disponible',
      for_sale BOOLEAN DEFAULT FALSE,
      sale_price NUMERIC(16,2),
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // recharge_requests (matching add-recharges-table.js)
    `CREATE TABLE IF NOT EXISTS recharge_requests (
      id VARCHAR(40) PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      user_code VARCHAR(20) NOT NULL,
      username VARCHAR(100) NOT NULL,
      user_avatar VARCHAR(10) DEFAULT '👤',
      account_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(80) NOT NULL,
      amount NUMERIC(16,2) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'balance',
      method VARCHAR(30) NOT NULL DEFAULT 'nequi',
      img_preview TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP
    );`,

    // notifications (matching add-notifications-table.js)
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL DEFAULT 'sistema',
      title VARCHAR(200) NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      details TEXT DEFAULT '',
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // support_messages (matching add-support-table.js)
    `CREATE TABLE IF NOT EXISTS support_messages (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(60) NOT NULL,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      user_code VARCHAR(20) NOT NULL,
      username VARCHAR(100) NOT NULL,
      user_avatar VARCHAR(10) DEFAULT '👤',
      from_role VARCHAR(10) NOT NULL DEFAULT 'user',
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // withdrawal_requests (matching add-withdrawal-requests.js)
    `CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id VARCHAR(50) PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_code VARCHAR(12),
      username VARCHAR(50),
      user_avatar VARCHAR(10) DEFAULT '👤',
      bank_id VARCHAR(30) NOT NULL,
      bank_label VARCHAR(50),
      account_number VARCHAR(30) NOT NULL,
      owner_name VARCHAR(100),
      nit VARCHAR(30),
      amount NUMERIC(16,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
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
    `CREATE INDEX IF NOT EXISTS idx_notif_user     ON notifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sm_session     ON support_messages(session_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sm_user        ON support_messages(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_code);`,
    `CREATE INDEX IF NOT EXISTS idx_rr_user_code   ON recharge_requests(user_code);`,
    `CREATE INDEX IF NOT EXISTS idx_rr_status      ON recharge_requests(status);`,
    `CREATE INDEX IF NOT EXISTS idx_wr_user_id     ON withdrawal_requests(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_wr_status      ON withdrawal_requests(status);`,

    // Triggers
    `CREATE OR REPLACE FUNCTION set_updated_at()
     RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;`,
    `DO $$ BEGIN
      CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `CREATE OR REPLACE FUNCTION set_products_updated_at()
     RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;`,
    `DO $$ BEGIN
      CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_products_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  ]

  for (const sql of queries) {
    try { await pool.query(sql) } catch (err) {
      if (!['42710', '42P07', '42P16'].includes(err.code) && !err.message.includes('already exists') && !err.message.includes('duplicate') && !err.message.includes('does not exist')) {
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
    // Ensure admin has profile_completed = true
    await pool.query(`UPDATE users SET profile_completed = TRUE WHERE email = 'admin@bazar.com';`)
    // Auto-verify all users (email sending doesn't work on Railway)
    await pool.query(`UPDATE users SET is_verified = TRUE WHERE is_verified = FALSE;`)
  } catch (err) {
    if (!err.message.includes('duplicate')) console.error('Admin setup error:', err.message)
  }

  console.log('✅ Database tables ready')

  // Fix tables that already exist with wrong schema (ALTER TABLE for missing columns)
  const alters = [
    // products: add missing columns
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS category_label VARCHAR(80) NOT NULL DEFAULT 'Otro';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS visible BOOLEAN NOT NULL DEFAULT TRUE;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10) NOT NULL DEFAULT '📦';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS seller VARCHAR(100) NOT NULL DEFAULT 'Administrador';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NOT NULL DEFAULT 'admin';`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1) NOT NULL DEFAULT 4.8;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS sales INTEGER NOT NULL DEFAULT 0;`,
    // products: rename is_visible to visible if exists
    `DO $$ BEGIN ALTER TABLE products RENAME COLUMN is_visible TO visible; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,

    // purchases: add missing columns
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS buyer_code VARCHAR(20) NOT NULL DEFAULT '';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_name VARCHAR(200) NOT NULL DEFAULT '';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS product_emoji VARCHAR(10) DEFAULT '📦';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'otro';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS category_label VARCHAR(80) DEFAULT 'Otro';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS price NUMERIC(16,2) NOT NULL DEFAULT 0;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS seller VARCHAR(100) NOT NULL DEFAULT 'Administrador';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS seller_id VARCHAR(50) NOT NULL DEFAULT 'admin';`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS sale_price NUMERIC(16,2);`,
    `ALTER TABLE purchases ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';`,

    // notifications: rename is_read to read if exists
    `DO $$ BEGIN ALTER TABLE notifications RENAME COLUMN is_read TO read; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,
  ]

  for (const sql of alters) {
    try { await pool.query(sql) } catch { /* ignore */ }
  }

  // Drop wrong recharges table and recreate as recharge_requests
  try {
    await pool.query(`DROP TABLE IF EXISTS recharges CASCADE;`)
  } catch { /* ignore */ }
}

module.exports = setupDatabase
