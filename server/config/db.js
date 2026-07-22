require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME     || 'Bazar',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '180905',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
)

pool.on('connect', () => console.log('✅ PostgreSQL conectado'))
pool.on('error',   (err) => console.error('❌ DB error:', err.message))

module.exports = pool
