const express = require('express')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router     = express.Router()
const JWT_SECRET = 'bazar_super_secret_key_2026_xK9mP2nQ'

/* ── Middleware de autenticación ── */
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Sin token.' })
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
  }
}

/* ══════════════════════════════════
   GET /api/profile/me
   Verifica si el usuario tiene perfil completo
══════════════════════════════════ */
router.get('/me', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, code, username, email, role, avatar,
              full_name, doc_type, doc_number, phone,
              balance, credits, profile_completed, created_at
       FROM users WHERE id=$1`,
      [req.user.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' })
    res.json({ user: r.rows[0] })
  } catch (err) {
    console.error('Profile/me error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════
   POST /api/profile/complete
   Completa el perfil del usuario
   Body: { fullName, docType, docNumber, phone, avatar }
══════════════════════════════════ */
router.post('/complete', auth, async (req, res) => {
  try {
    const { fullName, docType, docNumber, phone, avatar } = req.body

    if (!fullName || !docType || !docNumber || !phone)
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' })

    /* Validar que no exista ese documento en otro usuario */
    const docExists = await pool.query(
      'SELECT id FROM users WHERE doc_number=$1 AND id!=$2',
      [docNumber, req.user.id]
    )
    if (docExists.rows.length > 0)
      return res.status(409).json({ error: 'Ese documento ya está registrado.' })

    /* Actualizar perfil */
    const r = await pool.query(
      `UPDATE users SET
        full_name         = $1,
        doc_type          = $2,
        doc_number        = $3,
        phone             = $4,
        avatar            = $5,
        profile_completed = true
       WHERE id = $6
       RETURNING id, code, username, email, role, avatar,
                 full_name, doc_type, doc_number, phone,
                 balance, credits, profile_completed`,
      [fullName, docType, docNumber, phone, avatar || '👤', req.user.id]
    )

    res.json({ message: 'Perfil completado.', user: r.rows[0] })

  } catch (err) {
    console.error('Profile/complete error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════
   PUT /api/profile/update
   Actualiza username, phone, avatar, name
══════════════════════════════════ */
router.put('/update', auth, async (req, res) => {
  try {
    const { phone, avatar, username, fullName, city } = req.body


    // Si viene username, verificar que no esté tomado por otro usuario
    if (username && username.trim()) {
      const taken = await pool.query(
        'SELECT id FROM users WHERE LOWER(username)=LOWER($1) AND id!=$2',
        [username.trim(), req.user.id]
      )
      if (taken.rows.length > 0)
        return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' })
    }

    const r = await pool.query(
      `UPDATE users SET
        phone     = COALESCE($1, phone),
        avatar    = COALESCE($2, avatar),
        username  = COALESCE(NULLIF($3,''), username),
        city      = COALESCE(NULLIF($4,''), city),
        full_name = COALESCE(NULLIF($5,''), full_name)
       WHERE id=$6
       RETURNING id, code, username, email, role, avatar,
                 full_name, doc_type, doc_number, phone, city,
                 balance, credits, profile_completed, created_at`,
      [phone || null, avatar || null, username?.trim() || null, city || null, fullName?.trim() || null, req.user.id]
    )


    res.json({ message: 'Perfil actualizado.', user: r.rows[0] })
  } catch (err) {
    console.error('Profile/update error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
