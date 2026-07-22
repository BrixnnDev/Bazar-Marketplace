/**
 * SETUP DE BASE DE DATOS — ejecutar UNA VEZ
 * Crea todas las tablas y el usuario administrador
 *
 * Ejecutar: node database/setup.js
 */

require('dotenv').config({ path: '../.env' })
const { Pool } = require('pg')

// Usa las credenciales directamente por si .env no carga bien
const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'Bazar',
  user:     'postgres',
  password: '180905',
})

async function setup() {
  console.log('🔌 Conectando a PostgreSQL...')

  try {
    await pool.query('SELECT 1')
    console.log('✅ Conexión exitosa a la base de datos Bazar\n')
  } catch (err) {
    console.error('❌ No se pudo conectar:', err.message)
    process.exit(1)
  }

  try {
    // ── 1. ENUM de roles ──
    console.log('📋 Creando tipo user_role...')
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('administrador', 'vendedor', 'comprador', 'usuario');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    console.log('   ✓ user_role OK')

    // ── 2. Tabla users ──
    console.log('📋 Creando tabla users...')
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
    console.log('   ✓ users OK')

    // ── 3. Tabla email_verifications ──
    console.log('📋 Creando tabla email_verifications...')
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
    console.log('   ✓ email_verifications OK')

    // ── 4. Tabla password_resets ──
    console.log('📋 Creando tabla password_resets...')
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
    console.log('   ✓ password_resets OK')

    // ── 5. Índices ──
    console.log('📋 Creando índices...')
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_code     ON users(code);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ev_user        ON email_verifications(user_id);`)
    console.log('   ✓ Índices OK')

    // ── 6. Función y trigger updated_at ──
    console.log('📋 Creando trigger updated_at...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `)
    await pool.query(`
      DO $$ BEGIN
        CREATE TRIGGER trg_users_updated
          BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)
    console.log('   ✓ Trigger OK')

    // ── 7. Usuario administrador ──
    console.log('📋 Creando usuario administrador...')
    // Hash de "Admin@Bazar2026" con bcrypt rounds=12
    // Generado con: bcrypt.hashSync('Admin@Bazar2026', 12)
    const bcrypt = require('bcryptjs')
    const adminHash = await bcrypt.hash('Admin@Bazar2026', 12)

    await pool.query(`
      INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, balance, credits)
      VALUES ($1, $2, $3, $4, 'administrador', '👑', TRUE, TRUE, $5, $5)
      ON CONFLICT (email) DO NOTHING;
    `, ['#ADMIN1', 'admin', 'admin@bazar.com', adminHash, 999999999999])
    console.log('   ✓ Admin creado: admin@bazar.com / Admin@Bazar2026')

    // ── 8. Verificar resultado ──
    console.log('\n📊 Tablas creadas:')
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)
    tables.rows.forEach(r => console.log(`   • ${r.table_name}`))

    console.log('\n👥 Usuarios:')
    const users = await pool.query('SELECT id, code, username, email, role, avatar, is_verified FROM users;')
    users.rows.forEach(u => {
      console.log(`   ${u.avatar} ${u.username} | ${u.email} | ${u.role} | verificado: ${u.is_verified} | código: ${u.code}`)
    })

    console.log('\n🎉 ¡Base de datos configurada exitosamente!')
    console.log('   Ahora puedes correr: npm run dev\n')

  } catch (err) {
    console.error('❌ Error durante setup:', err.message)
  } finally {
    await pool.end()
  }
}

setup()
