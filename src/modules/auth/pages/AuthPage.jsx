import API_BASE from '../../../config/api'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../../context/UserContext'

import {
  MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdArrowBack, MdBadge, MdWarning, MdCheckCircle,
} from 'react-icons/md'

function normalizeUserForSession(user) {
  const fullName = user?.full_name?.trim() || ''
  const fullNameParts = fullName ? fullName.split(/\s+/).filter(Boolean) : []
  const firstName = fullNameParts[0] || user?.name?.trim() || ''
  const lastName = fullNameParts.slice(1).join(' ') || user?.lastName?.trim() || ''
  const username = user?.username?.trim() || user?.email?.split('@')[0] || 'usuario'

  return {
    ...user,
    username,
    name: firstName || username || 'Usuario',
    lastName,
    full_name: fullName || null,
  }
}

export default function AuthPage() {
  const [mode, setMode]           = useState('login')
  const [showPass, setShowPass]   = useState(false)
  const [pending, setPending]     = useState(null)
  const [serverDown, setServerDown] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useUser()

  // Verificar conexión al servidor al montar la página
  useEffect(() => {
    let cancelled = false
    async function checkServer() {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) })
        if (!cancelled) setServerDown(!res.ok)
      } catch {
        if (!cancelled) setServerDown(true)
      }
    }
    checkServer()
    const iv = setInterval(checkServer, 8000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [])

  function handleRegisterDone(userId, email, verifyCode) {
    setPending({ userId, email, verifyCode })
    setMode('verify')
  }

  function handleNeedsVerify({ userId, email }) {
    setPending({ userId, email })
    setMode('verify')
  }

  function handleUpdateCode(newCode) {
    setPending(prev => prev ? { ...prev, verifyCode: newCode } : prev)
  }

  function handleLoginSuccess(userData) {
    const rawUser = userData.user || userData
    const user = normalizeUserForSession(rawUser)
    const token = userData.token || 'mock_token'

    /* Limpiar sesión anterior */
    localStorage.removeItem('bazar_token')
    localStorage.removeItem('bazar_user')
    localStorage.removeItem('bazar_session')

    /* Guardar nueva sesión */
    localStorage.setItem('bazar_token', token)
    localStorage.setItem('bazar_user', JSON.stringify(user))

    /* Guardar info de sesión para TabSesiones */
    const session = {
      ip: '127.0.0.1',
      device: navigator.userAgent.includes('Mobile') ? '📱 Móvil' : '💻 Escritorio',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome'
        : navigator.userAgent.includes('Firefox') ? 'Firefox'
        : navigator.userAgent.includes('Safari') ? 'Safari'
        : 'Otro',
      createdAt: new Date().toISOString(),
      current: true,
    }
    localStorage.setItem('bazar_session', JSON.stringify(session))
    setUser(user)

    /* Redirigir según rol y estado del perfil */
    const isAdmin   = user.role === 'administrador'
    const hasProfile = user.profile_completed

    if (isAdmin || hasProfile) {
      navigate('/dashboard')
    } else {
      navigate('/complete-profile')
    }
  }

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'var(--bg-primary)',
      display: 'flex', position: 'fixed', inset: 0, overflow: 'hidden',
    }}>
      <style>{`
        @keyframes floatOrb { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.04)} }
        @keyframes glow-dot2 { 0%,100%{opacity:0.5;box-shadow:0 0 8px #00e676} 50%{opacity:1;box-shadow:0 0 20px #00e676} }
        .social-btn:hover { border-color: rgba(0,230,118,0.5) !important; background: rgba(0,230,118,0.06) !important; transform: translateY(-2px); }
      `}</style>

      {/* ── Banner servidor caído — overlay centrado ── */}
      {serverDown && <ServerDownBanner />}

      {/* ── FONDO COMÚN — grid de líneas + glows ── */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,230,118,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,230,118,0.05) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', top:'-150px', left:'-150px', width:'500px', height:'500px', background:'radial-gradient(circle,rgba(0,230,118,0.07) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'-120px', right:'-120px', width:'420px', height:'420px', background:'radial-gradient(circle,rgba(100,181,246,0.06) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />

      {/* ── LADO IZQUIERDO — Branding + cajas en círculo ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px', position:'relative', zIndex:1 }}>

        {/* Degradado que oscurece los bordes para que el grid no tape */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 85% 85% at 50% 50%,rgba(10,15,13,0) 30%,rgba(10,15,13,0.75) 100%)', pointerEvents:'none' }} />

        {/* Cajas flotantes en círculo — radio grande para no tapar texto */}
        {[
          { emoji:'📱', cat:'Electrónica',  color:'#00e676', angle:0   },
          { emoji:'💻', cat:'Computadores', color:'#64b5f6', angle:60  },
          { emoji:'🎮', cat:'Gaming',       color:'#ce93d8', angle:120 },
          { emoji:'⌚', cat:'Accesorios',   color:'#ffa726', angle:180 },
          { emoji:'📷', cat:'Fotografía',   color:'#f48fb1', angle:240 },
          { emoji:'🎧', cat:'Audio',        color:'#69f0ae', angle:300 },
        ].map((b, i) => {
          const rad = (b.angle * Math.PI) / 180
          const R   = 200   // radio del círculo
          const cx  = Math.cos(rad) * R
          const cy  = Math.sin(rad) * R
          return (
            <div key={i} style={{
              position:'absolute',
              left:`calc(50% + ${cx}px - 52px)`,
              top: `calc(50% + ${cy}px - 38px)`,
              width:'104px', height:'76px',
              borderRadius:'14px',
              background:`${b.color}10`,
              border:`1px solid ${b.color}30`,
              backdropFilter:'blur(12px)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px',
              animation:`floatOrb ${5 + i * 0.6}s ease-in-out infinite`,
              animationDelay:`${i * 0.5}s`,
              zIndex:1,
            }}>
              <span style={{ fontSize:'22px', filter:`drop-shadow(0 2px 8px ${b.color}50)` }}>{b.emoji}</span>
              <span style={{ fontSize:'8px', color:b.color, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>{b.cat}</span>
            </div>
          )
        })}

        {/* Texto central */}
        <div style={{ position:'relative', textAlign:'center', zIndex:2 }}>
          <div style={{ marginBottom:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <h1 style={{ fontSize:'64px', fontWeight:900, background:'linear-gradient(135deg,#00e676,#00c853,#69f0ae)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-3px', lineHeight:1, margin:0, filter:'drop-shadow(0 0 40px rgba(0,230,118,0.35))' }}>
              Bazar
            </h1>
          </div>
          <p style={{ fontSize:'10px', color:'rgba(0,230,118,0.4)', letterSpacing:'4px', textTransform:'uppercase', fontWeight:700, marginBottom:'16px' }}>marketplace</p>
          <p style={{ fontSize:'14px', color:'rgba(165,214,167,0.5)', maxWidth:'270px', lineHeight:1.8, margin:'0 auto 20px' }}>
            El marketplace colombiano para comprar, vender y ganar dinero fácil.
          </p>
          <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap' }}>
            {['🇨🇴 Colombia','⚡ Tiempo real','🔒 Seguro'].map(t => (
              <span key={t} style={{ padding:'4px 10px', borderRadius:'999px', background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.18)', fontSize:'10px', color:'#00e676', fontWeight:600 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── LADO DERECHO — Formulario ── */}
      <div style={{ width:'460px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', zIndex:2, overflowY:'auto', position:'relative' }}>

        {/* Botón volver — fijo en esquina superior izquierda de TODA la pantalla */}
        <button
          onClick={() => navigate('/')}
          style={{ position:'fixed', top:'20px', left:'20px', display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.4)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:'10px', padding:'8px 14px', color:'rgba(165,214,167,0.6)', cursor:'pointer', fontSize:'12px', fontWeight:600, transition:'all 0.2s', zIndex:200, backdropFilter:'blur(8px)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,230,118,0.5)'; e.currentTarget.style.color='var(--green-primary)'; e.currentTarget.style.background='rgba(0,230,118,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,230,118,0.2)'; e.currentTarget.style.color='rgba(165,214,167,0.6)'; e.currentTarget.style.background='rgba(0,0,0,0.4)' }}>
          <MdArrowBack size={14}/> Volver al inicio
        </button>
        {/* Panel glassmorphism */}
        <div style={{ width:'100%', maxWidth:'400px', background:'rgba(15,26,20,0.75)', backdropFilter:'blur(24px)', border:'1px solid rgba(0,230,118,0.1)', borderRadius:'20px', padding:'32px 28px' }}>

          {/* Cabecera del panel */}
          <div style={{ textAlign:'center', marginBottom:'22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', marginBottom:'4px' }}>
              <span style={{ fontSize:'20px', fontWeight:900, background:'linear-gradient(135deg,#00e676,#00c853)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.5px' }}>Bazar</span>
              <span style={{ fontSize:'8px', color:'rgba(0,230,118,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontWeight:700 }}>marketplace</span>
            </div>
            <p style={{ color:'var(--text-secondary)', fontSize:'12px', margin:0 }}>
              {mode === 'login'    && 'Ingresa a tu cuenta'}
              {mode === 'register' && 'Crea tu cuenta gratis'}
              {mode === 'verify'   && 'Verifica tu correo'}
              {mode === 'forgot'   && 'Recupera tu contraseña'}
            </p>
          </div>

          {/* Tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{ display:'flex', background:'rgba(0,0,0,0.35)', borderRadius:'10px', padding:'3px', marginBottom:'20px' }}>
              {['login','register'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', background: mode===m ? 'rgba(0,230,118,0.14)' : 'transparent', color: mode===m ? 'var(--green-primary)' : 'var(--text-muted)', fontWeight: mode===m ? 700 : 400, fontSize:'13px', cursor:'pointer', transition:'all 0.2s' }}>
                  {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>
          )}

          {/* Volver */}
          {(mode === 'forgot' || mode === 'verify') && (
            <button onClick={() => setMode('login')}
              style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none', color:'var(--text-secondary)', fontSize:'12px', cursor:'pointer', marginBottom:'16px', padding:0 }}>
              <MdArrowBack size={14}/> Volver
            </button>
          )}

          {mode === 'login'    && <LoginForm    showPass={showPass} setShowPass={setShowPass} onForgot={() => setMode('forgot')} onSuccess={handleLoginSuccess} onNeedsVerify={handleNeedsVerify} />}
          {mode === 'register' && <RegisterForm showPass={showPass} setShowPass={setShowPass} onDone={handleRegisterDone} />}
          {mode === 'verify'   && <VerifyForm   pending={pending} onSuccess={handleLoginSuccess} onUpdateCode={handleUpdateCode} />}
          {mode === 'forgot'   && <ForgotForm />}
        </div>
      </div>
    </div>
  )
}

/* ══════════ LOGIN ══════════ */
function LoginForm({ showPass, setShowPass, onForgot, onSuccess, onNeedsVerify }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Cuenta no verificada → ir directo al formulario de código
        if (data.needsVerification && data.userId) {
          onNeedsVerify({ userId: data.userId, email })
          return
        }
        const msg = data.error || ''
        if (msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credenciales'))
          setError('Contraseña incorrecta. Verifica e intenta de nuevo.')
        else if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email') || msg.toLowerCase().includes('usuario'))
          setError('Correo electrónico no registrado.')
        else if (msg.toLowerCase().includes('suspendid') || msg.toLowerCase().includes('activ'))
          setError('Cuenta suspendida. Contacta al soporte.')
        else
          setError('Datos incorrectos. Verifica tu correo y contraseña.')
        return
      }
      onSuccess(data)
    } catch {
      setError('__server_down__')
    } finally { setLoading(false) }  }

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
      {error && error !== '__server_down__' && <ErrBox msg={error} />}
      <Field icon={<MdEmail size={16}/>} type="email" placeholder="Correo electrónico" value={email} onChange={e => { setEmail(e.target.value); setError('') }} required />
      <PassField show={showPass} toggle={() => setShowPass(!showPass)} value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
      <div style={{ textAlign:'right', marginTop:'-4px' }}>
        <button type="button" onClick={onForgot} style={{ background:'none', border:'none', color:'var(--green-primary)', fontSize:'11px', cursor:'pointer' }}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      <button type="submit" className="btn-primary" disabled={loading} style={{ padding:'12px', fontSize:'14px', opacity:loading?0.7:1, borderRadius:'10px' }}>
        {loading ? 'Verificando...' : 'Iniciar sesión'}
      </button>
      <SocialSection />
    </form>
  )
}

/* ══════════ REGISTER ══════════ */
function RegisterForm({ showPass, setShowPass, onDone }) {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [userOk, setUserOk]     = useState(null) // null | true | false

  // Verificar username único en tiempo real
  useEffect(() => {
    if (!username || username.length < 3) { setUserOk(null); return } // eslint-disable-line react-hooks/set-state-in-effect
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-username?username=${encodeURIComponent(username)}`)
        const d   = await res.json()
        setUserOk(!d.taken)
      } catch { setUserOk(null) }
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (userOk === false) { setError('Ese nombre de usuario ya está en uso.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6)  { setError('Mínimo 6 caracteres.'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/register`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al crear la cuenta.'); return }
      if (data.verifyCode) alert(`⚠️ Modo dev: Tu código es ${data.verifyCode}`)
      onDone(data.userId, email, data.verifyCode)
    } catch { setError('No se pudo conectar al servidor.') }
    finally { setLoading(false) }
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['transparent','#ef5350','#ffa726','#00e676'][strength]

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
        {error && <ErrBox msg={error} />}

        {/* Username con indicador */}
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.5)', display:'flex', zIndex:1 }}><MdBadge size={16}/></span>
          <input className="input-dark" type="text" placeholder="Nombre de usuario" value={username}
            onChange={e => setUsername(e.target.value)} required
            style={{ width:'100%', padding:'10px 32px 10px 34px', fontSize:'13px',
              borderColor: userOk === true ? 'rgba(0,230,118,0.5)' : userOk === false ? 'rgba(239,83,80,0.5)' : undefined }} />
          {userOk !== null && (
            <span style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'13px' }}>
              {userOk ? '✅' : '❌'}
            </span>
          )}
        </div>
        {userOk === false && <p style={{ fontSize:'10px', color:'#ef5350', margin:'-4px 0' }}>Ese usuario ya existe</p>}

        <Field icon={<MdEmail size={16}/>} type="email" placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required />

        {/* Contraseña con barra de fuerza */}
        <div>
          <PassField show={showPass} toggle={() => setShowPass(!showPass)} placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
          {password.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'4px' }}>
              <div style={{ flex:1, height:'2px', background:'rgba(0,0,0,0.3)', borderRadius:'999px' }}>
                <div style={{ width:`${[0,33,66,100][strength]}%`, height:'100%', background:strengthColor, borderRadius:'999px', transition:'all 0.3s' }} />
              </div>
              <span style={{ fontSize:'9px', color:strengthColor, fontWeight:700, flexShrink:0 }}>
                {['','Débil','Media','Fuerte'][strength]}
              </span>
            </div>
          )}
        </div>

        <PassField show={showPass} toggle={() => setShowPass(!showPass)} placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} />

        {/* Requisitos compactos */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 8px' }}>
          {[
            { ok: password.length >= 6, t:'6+ chars' },
            { ok: /[A-Z]/.test(password), t:'Mayúscula' },
            { ok: /[0-9]/.test(password), t:'Número' },
            { ok: password === confirm && confirm.length > 0, t:'Coinciden' },
          ].map((r,i) => (
            <span key={i} style={{ fontSize:'9px', color: r.ok ? '#00e676' : 'rgba(165,214,167,0.25)', display:'flex', alignItems:'center', gap:'3px' }}>
              {r.ok ? '✓' : '○'} {r.t}
            </span>
          ))}
        </div>

        <button type="submit" className="btn-primary" disabled={loading || userOk === false}
          style={{ padding:'11px', fontSize:'13px', opacity: (loading || userOk === false) ? 0.65 : 1, borderRadius:'10px' }}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>

        <p style={{ fontSize:'10px', color:'rgba(165,214,167,0.3)', textAlign:'center', margin:0 }}>
          Al registrarte aceptas los <span style={{ color:'var(--green-primary)', cursor:'pointer' }}>términos</span>
        </p>
      </form>
  )
}

/* ══════════ VERIFY — 6 dígitos ══════════ */
function VerifyForm({ pending, onSuccess, onUpdateCode }) {
  const [digits, setDigits]   = useState(() => {
    if (pending?.verifyCode) return pending.verifyCode.split('')
    return ['','','','','','']
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [resent, setResent]   = useState(false)
  const refs = useRef([])

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]; next[i] = val; setDigits(next)
    if (val && i < 5) refs.current[i+1]?.focus()
  }

  function handleKey(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i-1]?.focus()
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (text.length === 6) { setDigits(text.split('')); refs.current[5]?.focus() }
    e.preventDefault()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const code = digits.join('')
    if (code.length < 6) { setError('Ingresa los 6 dígitos.'); return }

    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: pending.userId, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Código incorrecto.'); return }
      onSuccess(data)
    } catch {
      setError('No se pudo conectar al servidor.')
    } finally {
      setLoading(false)
    }
  }

  async function resendCode() {
    setResent(false)
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pending.userId }),
      })
      const data = await res.json()
      if (data.verifyCode) {
        setDigits(data.verifyCode.split(''))
        onUpdateCode(data.verifyCode)
      }
      setResent(true)
    } catch { /* silencioso */ }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'40px', marginBottom:'10px' }}>📧</div>
        <p style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:'1.7' }}>
          Enviamos un código de 6 dígitos a<br/>
          <strong style={{ color:'var(--green-primary)' }}>{pending?.email}</strong>
        </p>
      </div>

      {pending?.verifyCode && (
        <div style={{ background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.25)', borderRadius:'10px', padding:'12px 16px', textAlign:'center' }}>
          <p style={{ fontSize:'11px', color:'rgba(165,214,167,0.7)', margin:'0 0 4px' }}>Tu código de verificación:</p>
          <p style={{ fontSize:'24px', fontWeight:900, color:'#00e676', fontFamily:'monospace', letterSpacing:'6px', margin:0 }}>{pending.verifyCode}</p>
        </div>
      )}

      {error  && <ErrBox msg={error} />}
      {resent && (
        <div style={{ background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.25)', borderRadius:'9px', padding:'9px 14px', display:'flex', alignItems:'center', gap:'7px', color:'var(--green-primary)', fontSize:'13px' }}>
          <MdCheckCircle size={16}/> Código reenviado.
        </div>
      )}

      {/* 6 inputs */}
      <div style={{ display:'flex', justifyContent:'center', gap:'10px' }}>
        {digits.map((d,i) => (
          <input key={i} ref={el => refs.current[i]=el}
            className="input-dark" type="text" inputMode="numeric"
            maxLength={1} value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            style={{ width:'46px', height:'56px', textAlign:'center', fontSize:'22px', fontWeight:'700', borderRadius:'10px', padding:0, borderColor: d ? 'rgba(0,230,118,0.5)' : 'var(--border-glass)' }}
          />
        ))}
      </div>

      <button type="submit" className="btn-primary" disabled={loading}
        style={{ padding:'12px', fontSize:'15px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Verificando...' : 'Verificar cuenta'}
      </button>

      <p style={{ textAlign:'center', fontSize:'12px', color:'rgba(165,214,167,0.45)' }}>
        ¿No llegó el código?{' '}
        <button type="button" onClick={resendCode}
          style={{ background:'none', border:'none', color:'var(--green-primary)', fontSize:'12px', cursor:'pointer', padding:0 }}>
          Reenviar código
        </button>
      </p>
    </form>
  )
}

/* ══════════ FORGOT ══════════ */
function ForgotForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent]   = useState(false)
  return !sent ? (
    <form onSubmit={e => { e.preventDefault(); setSent(true) }} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      <p style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:'1.6' }}>
        Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.
      </p>
      <Field icon={<MdEmail size={18}/>} type="email" placeholder="Correo electrónico"
        value={email} onChange={e => setEmail(e.target.value)} required />
      <button type="submit" className="btn-primary" style={{ padding:'12px', fontSize:'15px' }}>
        Enviar instrucciones
      </button>
    </form>
  ) : (
    <div style={{ textAlign:'center', padding:'16px 0' }}>
      <div style={{ fontSize:'40px', marginBottom:'12px' }}>📧</div>
      <p style={{ color:'var(--green-primary)', fontWeight:'600', marginBottom:'6px' }}>¡Correo enviado!</p>
      <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>Revisa tu bandeja de entrada.</p>
    </div>
  )
}

/* ══════════ HELPERS ══════════ */
function Field({ icon, ...props }) {
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.5)', display:'flex' }}>{icon}</span>
      <input className="input-dark" style={{ width:'100%', padding:'11px 12px 11px 38px', fontSize:'14px' }} {...props} />
    </div>
  )
}

function PassField({ show, toggle, placeholder='Contraseña', value, onChange }) {
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.5)', display:'flex' }}><MdLock size={18}/></span>
      <input className="input-dark" type={show ? 'text' : 'password'} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width:'100%', padding:'11px 40px 11px 38px', fontSize:'14px' }} required />
      <button type="button" onClick={toggle}
        style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(0,230,118,0.4)', cursor:'pointer', display:'flex' }}>
        {show ? <MdVisibilityOff size={18}/> : <MdVisibility size={18}/>}
      </button>
    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div style={{ background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.28)', borderRadius:'9px', padding:'9px 12px', display:'flex', alignItems:'center', gap:'7px', color:'#ef5350', fontSize:'12px' }}>
      <MdWarning size={14}/> {msg}
    </div>
  )
}

/* ══ Banner servidor desconectado — overlay centrado ══ */
function ServerDownBanner() {
  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        @keyframes pulse-node { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.07)} }
        @keyframes dash-move  { from{stroke-dashoffset:24} to{stroke-dashoffset:0} }
      `}</style>

      <div style={{
        padding: '36px 40px', borderRadius: '22px',
        background: 'rgba(10,15,13,0.98)',
        border: '1px solid rgba(255,167,38,0.35)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        maxWidth: '420px', width: '100%', textAlign: 'center',
      }}>

        {/* Diagrama wifi → pc → db */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginBottom:'24px' }}>

          {/* Wifi */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,167,38,0.1)', border:'1px solid rgba(255,167,38,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', animation:'pulse-node 1.6s ease-in-out infinite' }}>
              📶
            </div>
            <span style={{ fontSize:'9px', color:'rgba(255,167,38,0.65)', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>Internet</span>
          </div>

          {/* Línea animada → ok */}
          <svg width="44" height="16" style={{ flexShrink:0, marginBottom:'16px' }}>
            <line x1="0" y1="8" x2="44" y2="8" stroke="rgba(255,167,38,0.45)" strokeWidth="2" strokeDasharray="5 3"
              style={{ animation:'dash-move 0.9s linear infinite' }} />
          </svg>

          {/* Servidor */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,167,38,0.1)', border:'1px solid rgba(255,167,38,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', animation:'pulse-node 1.6s ease-in-out infinite', animationDelay:'0.4s' }}>
              🖥️
            </div>
            <span style={{ fontSize:'9px', color:'rgba(255,167,38,0.65)', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>Servidor</span>
          </div>

          {/* Línea animada → error */}
          <svg width="44" height="16" style={{ flexShrink:0, marginBottom:'16px' }}>
            <line x1="0" y1="8" x2="44" y2="8" stroke="rgba(239,83,80,0.55)" strokeWidth="2" strokeDasharray="5 3"
              style={{ animation:'dash-move 0.9s linear infinite', animationDelay:'0.4s' }} />
          </svg>

          {/* Base de datos — desconectada */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(239,83,80,0.12)', border:'1px solid rgba(239,83,80,0.45)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', animation:'pulse-node 1.6s ease-in-out infinite', animationDelay:'0.8s' }}>
              🗄️
            </div>
            <span style={{ fontSize:'9px', color:'#ef5350', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>Base de datos</span>
          </div>
        </div>

        <p style={{ margin:'0 0 8px', fontSize:'16px', fontWeight:800, color:'#ffa726' }}>
          Servicio no disponible
        </p>
        <p style={{ margin:0, fontSize:'12px', color:'rgba(165,214,167,0.45)', lineHeight:1.7 }}>
          No se pudo conectar con el servidor.<br/>
          Verifica tu conexión o intenta más tarde.
        </p>

        {/* Indicador de reintento */}
        <div style={{ marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', opacity:0.5 }}>
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ffa726', display:'inline-block', animation:'pulse-node 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize:'10px', color:'rgba(165,214,167,0.4)', fontWeight:600 }}>Reintentando cada 8 segundos...</span>
        </div>
      </div>
    </div>
  )
}

function SocialSection() {
  const SOCIALS = [
    { label:'Instagram', handle:'@bazar.co',    color:'#f48fb1', bg:'rgba(244,143,177,0.08)', icon:'📸' },
    { label:'TikTok',    handle:'@bazarmarket',  color:'#69f0ae', bg:'rgba(105,240,174,0.08)', icon:'🎵' },
    { label:'WhatsApp',  handle:'Soporte',       color:'#00e676', bg:'rgba(0,230,118,0.08)',   icon:'💬' },
    { label:'YouTube',   handle:'@BazarOficial', color:'#ef5350', bg:'rgba(239,83,80,0.08)',   icon:'▶️' },
  ]
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'4px 0 10px' }}>
        <div style={{ flex:1, height:'1px', background:'rgba(0,230,118,0.1)' }}/>
        <span style={{ fontSize:'10px', color:'rgba(165,214,167,0.35)', fontWeight:500 }}>Síguenos</span>
        <div style={{ flex:1, height:'1px', background:'rgba(0,230,118,0.1)' }}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px' }}>
        {SOCIALS.map(s => (
          <button key={s.label} type="button" className="social-btn"
            style={{ padding:'8px 10px', borderRadius:'9px', border:`1px solid ${s.color}25`, background:s.bg, color:s.color, cursor:'pointer', fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:'7px', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=s.color+'60'; e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=s.color+'25'; e.currentTarget.style.transform='translateY(0)' }}>
            <span style={{ fontSize:'14px' }}>{s.icon}</span>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontSize:'11px', fontWeight:700, lineHeight:1.2 }}>{s.label}</div>
              <div style={{ fontSize:'9px', opacity:0.6, fontWeight:400 }}>{s.handle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
