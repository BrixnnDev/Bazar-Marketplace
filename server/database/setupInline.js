const pool = require('../config/db')
const bcrypt = require('bcryptjs')

const ADMIN_EMAIL = 'admin@bazar.com'
const ADMIN_CODE = '#ADMIN1'
const ADMIN_PASS = 'Admin@Bazar2026'
const ADMIN_BALANCE = 999999999999

async function setupDatabase() {
  console.log('🔧 Setting up database...')

  // 1. Save ALL user data before dropping
  let savedUsers = []
  try {
    const r = await pool.query(
      `SELECT id, code, username, email, password_hash, role, avatar,
              full_name, doc_type, doc_number, phone, city,
              profile_completed, balance, credits, is_verified, is_active, created_at
       FROM users`
    )
    savedUsers = r.rows
  } catch { /* table may not exist yet */ }

  // 2. Drop ALL tables and the enum type
  const allTables = [
    'sessions', 'payment_methods', 'support_messages',
    'recharge_requests', 'withdrawal_requests', 'notifications',
    'purchases', 'products', 'password_resets', 'email_verifications',
    'users', 'maintenance_settings',
  ]
  for (const t of allTables) {
    try { await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE;`) } catch { /* ignore */ }
  }
  try { await pool.query(`DROP TYPE IF EXISTS user_role CASCADE;`) } catch { /* ignore */ }

  // 3. Create ENUM
  try {
    await pool.query(`CREATE TYPE user_role AS ENUM ('administrador', 'vendedor', 'comprador', 'usuario');`)
  } catch { /* exists */ }

  // 4. Create ALL tables from scratch
  const schemas = [
    `CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      code VARCHAR(12) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role user_role DEFAULT 'usuario',
      avatar VARCHAR(10) DEFAULT '👤',
      full_name VARCHAR(100),
      doc_type VARCHAR(20),
      doc_number VARCHAR(30),
      phone VARCHAR(20),
      city VARCHAR(50),
      profile_completed BOOLEAN DEFAULT FALSE,
      balance NUMERIC(16,2) DEFAULT 0,
      credits NUMERIC(16,2) DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE email_verifications (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      code VARCHAR(8) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE password_resets (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(100) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE products (
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
    )`,
    `CREATE TABLE purchases (
      id SERIAL PRIMARY KEY,
      buyer_id INT REFERENCES users(id) ON DELETE SET NULL,
      buyer_code VARCHAR(20) NOT NULL DEFAULT '',
      product_id INTEGER,
      product_name VARCHAR(200) NOT NULL DEFAULT '',
      product_emoji VARCHAR(10) DEFAULT '📦',
      category VARCHAR(50) DEFAULT 'otro',
      category_label VARCHAR(80) DEFAULT 'Otro',
      price NUMERIC(16,2) NOT NULL DEFAULT 0,
      seller VARCHAR(100) NOT NULL DEFAULT 'Administrador',
      seller_id VARCHAR(50) NOT NULL DEFAULT 'admin',
      status VARCHAR(20) NOT NULL DEFAULT 'disponible',
      for_sale BOOLEAN DEFAULT FALSE,
      sale_price NUMERIC(16,2),
      description TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE recharge_requests (
      id VARCHAR(40) PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      user_code VARCHAR(20) NOT NULL DEFAULT '',
      username VARCHAR(100) NOT NULL DEFAULT '',
      user_avatar VARCHAR(10) DEFAULT '👤',
      account_name VARCHAR(100) NOT NULL DEFAULT '',
      account_number VARCHAR(80) NOT NULL DEFAULT '',
      amount NUMERIC(16,2) NOT NULL DEFAULT 0,
      type VARCHAR(20) NOT NULL DEFAULT 'balance',
      method VARCHAR(30) NOT NULL DEFAULT 'nequi',
      img_preview TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP
    )`,
    `CREATE TABLE notifications (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL DEFAULT 'sistema',
      title VARCHAR(200) NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      details TEXT DEFAULT '',
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE support_messages (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(60) NOT NULL,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      user_code VARCHAR(20) NOT NULL DEFAULT '',
      username VARCHAR(100) NOT NULL DEFAULT '',
      user_avatar VARCHAR(10) DEFAULT '👤',
      from_role VARCHAR(10) NOT NULL DEFAULT 'user',
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE withdrawal_requests (
      id VARCHAR(50) PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user_code VARCHAR(12) DEFAULT '',
      username VARCHAR(50) DEFAULT '',
      user_avatar VARCHAR(10) DEFAULT '👤',
      bank_id VARCHAR(30) NOT NULL DEFAULT '',
      bank_label VARCHAR(50) DEFAULT '',
      account_number VARCHAR(30) NOT NULL DEFAULT '',
      owner_name VARCHAR(100) DEFAULT '',
      nit VARCHAR(30),
      amount NUMERIC(16,2) NOT NULL DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE maintenance_settings (
      id SERIAL PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE payment_methods (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      bank_id VARCHAR(50),
      account_number VARCHAR(30),
      owner_name VARCHAR(100),
      nit VARCHAR(30),
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE sessions (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      device VARCHAR(100),
      browser VARCHAR(100),
      ip VARCHAR(50),
      is_current BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      last_active TIMESTAMP DEFAULT NOW()
    )`,
  ]

  for (const sql of schemas) {
    try { await pool.query(sql) }
    catch (err) { console.error('Schema error:', err.message) }
  }

  // 5. Indexes
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
    `CREATE INDEX IF NOT EXISTS idx_users_code ON users(code);`,
    `CREATE INDEX IF NOT EXISTS idx_ev_user ON email_verifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sm_session ON support_messages(session_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sm_user ON support_messages(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON purchases(buyer_code);`,
    `CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);`,
    `CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);`,
    `CREATE INDEX IF NOT EXISTS idx_rr_user_code ON recharge_requests(user_code);`,
    `CREATE INDEX IF NOT EXISTS idx_rr_status ON recharge_requests(status);`,
    `CREATE INDEX IF NOT EXISTS idx_wr_user_id ON withdrawal_requests(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_wr_status ON withdrawal_requests(status);`,
  ]
  for (const sql of indexes) {
    try { await pool.query(sql) } catch { /* ignore */ }
  }

  // 6. Triggers
  try {
    await pool.query(`CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;`)
    await pool.query(`DO $$ BEGIN
      CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
    await pool.query(`DO $$ BEGIN
      CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`)
  } catch { /* ignore */ }

  // 7. Maintenance settings
  try {
    await pool.query(`INSERT INTO maintenance_settings (id, enabled) VALUES (1, FALSE) ON CONFLICT (id) DO NOTHING;`)
  } catch { /* ignore */ }

  // 8. Restore users (admin first, then others)
  try {
    const adminHash = await bcrypt.hash(ADMIN_PASS, 12)

    // Find saved admin or create new
    const savedAdmin = savedUsers.find(u => u.email === ADMIN_EMAIL)

    if (savedAdmin) {
      await pool.query(
        `INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, profile_completed, balance, credits, created_at)
         VALUES ($1,$2,$3,$4,'administrador','👑',TRUE,TRUE,TRUE,$6,$6,$7)
         ON CONFLICT (email) DO UPDATE SET
           password_hash=$4, role='administrador', avatar='👑', is_verified=TRUE, is_active=TRUE,
           profile_completed=TRUE, balance=$6, credits=$6`,
        [savedAdmin.code, savedAdmin.username, savedAdmin.email, adminHash, null, ADMIN_BALANCE, savedAdmin.created_at]
      )
    } else {
      await pool.query(
        `INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, profile_completed, balance, credits)
         VALUES ($1,$2,$3,$4,'administrador','👑',TRUE,TRUE,TRUE,$5,$5)
         ON CONFLICT (email) DO NOTHING`,
        [ADMIN_CODE, 'admin', ADMIN_EMAIL, adminHash, ADMIN_BALANCE]
      )
    }

    // Restore non-admin, non-test users (like Brixnn)
    const testEmails = ['test@test.com', 'test99@test.com', 'testxyz@test.com']
    for (const u of savedUsers) {
      if (u.email === ADMIN_EMAIL) continue
      if (testEmails.includes(u.email)) continue
      try {
        await pool.query(
          `INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, profile_completed, balance, credits, full_name, phone, city, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
           ON CONFLICT (email) DO NOTHING`,
          [u.code, u.username, u.email, u.password_hash, u.role || 'usuario', u.avatar || '👤',
           true, u.is_active !== false, true,
           u.balance || 0, u.credits || 0,
           u.full_name || null, u.phone || null, u.city || null, u.created_at]
        )
        console.log(`✅ Restored user: ${u.username} (${u.email})`)
      } catch (err) {
        console.error(`Failed to restore user ${u.username}:`, err.message)
      }
    }

    // Delete test users
    await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [testEmails])
    await pool.query(`DELETE FROM users WHERE username LIKE 'test%' AND email != $1`, [ADMIN_EMAIL])

  } catch (err) {
    console.error('User restore error:', err.message)
  }

  console.log('✅ Database ready — all tables recreated with correct schemas')
}

module.exports = setupDatabase
