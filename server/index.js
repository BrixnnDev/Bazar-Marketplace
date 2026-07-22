require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const app  = express()
const PORT = process.env.PORT || 3001

/* ── CORS ── */
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    cb(null, true)
  },
  credentials: true,
}))
app.use(express.json())

/* ── Rutas ── */
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/profile',       require('./routes/profile'))
app.use('/api/admin',         require('./routes/admin'))
app.use('/api/admin',         require('./routes/maintenance'))
app.use('/api',               require('./routes/maintenance'))
app.use('/api/products',      require('./routes/products'))
app.use('/api/recharges',     require('./routes/recharges'))
app.use('/api/withdrawals',   require('./routes/withdrawals'))
app.use('/api/purchases',     require('./routes/purchases'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/support',       require('./routes/support'))

/* ── Health check ── */
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db')
    await pool.query('SELECT 1')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({ status: 'db_unavailable', timestamp: new Date().toISOString() })
  }
})

/* ── Arrancar con auto-setup ── */
async function start() {
  try {
    const setupDatabase = require('./database/setupInline')
    await setupDatabase()
  } catch (err) {
    console.error('⚠️ DB setup failed:', err.message)
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor Bazar corriendo en http://localhost:${PORT}`)
  })

  // Keepalive: ping DB every 5 minutes to prevent Railway from killing idle connections
  setInterval(async () => {
    try {
      const pool = require('./config/db')
      await pool.query('SELECT 1')
    } catch { /* ignore */ }
  }, 5 * 60 * 1000)
}

start()
