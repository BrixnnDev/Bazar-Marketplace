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
   POST /api/withdrawals
   Usuario crea una solicitud de retiro
══════════════════════════════════════ */
router.post('/', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    const { bankId, bankLabel, accountNumber, ownerName, nit, amount } = req.body

    if (!bankId || !accountNumber || !ownerName || !amount || Number(amount) <= 0)
      return res.status(400).json({ error: 'Faltan campos obligatorios.' })

    const amt = Number(amount)
    if (amt < 10000)
      return res.status(400).json({ error: 'El monto mínimo es $10,000 COP.' })

    await client.query('BEGIN')

    // Verificar saldo del usuario
    const userR = await client.query(
      'SELECT id, code, username, avatar, balance FROM users WHERE id=$1', [req.user.id]
    )
    if (userR.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Usuario no encontrado.' })
    }
    const u = userR.rows[0]
    if (Number(u.balance) < amt) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Saldo insuficiente. Disponible: $${Number(u.balance).toLocaleString('es-CO')}` })
    }

    const id = `W-${Date.now()}-${req.user.id}`

    await client.query(
      `INSERT INTO withdrawal_requests
         (id, user_id, user_code, username, user_avatar, bank_id, bank_label, account_number, owner_name, nit, amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')`,
      [id, u.id, u.code, u.username, u.avatar || '👤',
       bankId, bankLabel || bankId, accountNumber, ownerName, nit || null, amt]
    )

    // Notificación para todos los admins
    const admins = await client.query(`SELECT id FROM users WHERE role='administrador'`)
    for (const admin of admins.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, body, details)
         VALUES ($1, 'retiro', 'Solicitud de retiro recibida 💸',
           $2, $3)`,
        [
          admin.id,
          `${u.username} solicitó retirar $${amt.toLocaleString('es-CO')} COP.`,
          `Revisa las solicitudes de retiro para aprobar o rechazar.`,
        ]
      )
    }

    const r = await client.query('SELECT * FROM withdrawal_requests WHERE id=$1', [id])
    await client.query('COMMIT')

    res.status(201).json({ request: serializeReq(r.rows[0]) })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('POST /withdrawals error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

/* ══════════════════════════════════════
   GET /api/withdrawals/my
   Solicitudes del usuario actual
══════════════════════════════════════ */
router.get('/my', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM withdrawal_requests WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ requests: r.rows.map(serializeReq) })
  } catch (err) {
    console.error('GET /withdrawals/my error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   GET /api/withdrawals  (admin)
   Solo solicitudes de usuarios (no del admin)
══════════════════════════════════════ */
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM withdrawal_requests WHERE user_id != $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ requests: r.rows.map(serializeReq) })
  } catch (err) {
    console.error('GET /withdrawals error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ══════════════════════════════════════
   PATCH /api/withdrawals/:id/approve  (admin)
   Aprueba retiro — descuenta del saldo
══════════════════════════════════════ */
router.patch('/:id/approve', auth, adminOnly, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rr = await client.query(
      `SELECT * FROM withdrawal_requests WHERE id=$1 AND status='pending'`, [req.params.id]
    )
    if (rr.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada.' })
    }
    const request = rr.rows[0]

    // Verificar saldo suficiente
    const userR = await client.query('SELECT balance FROM users WHERE id=$1', [request.user_id])
    if (userR.rows.length === 0 || Number(userR.rows[0].balance) < Number(request.amount)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Saldo insuficiente para aprobar este retiro.' })
    }

    // Descontar del saldo
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [Number(request.amount), request.user_id]
    )

    // Actualizar estado
    await client.query(
      `UPDATE withdrawal_requests SET status='approved', processed_at=NOW() WHERE id=$1`,
      [req.params.id]
    )

    // Notificación al usuario
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, details)
       VALUES ($1, 'retiro', 'Retiro aprobado ✅',
         $2, $3)`,
      [
        request.user_id,
        `Tu solicitud de retiro por $${Number(request.amount).toLocaleString('es-CO')} COP fue aprobada.`,
        'El dinero será transferido a tu cuenta.',
      ]
    )

    const updated = await client.query('SELECT * FROM withdrawal_requests WHERE id=$1', [req.params.id])
    await client.query('COMMIT')

    res.json({ request: serializeReq(updated.rows[0]) })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('PATCH /withdrawals/approve error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

/* ══════════════════════════════════════
   PATCH /api/withdrawals/:id/deny  (admin)
══════════════════════════════════════ */
router.patch('/:id/deny', auth, adminOnly, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const rr = await client.query(
      `SELECT * FROM withdrawal_requests WHERE id=$1 AND status='pending'`, [req.params.id]
    )
    if (rr.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada.' })
    }
    const request = rr.rows[0]

    await client.query(
      `UPDATE withdrawal_requests SET status='denied', processed_at=NOW() WHERE id=$1`,
      [req.params.id]
    )

    // Notificación al usuario
    await client.query(
      `INSERT INTO notifications (user_id, type, title, body, details)
       VALUES ($1, 'retiro', 'Retiro rechazado ❌',
         $2, $3)`,
      [
        request.user_id,
        `Tu solicitud de retiro por $${Number(request.amount).toLocaleString('es-CO')} COP fue rechazada.`,
        'Si tienes dudas, contacta al administrador.',
      ]
    )

    const updated = await client.query('SELECT * FROM withdrawal_requests WHERE id=$1', [req.params.id])
    await client.query('COMMIT')

    res.json({ request: serializeReq(updated.rows[0]) })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('PATCH /withdrawals/deny error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

function serializeReq(r) {
  return {
    id:            r.id,
    userCode:      r.user_code,
    username:      r.username,
    userAvatar:    r.user_avatar || '👤',
    bankId:        r.bank_id,
    bankLabel:     r.bank_label || r.bank_id,
    accountNumber: r.account_number,
    ownerName:     r.owner_name,
    nit:           r.nit || null,
    amount:        Number(r.amount),
    status:        r.status,
    createdAt:     new Date(r.created_at).getTime(),
    processedAt:   r.processed_at ? new Date(r.processed_at).getTime() : null,
  }
}

module.exports = router
