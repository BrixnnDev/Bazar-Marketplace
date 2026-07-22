const express = require('express')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router     = express.Router()
const JWT_SECRET = 'bazar_super_secret_key_2026_xK9mP2nQ'

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Sin token.' })
  try { req.user = jwt.verify(header.split(' ')[1], JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Token inválido.' }) }
}

/* GET /api/notifications  — lista del usuario actual */
router.get('/', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ notifications: r.rows.map(serialize) })
  } catch (err) {
    console.error('GET /notifications error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* PATCH /api/notifications/:id/read  — marcar una como leída */
router.patch('/:id/read', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* PATCH /api/notifications/read-all  — marcar todas como leídas */
router.patch('/read-all', auth, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET read=TRUE WHERE user_id=$1', [req.user.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* DELETE /api/notifications/:id  — eliminar una */
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* DELETE /api/notifications  — borrar todas (o solo leídas con ?read=true) */
router.delete('/', auth, async (req, res) => {
  try {
    if (req.query.read === 'true') {
      await pool.query('DELETE FROM notifications WHERE user_id=$1 AND read=TRUE', [req.user.id])
    } else {
      await pool.query('DELETE FROM notifications WHERE user_id=$1', [req.user.id])
    }
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* POST /api/notifications  — crear una notificación (interno, sin auth estricta de admin) */
router.post('/', auth, async (req, res) => {
  try {
    const { userId, type, title, body, details } = req.body
    const targetId = userId || req.user.id
    const r = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, details)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [targetId, type || 'sistema', title, body || '', details || '']
    )
    res.status(201).json({ notification: serialize(r.rows[0]) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function serialize(r) {
  return {
    id:        r.id,
    type:      r.type,
    title:     r.title,
    body:      r.body,
    details:   r.details || '',
    read:      r.read,
    time:      new Date(r.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
    createdAt: new Date(r.created_at).getTime(),
  }
}

module.exports = router
