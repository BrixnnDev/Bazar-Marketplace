import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../../context/UserContext'
import {
  MdPerson, MdBadge, MdPhone, MdCheckCircle, MdWarning,
} from 'react-icons/md'

const API = 'http://localhost:3001/api'

/* Avatares disponibles — SIN corona (👑 es solo admin) */
const AVATARS = [
  '👤','👨','👩','🧑','👨‍💻','👩‍💻','🧑‍💼','👨‍💼','👩‍💼',
  '🦸','🦹','🧙','🎩','😎','🤖','🐱','🦊','🐺','🎭',
]

const DOC_TYPES = [
  { value: 'cedula',     label: '🪪 Cédula de ciudadanía' },
  { value: 'tarjeta_id', label: '🎓 Tarjeta de identidad' },
  { value: 'extranjero', label: '🌎 Cédula de extranjería' },
  { value: 'nit',        label: '🏢 NIT' },
]

export default function CompleteProfilePage() {
  const navigate  = useNavigate()
  const { setUser } = useUser()
  const token     = localStorage.getItem('bazar_token')
  const savedUser = JSON.parse(localStorage.getItem('bazar_user') || '{}')

  const [fullName,  setFullName]  = useState('')
  const [docType,   setDocType]   = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [phone,     setPhone]     = useState(savedUser.phone || '')
  const [avatar,    setAvatar]    = useState('👤')
  const [step,      setStep]      = useState(1) // 1 = datos, 2 = avatar
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) { setError('El nombre completo es obligatorio.'); return }
    if (!docType)          { setError('Selecciona el tipo de documento.'); return }
    if (!docNumber.trim()) { setError('El número de documento es obligatorio.'); return }
    if (!phone.trim())     { setError('El teléfono es obligatorio.'); return }

    setLoading(true)
    try {
      const res  = await fetch(`${API}/profile/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ fullName, docType, docNumber, phone, avatar }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al guardar el perfil.'); return }

      const parts    = fullName.trim().split(/\s+/)
      const nextUser = {
        ...savedUser,
        ...data.user,
        name:     parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        phone,
        profile_completed: true,
      }
      localStorage.setItem('bazar_user', JSON.stringify(nextUser))
      setUser(nextUser)
      navigate('/dashboard')
    } catch {
      setError('No se pudo conectar al servidor.')
    } finally {
      setLoading(false)
    }
  }

  function goToStep2() {
    if (!fullName.trim() || !docType || !docNumber.trim() || !phone.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setError('')
    setStep(2)
  }

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'fixed', inset: 0,
    }}>
      {/* Glows decorativos */}
      <div style={{ position:'absolute', top:'-180px', left:'-180px', width:'450px', height:'450px', background:'radial-gradient(circle,rgba(0,230,118,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-130px', right:'-130px', width:'380px', height:'380px', background:'radial-gradient(circle,rgba(0,200,83,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div className="glass-card fade-in" style={{
        width: '100%',
        maxWidth: step === 1 ? '720px' : '440px',
        padding: '28px 32px',
        transition: 'max-width 0.3s ease',
        maxHeight: '96vh',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'18px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:'800', color:'var(--text-primary)', marginBottom:'2px' }}>
            Completa tu perfil
          </h1>
          <p style={{ fontSize:'12px', color:'var(--text-secondary)' }}>
            {step === 1 ? 'Ingresa tus datos personales' : 'Elige tu avatar'}
          </p>
        </div>

        {/* Indicador de pasos */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'18px' }}>
          {[1,2].map(s => (
            <div key={s} style={{
              flex:1, height:'3px', borderRadius:'999px',
              background: step >= s ? 'var(--green-primary)' : 'rgba(0,230,118,0.15)',
              transition:'background 0.3s',
            }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.28)', borderRadius:'9px', padding:'9px 14px', display:'flex', alignItems:'center', gap:'8px', color:'#ef5350', fontSize:'12px', marginBottom:'14px' }}>
            <MdWarning size={15}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ═══ PASO 1: Datos personales ═══ */}
          {step === 1 && (
            <>
              {/* Fila 1: Código (readonly) + Username (readonly) */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>

                {/* Código del sistema */}
                <div>
                  <p style={labelStyle}>Código de usuario</p>
                  <div style={{ background:'rgba(0,0,0,0.25)', border:'1px solid rgba(0,230,118,0.12)', borderRadius:'10px', padding:'9px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px' }}>
                    <span style={{ fontSize:'10px', color:'rgba(165,214,167,0.4)', lineHeight:'1.3' }}>Sistema · No modificable</span>
                    <span style={{ fontSize:'14px', fontWeight:'900', color:'var(--green-primary)', fontFamily:'monospace', letterSpacing:'1px', whiteSpace:'nowrap' }}>
                      {savedUser.code || '#B????????'}
                    </span>
                  </div>
                </div>

                {/* Nombre de usuario */}
                <div>
                  <p style={labelStyle}>Nombre de usuario</p>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.35)', display:'flex' }}><MdPerson size={15}/></span>
                    <input className="input-dark" readOnly value={savedUser.username || ''}
                      style={{ width:'100%', padding:'9px 10px 9px 32px', fontSize:'13px', opacity:0.6, cursor:'default' }} />
                  </div>
                </div>
              </div>

              {/* Fila 2: Nombre completo + Teléfono */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>

                {/* Nombre completo */}
                <div>
                  <p style={labelStyle}>Nombre y apellidos completos <Req /></p>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.4)', display:'flex' }}><MdPerson size={15}/></span>
                    <input className="input-dark" type="text" placeholder="Ej: Juan Carlos Pérez"
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      style={{ width:'100%', padding:'9px 10px 9px 32px', fontSize:'13px' }} required />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <p style={labelStyle}>Número de teléfono <Req /></p>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.4)', display:'flex' }}><MdPhone size={15}/></span>
                    <input className="input-dark" type="tel" placeholder="Ej: 300 123 4567"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      style={{ width:'100%', padding:'9px 10px 9px 32px', fontSize:'13px' }} required />
                  </div>
                </div>
              </div>

              {/* Fila 3: Tipo de documento + Número */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'18px' }}>

                {/* Tipo de documento */}
                <div>
                  <p style={labelStyle}>Tipo de documento <Req /></p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    {DOC_TYPES.map(d => (
                      <button key={d.value} type="button" onClick={() => setDocType(d.value)}
                        style={{
                          padding:'7px 11px', borderRadius:'8px', cursor:'pointer', textAlign:'left',
                          background: docType===d.value ? 'rgba(0,230,118,0.12)' : 'rgba(0,0,0,0.22)',
                          border: `1px solid ${docType===d.value ? 'rgba(0,230,118,0.35)' : 'rgba(0,230,118,0.08)'}`,
                          color: docType===d.value ? 'var(--green-primary)' : 'var(--text-secondary)',
                          fontSize:'12px', fontWeight: docType===d.value ? '600' : '400',
                          transition:'all 0.15s',
                          display:'flex', alignItems:'center', gap:'6px',
                        }}>
                        {docType===d.value && <MdCheckCircle size={13}/>}
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Número de documento */}
                <div>
                  <p style={labelStyle}>
                    Número de {docType ? DOC_TYPES.find(d=>d.value===docType)?.label.split(' ').slice(1).join(' ') : 'documento'} <Req />
                  </p>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.4)', display:'flex' }}><MdBadge size={15}/></span>
                    <input className="input-dark" type="text" placeholder="Ej: 1020304050"
                      value={docNumber} onChange={e => setDocNumber(e.target.value)}
                      style={{ width:'100%', padding:'9px 10px 9px 32px', fontSize:'13px' }} required />
                  </div>
                  <p style={{ fontSize:'10px', color:'rgba(165,214,167,0.35)', marginTop:'6px' }}>
                    * Solo tú y el administrador pueden ver este dato
                  </p>
                </div>
              </div>

              <button type="button" className="btn-primary" onClick={goToStep2}
                style={{ width:'100%', padding:'11px', fontSize:'14px' }}>
                Continuar → Elegir avatar
              </button>
            </>
          )}

          {/* ═══ PASO 2: Avatar ═══ */}
          {step === 2 && (
            <>
              {/* Avatar seleccionado */}
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <div style={{
                  width:'72px', height:'72px', borderRadius:'50%', fontSize:'36px',
                  background:'rgba(0,230,118,0.1)', border:'3px solid rgba(0,230,118,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 10px',
                }}>
                  {avatar}
                </div>
                <p style={{ fontSize:'12px', color:'rgba(165,214,167,0.4)' }}>
                  👑 La corona es exclusiva del administrador
                </p>
              </div>

              {/* Grid de avatares */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'8px', padding:'4px', marginBottom:'18px' }}>
                {AVATARS.map(av => (
                  <button key={av} type="button" onClick={() => setAvatar(av)}
                    style={{
                      width:'52px', height:'52px', borderRadius:'12px', fontSize:'26px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', transition:'all 0.15s',
                      background: avatar===av ? 'rgba(0,230,118,0.18)' : 'rgba(0,0,0,0.25)',
                      border: `2px solid ${avatar===av ? 'rgba(0,230,118,0.55)' : 'transparent'}`,
                      outline:'1px solid rgba(0,230,118,0.08)',
                      transform: avatar===av ? 'scale(1.12)' : 'scale(1)',
                    }}
                    onMouseEnter={e => { if(avatar!==av){ e.currentTarget.style.background='rgba(0,230,118,0.08)'; e.currentTarget.style.transform='scale(1.06)' }}}
                    onMouseLeave={e => { if(avatar!==av){ e.currentTarget.style.background='rgba(0,0,0,0.25)'; e.currentTarget.style.transform='scale(1)' }}}
                  >
                    {av}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', gap:'10px' }}>
                <button type="button" className="btn-ghost" onClick={() => setStep(1)}
                  style={{ flex:1, padding:'11px', fontSize:'14px' }}>
                  ← Volver
                </button>
                <button type="submit" className="btn-primary" disabled={loading}
                  style={{ flex:1, padding:'11px', fontSize:'14px', opacity: loading?0.7:1 }}>
                  {loading ? 'Guardando...' : '✅ Crear perfil'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

/* ── Helpers ── */
const labelStyle = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  marginBottom: '5px',
  fontWeight: '500',
}
function Req() {
  return <span style={{ color:'#ef5350', marginLeft:'2px' }}>*</span>
}
