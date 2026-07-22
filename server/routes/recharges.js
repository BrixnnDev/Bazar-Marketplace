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

/* ══════════════════════════════════════
   POST /api/recharges
   Usuario crea una solicitud de recarga
══════════════════════════════════════ */
router.post('/', auth, async (req, res) => {
  try {
    const { accountName, accountNumber, amount, method, imgPreview, type = 'balance' } = req.body

    if (!accountName || !accountNumber || !amount || Number(amount) <= 0)
      return res.status(400).json({ error: 'Faltan campos obligatorios.' })

    // Obtener datos del usuario
    const userR = await pool.query(
      'SELECT id, code, username, avatar FROM users WHERE id=$1', [req.user.id]
    )
    if (userR.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' })
    const u = userR.rows[0]

    const id = `R-${Date.now()}-${req.user.id}`

    await pool.query(
      `INSERT INTO recharge_requests
         (id, user_id, user_code, username, user_avatar, account_name, account_number, amount, type, method, img_preview, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')`,
      [id, u.id, u.code, u.username, u.avatar || '👤',
       accountName, accountNumber, Number(amount), type, method, imgPreview || null]
    )

    const r = await pool.query('SELECT * FROM recharge_requests WHERE id=$1', [id])
    res.status(201).json({ request: serializeReq(r.rows[0]) })
  } catch (err) {
    console.error('POST /recharges error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   GET /api/recharges/my
   Lista solicitudes del usuario actual
══════════════════════════════════════ */
router.get('/my', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM recharge_requests WHERE user_id=$1 ORDER BY created_at DESC`,
      [req.user.id]
    )
    res.json({ requests: r.rows.map(serializeReq) })
  } catch (err) {
    console.error('GET /recharges/my error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   GET /api/recharges  (solo admin)
   Lista todas las solicitudes
══════════════════════════════════════ */
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM recharge_requests ORDER BY created_at DESC')
    res.json({ requests: r.rows.map(serializeReq) })
  } catch (err) {
    console.error('GET /recharges error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   PATCH /api/recharges/:id/approve  (solo admin)
   Aprueba una solicitud y acredita el saldo
══════════════════════════════════════ */
router.patch('/:id/approve', auth, adminOnly, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rr = await client.query(
      `SELECT * FROM recharge_requests WHERE id=$1 AND status='pending'`, [req.params.id]
    )
    if (rr.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada.' })
    }
    const request = rr.rows[0]
    const col = request.type === 'credits' ? 'credits' : 'balance'

    await client.query(
      `UPDATE users SET ${col} = ${col} + $1 WHERE id = $2`,
      [Number(request.amount), request.user_id]
    )

    // Descontar del saldo del admin (su dinero financia la plataforma)
    await client.query(
      `UPDATE users SET balance = balance - $1 WHERE id = $2 AND role = 'administrador'`,
      [Number(request.amount), req.user.id]
    )
    await client.query(
      `UPDATE recharge_requests SET status='approved', processed_at=NOW() WHERE id=$1`,
      [req.params.id]
    )

    // Notificación para el usuario
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, details)
       VALUES ($1, 'recarga', 'Recarga aprobada ✅',
         $2, $3)`,
      [
        request.user_id,
        `Tu solicitud de recarga por $${Number(request.amount).toLocaleString('es-CO')} COP fue aprobada.`,
        'El dinero ya está disponible en tu saldo.',
      ]
    )

    const updated = await client.query('SELECT * FROM recharge_requests WHERE id=$1', [req.params.id])
    const userR   = await client.query(`SELECT id, code, username, balance, credits FROM users WHERE id=$1`, [request.user_id])

    await client.query('COMMIT')
    res.json({
      request: serializeReq(updated.rows[0]),
      user:    userR.rows[0],
    })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('PATCH /recharges/approve error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

/* ══════════════════════════════════════
   PATCH /api/recharges/:id/deny  (solo admin)
══════════════════════════════════════ */
router.patch('/:id/deny', auth, adminOnly, async (req, res) => {
  try {
    await pool.query(
      `UPDATE recharge_requests SET status='denied', processed_at=NOW() WHERE id=$1 AND status='pending'`,
      [req.params.id]
    )
    const r = await pool.query('SELECT * FROM recharge_requests WHERE id=$1', [req.params.id])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada.' })
    res.json({ request: serializeReq(r.rows[0]) })
  } catch (err) {
    console.error('PATCH /recharges/deny error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

function serializeReq(r) {
  return {
    id:            r.id,
    userCode:      r.user_code,
    username:      r.username,
    userAvatar:    r.user_avatar || '👤',
    accountName:   r.account_name,
    accountNumber: r.account_number,
    amount:        Number(r.amount),
    type:          r.type,
    method:        r.method,
    imgPreview:    r.img_preview || null,
    status:        r.status,
    createdAt:     new Date(r.created_at).getTime(),
    processedAt:   r.processed_at ? new Date(r.processed_at).getTime() : null,
  }
}

module.exports = router
