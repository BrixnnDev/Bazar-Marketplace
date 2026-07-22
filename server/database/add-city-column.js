const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'Bazar', user: 'postgres', password: '180905',
})

async function run() {
  console.log('Agregando columna city en users...')
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(80)`) // ciudad o país
  await pool.query(`ALTER TABLE users ALTER COLUMN city SET DEFAULT NULL`)
  console.log('✅ Columna city lista')
  await pool.end()
}

run().catch(async (e) => {
  console.error('❌ Error:', e.message)
  try { await pool.end() } catch { /* empty */ }
  process.exit(1)
})

