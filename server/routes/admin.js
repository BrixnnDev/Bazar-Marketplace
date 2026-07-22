const express = require('express')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')

const router = express.Router()
const JWT_SECRET      = 'bazar_super_secret_key_2026_xK9mP2nQ'
const ADMIN_WALLET    = 9999999999999

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Sin token.' })
  try { req.user = jwt.verify(header.split(' ')[1], JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Token inválido.' }) }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'administrador')
    return res.status(403).json({ error: 'Acceso denegado.' })
  next()
}

/* ── GET /api/admin/user-by-code/:code ── */
router.get('/user-by-code/:code', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, code, username, full_name, email, role, avatar, balance, credits, is_active
       FROM users WHERE UPPER(code) = UPPER($1)`,
      [req.params.code]
    )
    if (r.rows.length === 0)
      return res.status(404).json({ error: 'No existe una cuenta con ese código.' })
    const u = r.rows[0]
    res.json({ user: {
      id: u.id, code: u.code, username: u.username,
      name: u.full_name || u.username,
      avatar: u.avatar || '👤',
      balance: Number(u.balance || 0),
      credits: Number(u.credits || 0),
      is_active: u.is_active,
    }})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── GET /api/admin/users — todos los usuarios incluido admin ── */
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, username, full_name, email, role, avatar,
              balance, credits, profile_completed, phone,
              doc_type, doc_number, is_active, created_at
       FROM users
       ORDER BY
         CASE WHEN role='administrador' THEN 0 ELSE 1 END,
         created_at DESC`
    )
    const users = result.rows.map(u => {
      const fullName  = u.full_name?.trim() || ''
      const parts     = fullName ? fullName.split(/\s+/).filter(Boolean) : []
      const isAdmin   = u.role === 'administrador'
      return {
        ...u,
        name:      parts[0]                 || u.username || 'Usuario',
        lastName:  parts.slice(1).join(' ') || '',
        status:    u.is_active ? 'activo' : 'suspendido',
        joined:    u.created_at
          ? new Date(u.created_at).toLocaleDateString('es-ES', { month:'short', day:'numeric', year:'numeric' })
          : '',
        avatar:    u.avatar || (isAdmin ? '👑' : '👤'),
        balance:   isAdmin ? ADMIN_WALLET : Number(u.balance || 0),
        credits:   isAdmin ? ADMIN_WALLET : Number(u.credits || 0),
        nequi:     u.phone || '',
        sold:      0,
        bought:    0,
      }
    })
    res.json({ users })
  } catch (err) {
    console.error('Admin/users error:', err.message)
    res.status(500).json({ error: 'No se pudo cargar la lista de usuarios.' })
  }
})

/* ── POST /api/admin/recharge ── */
router.post('/recharge', auth, adminOnly, async (req, res) => {
  try {
    const { code, type, amount, note } = req.body
    if (!code || !type || !amount || Number(amount) <= 0)
      return res.status(400).json({ error: 'Datos incompletos.' })
    if (!['balance', 'credits'].includes(type))
      return res.status(400).json({ error: 'Tipo inválido.' })

    const col = type === 'balance' ? 'balance' : 'credits'
    await pool.query('BEGIN')

    const target = await pool.query(
      `SELECT id FROM users WHERE UPPER(code) = UPPER($1)`, [code]
    )
    if (target.rows.length === 0) {
      await pool.query('ROLLBACK')
      return res.status(404).json({ error: 'Cuenta no encontrada.' })
    }

    await pool.query(
      `UPDATE users SET ${col} = ${col} + $1 WHERE id = $2`,
      [Number(amount), target.rows[0].id]
    )
    const updated = await pool.query(
      `SELECT id, code, username, balance, credits FROM users WHERE id = $1`,
      [target.rows[0].id]
    )
    await pool.query('COMMIT')
    res.json({ message: 'Recarga aplicada.', user: updated.rows[0], note })
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: err.message })
  }
})

/* ── POST /api/admin/set-balance — establece saldo y créditos exactos ── */
router.post('/set-balance', auth, adminOnly, async (req, res) => {
  try {
    const { code, balance, credits } = req.body
    if (!code) return res.status(400).json({ error: 'Falta el código.' })

    const r = await pool.query(
      `UPDATE users SET balance=$1, credits=$2 WHERE UPPER(code)=UPPER($3)
       RETURNING id, code, username, balance, credits`,
      [Number(balance ?? 0), Number(credits ?? 0), code]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' })
    res.json({ message: 'Saldo actualizado.', user: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── PATCH /api/admin/users/:id — actualiza rol, estado, nequi ── */
router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { role, status, nequi } = req.body
    const isActive = status === 'activo' ? true : status === 'suspendido' ? false : undefined

    const sets   = []
    const values = []
    let i = 1

    if (role)             { sets.push(`role=$${i++}`);      values.push(role) }
    if (isActive !== undefined) { sets.push(`is_active=$${i++}`); values.push(isActive) }
    if (nequi !== undefined)    { sets.push(`phone=$${i++}`);     values.push(nequi) }

    if (sets.length === 0) return res.json({ message: 'Sin cambios.' })

    values.push(req.params.id)
    const r = await pool.query(
      `UPDATE users SET ${sets.join(',')} WHERE id=$${i} RETURNING id, code, username, role, is_active`,
      values
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' })
    res.json({ message: 'Usuario actualizado.', user: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── POST /api/admin/deduct ── */
router.post('/deduct', auth, adminOnly, async (req, res) => {
  try {
    const { code, type } = req.body
    if (!code || !type) return res.status(400).json({ error: 'Datos incompletos.' })
    if (!['balance', 'credits', 'all'].includes(type))
      return res.status(400).json({ error: 'Tipo inválido.' })

    let q
    if      (type === 'balance') q = `UPDATE users SET balance=0 WHERE UPPER(code)=UPPER($1) RETURNING id,code,username,balance,credits`
    else if (type === 'credits') q = `UPDATE users SET credits=0 WHERE UPPER(code)=UPPER($1) RETURNING id,code,username,balance,credits`
    else                         q = `UPDATE users SET balance=0,credits=0 WHERE UPPER(code)=UPPER($1) RETURNING id,code,username,balance,credits`

    const r = await pool.query(q, [code])
    if (r.rows.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada.' })
    res.json({ message: 'Operación completada.', user: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── PATCH /api/admin/users/:id/verify — verificar un usuario ── */
router.patch('/users/:id/verify', auth, adminOnly, async (req, res) => {
  try {
    const r = await pool.query(
      `UPDATE users SET is_verified=TRUE WHERE id=$1 RETURNING id, code, username, email, is_verified`,
      [req.params.id]
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' })
    res.json({ message: 'Usuario verificado.', user: r.rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── DELETE /api/admin/users/:id ──
   Eliminar un usuario (no admin) ── */
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const uid = Number(req.params.id)
    const check = await pool.query('SELECT id, role, email FROM users WHERE id=$1', [uid])
    if (check.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' })
    if (check.rows[0].role === 'administrador') return res.status(400).json({ error: 'No se puede eliminar un admin.' })

    await pool.query('DELETE FROM users WHERE id=$1', [uid])
    res.json({ message: 'Usuario eliminado.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── POST /api/admin/reset-database ──
   Elimina TODOS los usuarios, productos, compras, etc.
   Solo deja el admin. ⚠️ IRREVERSIBLE */
router.post('/reset-database', auth, adminOnly, async (req, res) => {
  try {
    const setupDatabase = require('../database/setupInline')
    await setupDatabase()
    res.json({ message: 'Base de datos reiniciada. Solo queda el admin.' })
  } catch (err) {
    console.error('Reset DB error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
