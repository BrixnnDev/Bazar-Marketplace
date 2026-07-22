const express  = require('express')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const pool     = require('../config/db')

const router = express.Router()
const JWT_SECRET = 'bazar_super_secret_key_2026_xK9mP2nQ'
const _ADMIN_WALLET_AMOUNT = 999999999999

/* ── Generar código único de usuario: #B + 8 dígitos ── */
function genUserCode() {
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString() // 8 dígitos
  return '#B' + digits
}

function serializeUser(user) {
  const fullName = user.full_name?.trim() || ''
  const fullNameParts = fullName ? fullName.split(/\s+/) : []
  const name = fullNameParts[0] || user.username || ''
  const lastName = fullNameParts.slice(1).join(' ') || ''

  return {
    id: user.id,
    code: user.code,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    balance: Number(user.balance ?? 0),
    credits: Number(user.credits ?? 0),
    profile_completed: user.profile_completed ?? false,
    full_name: fullName || null,
    name,
    lastName,
    doc_type: user.doc_type ?? null,
    doc_number: user.doc_number ?? null,
    phone: user.phone ?? null,
    city: user.city ?? null,
    is_verified: user.is_verified ?? false,
    is_active: user.is_active ?? true,
    created_at: user.created_at ?? null,
  }
}


/* ── Generar código de 6 dígitos ── */
function genVerifyCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/* ──────────────────────────────────────
   GET /api/auth/check-username
   Verifica si un username ya está en uso
────────────────────────────────────── */
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query
    if (!username) return res.json({ taken: false })
    const r = await pool.query('SELECT id FROM users WHERE LOWER(username)=LOWER($1)', [username])
    res.json({ taken: r.rows.length > 0 })
  } catch {
    res.status(500).json({ taken: false })
  }
})

/* ──────────────────────────────────────
   POST /api/auth/register
────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos.' })

    if (password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 6 caracteres.' })

    const exists = await pool.query(
      'SELECT id FROM users WHERE email=$1 OR username=$2',
      [email, username]
    )
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'El correo o usuario ya está en uso.' })

    /* Código único de usuario */
    let code, dup = true
    while (dup) {
      code = genUserCode()
      const c = await pool.query('SELECT id FROM users WHERE code=$1', [code])
      dup = c.rows.length > 0
    }

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.query(
      `INSERT INTO users (code, username, email, password_hash, role, avatar, is_verified, balance, credits)
       VALUES ($1,$2,$3,$4,'usuario','👤',false,0,0)
       RETURNING id, code, username, email`,
      [code, username, email, hash]
    )
    const user = result.rows[0]

    /* Guardar código de verificación */
    const verifyCode = genVerifyCode()
    const expiresAt  = new Date(Date.now() + 10 * 60 * 1000)

    await pool.query(
      `INSERT INTO email_verifications (user_id, code, expires_at) VALUES ($1,$2,$3)`,
      [user.id, verifyCode, expiresAt]
    )

    /* Intentar enviar correo de verificación */
    let codeSent = false
    try {
      const { sendVerificationEmail } = require('../services/mailer')
      await Promise.race([
        sendVerificationEmail(email, username, verifyCode),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Mail timeout')), 10000)),
      ])
      codeSent = true
    } catch (mailErr) {
      console.warn('⚠️  Correo no enviado:', mailErr.message)
      console.log(`📧 CÓDIGO VERIFICACIÓN [${email}]: ${verifyCode}`)
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      message: codeSent
        ? 'Cuenta creada. Revisa tu correo para verificar.'
        : 'Cuenta creada. No se pudo enviar el correo.',
      userId: user.id,
      code:   user.code,
      token,
      verifyCode,
      user:   serializeUser({ ...result.rows[0], is_verified: false }),
    })

  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Error al crear la cuenta: ' + err.message })
  }
})

/* ──────────────────────────────────────
   POST /api/auth/verify-email
────────────────────────────────────── */
router.post('/verify-email', async (req, res) => {
  try {
    const { userId, code } = req.body

    const result = await pool.query(
      `SELECT * FROM email_verifications
       WHERE user_id=$1 AND code=$2 AND used=false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    )

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Código inválido o expirado.' })

    await pool.query('UPDATE email_verifications SET used=true WHERE id=$1', [result.rows[0].id])
    await pool.query('UPDATE users SET is_verified=true WHERE id=$1', [userId])

    const user = await pool.query(
      `SELECT id, code, username, email, role, avatar, balance, credits,
              profile_completed, full_name, doc_type, doc_number, phone,
              city, is_verified, is_active, created_at
       FROM users WHERE id=$1`,
      [userId]
    )

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ message: '¡Cuenta verificada!', token, user: serializeUser(user.rows[0]) })

  } catch (err) {
    console.error('Verify error:', err.message)
    res.status(500).json({ error: 'Error al verificar: ' + err.message })
  }
})

/* ──────────────────────────────────────
   POST /api/auth/login
────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' })

    const result = await pool.query(
      `SELECT id, code, username, email, role, avatar, balance, credits,
              profile_completed, full_name, doc_type, doc_number, phone,
              city, is_verified, is_active, password_hash, created_at
       FROM users WHERE email=$1 AND is_active=true`,
      [email]
    )

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Credenciales incorrectas.' })

    const user = result.rows[0]

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return res.status(401).json({ error: 'Credenciales incorrectas.' })

    if (!user.is_verified)
      return res.status(403).json({
        error: 'Cuenta no verificada. Revisa tu correo.',
        userId: user.id,
        needsVerification: true,
      })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Notificación de inicio de sesión (solo una por día)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const existing = await pool.query(
        `SELECT id FROM notifications WHERE user_id=$1 AND type='sistema'
         AND title='Inicio de sesión' AND created_at::date = $2::date LIMIT 1`,
        [user.id, today]
      )
      if (existing.rows.length === 0) {
        const now = new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, body)
           VALUES ($1,'sistema','Inicio de sesión',$2)`,
          [user.id, `Bienvenido ${user.username} 👋 — sesión iniciada el ${now}.`]
        )
      }
    } catch { /* empty */ }

    res.json({
      token,
      user: serializeUser(user),
    })

  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Error al iniciar sesión: ' + err.message })
  }
})

/* ──────────────────────────────────────
   POST /api/auth/resend-code
────────────────────────────────────── */
router.post('/resend-code', async (req, res) => {
  try {
    const { userId } = req.body

    const user = await pool.query(
      'SELECT id, username, email FROM users WHERE id=$1 AND is_verified=false',
      [userId]
    )
    if (user.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado.' })

    const verifyCode = genVerifyCode()
    const expiresAt  = new Date(Date.now() + 10 * 60 * 1000)

    await pool.query('UPDATE email_verifications SET used=true WHERE user_id=$1', [userId])
    await pool.query(
      `INSERT INTO email_verifications (user_id, code, expires_at) VALUES ($1,$2,$3)`,
      [userId, verifyCode, expiresAt]
    )

    let codeSent = false
    try {
      const { sendVerificationEmail } = require('../services/mailer')
      await Promise.race([
        sendVerificationEmail(user.rows[0].email, user.rows[0].username, verifyCode),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Mail timeout')), 10000)),
      ])
      codeSent = true
    } catch {
      console.log(`📧 CÓDIGO REENVIADO para ${user.rows[0].email}: ${verifyCode}`)
    }

    res.json({ message: 'Código reenviado.', verifyCode })
  } catch (err) {
    console.error('Resend error:', err.message)
    res.status(500).json({ error: 'Error al reenviar: ' + err.message })
  }
})

/* ──────────────────────────────────────
   GET /api/auth/me  (verificar token)
────────────────────────────────────── */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'Sin token.' })

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await pool.query(
      `SELECT id, code, username, email, role, avatar, balance, credits,
              profile_completed, full_name, doc_type, doc_number, phone,
              city,
              is_verified, is_active, created_at
       FROM users WHERE id=$1`,
      [decoded.id]
    )
    if (user.rows.length === 0) return res.status(401).json({ error: 'Usuario no encontrado.' })

    res.json({ user: serializeUser(user.rows[0]) })
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
  }
})

/* ──────────────────────────────────────
   GET /api/auth/sessions
   Devuelve sesiones activas del usuario
───────────────────────────────────── */
function normalizeIP(raw) {
  if (!raw) return '127.0.0.1'
  let ip = raw.split(',')[0].trim()
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1'
  if (ip.startsWith('::ffff:')) ip = ip.slice(7)
  return ip
}

router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'Sin token.' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const ip = normalizeIP(
      req.headers['x-forwarded-for']
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
    )
    const ua = req.headers['user-agent'] || 'Desconocido'
    const browser = ua.includes('Chrome') ? 'Chrome'
      : ua.includes('Firefox') ? 'Firefox'
      : ua.includes('Safari') ? 'Safari'
      : ua.includes('Edge') ? 'Edge'
      : 'Otro'
    const device = ua.includes('Mobile') ? '📱 Móvil' : '💻 Escritorio'

    res.json({
      sessions: [{
        id: decoded.id,
        ip,
        device,
        browser,
        userAgent: ua,
        current: true,
        createdAt: new Date().toISOString(),
      }]
    })
  } catch {
    res.status(401).json({ error: 'Token inválido.' })
  }
})

/* ── Test de correo (solo para debugging) ── */
router.get('/test-email', async (req, res) => {
  try {
    const to = req.query.to
    if (!to) return res.status(400).json({ ok: false, error: 'Falta ?to=correo@gmail.com' })

    const { sendVerificationEmail } = require('../services/mailer')
    const data = await sendVerificationEmail(to, 'TestUser', '123456')
    res.json({ ok: true, id: data.id, message: 'Correo enviado.' })
  } catch (err) {
    console.error('Test email error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

module.exports = router
