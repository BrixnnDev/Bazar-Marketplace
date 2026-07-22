-- ============================================================
--  BAZAR DATABASE SCHEMA
--  Ejecutar en pgAdmin 4 Query Tool
-- ============================================================

-- Crear la base de datos (ejecutar separado si no existe)
-- CREATE DATABASE bazar_db;

-- ── ENUM de roles ──
CREATE TYPE user_role AS ENUM ('administrador', 'vendedor', 'comprador', 'usuario');

-- ── TABLA usuarios ──
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(12) UNIQUE NOT NULL,   -- código autogenerado #BZRxxxxx
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

-- ── TABLA verificación de correo ──
CREATE TABLE IF NOT EXISTS email_verifications (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    code        VARCHAR(8) NOT NULL,          -- código de 6 dígitos
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── TABLA tokens de recuperación de contraseña ──
CREATE TABLE IF NOT EXISTS password_resets (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(100) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ── ÍNDICES ──
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_code     ON users(code);
CREATE INDEX idx_ev_user        ON email_verifications(user_id);

-- ── FUNCIÓN para actualizar updated_at automáticamente ──
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  CONFIGURACIÓN GLOBAL: MANTENIMIENTO
--  controlado por el administrador. Si enabled=true,
--  los usuarios verán MaintenancePage (el admin no).
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_settings (
  id          SERIAL PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Asegurar un solo registro por defecto (id=1)
INSERT INTO maintenance_settings (id, enabled)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
--  USUARIO ADMINISTRADOR por defecto
--  Contraseña: Admin@Bazar2026  (hash bcrypt rounds=12)
--  ⚠️  Reemplaza el hash si cambias la contraseña
-- ============================================================
INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, is_active, balance, credits)
VALUES (
  '#ADMIN1',
  'admin',
  'admin@bazar.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/MpGzR.fOJSxVfXIZK',  -- Admin@Bazar2026
  'administrador',
  '👑',
  TRUE,
  TRUE,
  999999999999,
  999999999999
)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
--  VERIFICACIÓN
-- ============================================================
SELECT id, code, username, email, role, avatar, is_verified FROM users;
