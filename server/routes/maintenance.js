const express = require('express')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router = express.Router()

const JWT_SECRET = 'bazar_super_secret_key_2026_xK9mP2nQ'

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Sin token.' })
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido.' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'administrador') {
    return res.status(403).json({ error: 'Acceso denegado.' })
  }
  next()
}

// GET /api/admin/maintenance  (admin)
router.get('/maintenance', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT enabled FROM maintenance_settings ORDER BY id ASC LIMIT 1'
    )
    res.json({ enabled: !!r.rows?.[0]?.enabled })
  } catch {
    return res.json({ enabled: false })
  }
})

// PUT /api/admin/maintenance  (admin)
router.put('/maintenance', auth, adminOnly, async (req, res) => {
  try {
    const { enabled } = req.body
    const nextEnabled = enabled === true

    // UPSERT: crear el registro si no existe, actualizar si ya existe
    await pool.query(`
      INSERT INTO maintenance_settings (id, enabled, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE SET enabled = $1, updated_at = NOW()
    `, [nextEnabled])

    res.json({ message: 'Maintenance actualizado.', enabled: nextEnabled })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/maintenance/public (público — no requiere auth)
router.get('/maintenance/public', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT enabled FROM maintenance_settings ORDER BY id ASC LIMIT 1'
    )
    res.json({ enabled: !!r.rows?.[0]?.enabled })
  } catch {
    // Si la tabla no existe, asumir maintenance OFF
    res.json({ enabled: false })
  }
})

module.exports = router
