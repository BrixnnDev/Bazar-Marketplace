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
function adminOnly(req, res, next) {
  if (req.user?.role !== 'administrador') return res.status(403).json({ error: 'Acceso denegado.' })
  next()
}

/* ── GET /api/support/my — mensajes de la sesión del usuario ── */
router.get('/my', auth, async (req, res) => {
  try {
    const sessionId = `user-${req.user.id}`
    const r = await pool.query(
      'SELECT * FROM support_messages WHERE session_id=$1 ORDER BY created_at ASC',
      [sessionId]
    )
    res.json({ messages: r.rows.map(serialize) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── POST /api/support/my — usuario envía mensaje ── */
router.post('/my', auth, async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'Mensaje vacío.' })

    const uR = await pool.query('SELECT id, code, username, avatar FROM users WHERE id=$1', [req.user.id])
    const u  = uR.rows[0]
    const sessionId = `user-${u.id}`

    const r = await pool.query(
      `INSERT INTO support_messages (session_id, user_id, user_code, username, user_avatar, from_role, text)
       VALUES ($1,$2,$3,$4,$5,'user',$6) RETURNING *`,
      [sessionId, u.id, u.code, u.username, u.avatar || '👤', text.trim()]
    )

    // Notificación para el admin
    const adminR = await pool.query("SELECT id FROM users WHERE role='administrador' LIMIT 1")
    if (adminR.rows.length > 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, details)
         VALUES ($1,'mensaje','Nuevo mensaje de soporte',$2,$3)`,
        [adminR.rows[0].id,
         `${u.username} (${u.code}) te envió un mensaje.`,
         text.trim().slice(0, 120)]
      )
    }

    res.status(201).json({ message: serialize(r.rows[0]) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/support/unread-count (admin) — total no leídos ── */
router.get('/unread-count', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT COUNT(*)::int AS cnt FROM support_messages sm
      WHERE from_role = 'user'
        AND NOT EXISTS (
          SELECT 1 FROM support_messages sm2
          WHERE sm2.session_id = sm.session_id
            AND sm2.from_role = 'admin'
            AND sm2.created_at > sm.created_at
        )
    `)
    res.json({ count: r.rows[0]?.cnt || 0 })
  } catch {
    res.json({ count: 0 })
  }
})

/* ── GET /api/support/sessions (admin) — lista de sesiones ── */
router.get('/sessions', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT
        sub.session_id,
        sub.user_id,
        sub.user_code,
        sub.username,
        sub.user_avatar,
        (SELECT text FROM support_messages WHERE session_id = sub.session_id ORDER BY created_at DESC LIMIT 1) AS last_text,
        (SELECT created_at FROM support_messages WHERE session_id = sub.session_id ORDER BY created_at DESC LIMIT 1) AS last_at,
        (SELECT COUNT(*) FROM support_messages WHERE session_id = sub.session_id AND from_role = 'user') AS unread
      FROM (
        SELECT DISTINCT ON (session_id)
          session_id, user_id, user_code, username, user_avatar
        FROM support_messages
        ORDER BY session_id, created_at DESC
      ) sub
      ORDER BY last_at DESC
    `)

    res.json({
      sessions: r.rows.map(row => ({
        session_id:  row.session_id,
        user_id:     row.user_id,
        user_code:   row.user_code,
        username:    row.username,
        user_avatar: row.user_avatar || '👤',
        unread:      Number(row.unread || 0),
        last_text:   row.last_text || '',
        last_at:     row.last_at,
      }))
    })
  } catch (err) {
    console.error('GET /support/sessions error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/support/sessions/:sessionId (admin) — mensajes de una sesión ── */
router.get('/sessions/:sessionId', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM support_messages WHERE session_id=$1 ORDER BY created_at ASC',
      [req.params.sessionId]
    )
    res.json({ messages: r.rows.map(serialize) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── POST /api/support/sessions/:sessionId (admin) — admin responde ── */
router.post('/sessions/:sessionId', auth, adminOnly, async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ error: 'Mensaje vacío.' })

    // Datos del usuario dueño de la sesión
    const si = await pool.query(
      'SELECT user_id, user_code, username, user_avatar FROM support_messages WHERE session_id=$1 LIMIT 1',
      [req.params.sessionId]
    )
    if (si.rows.length === 0) return res.status(404).json({ error: 'Sesión no encontrada.' })
    const s = si.rows[0]

    const r = await pool.query(
      `INSERT INTO support_messages (session_id, user_id, user_code, username, user_avatar, from_role, text)
       VALUES ($1,$2,$3,$4,$5,'admin',$6) RETURNING *`,
      [req.params.sessionId, s.user_id, s.user_code, s.username, s.user_avatar, text.trim()]
    )

    // Notificación para el usuario
    await pool.query(
      "INSERT INTO notifications (user_id, type, title, body) VALUES ($1,'mensaje','Respuesta del soporte 💬',$2)",
      [s.user_id, text.trim().slice(0, 120)]
    )

    res.status(201).json({ message: serialize(r.rows[0]) })
  } catch (err) {
    console.error('POST /support/sessions error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

function serialize(r) {
  return {
    id:         r.id,
    sessionId:  r.session_id,
    userId:     r.user_id,
    userCode:   r.user_code,
    username:   r.username,
    userAvatar: r.user_avatar || '👤',
    from:       r.from_role,
    text:       r.text,
    time:       new Date(r.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    createdAt:  new Date(r.created_at).getTime(),
  }
}

module.exports = router
