require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const authRoutes    = require('./routes/auth')
const profileRoutes = require('./routes/profile')

const app  = express()
const PORT = process.env.PORT || 3001

/* ── Middlewares ── */
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

/* ── Rutas ── */
app.use('/api/auth',          authRoutes)
app.use('/api/profile',       profileRoutes)
app.use('/api/admin',         require('./routes/admin'))
app.use('/api/admin',         require('./routes/maintenance'))
app.use('/api',              require('./routes/maintenance'))



app.use('/api/products',      require('./routes/products'))
app.use('/api/recharges',     require('./routes/recharges'))
app.use('/api/withdrawals',   require('./routes/withdrawals'))
app.use('/api/purchases',     require('./routes/purchases'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/support',       require('./routes/support'))

/* ── Health check (verifica Postgres) ── */
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db')
    await pool.query('SELECT 1')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('Healthcheck DB error:', err.message)
    res.status(503).json({ status: 'db_unavailable', timestamp: new Date().toISOString() })
  }
})


/* ── Arrancar ── */
app.listen(PORT, () => {
  console.log(`🚀 Servidor Bazar corriendo en http://localhost:${PORT}`)
})
