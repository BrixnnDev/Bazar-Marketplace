import API_BASE from '../../../config/api'
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getStoredAccent, saveAccent, getStoredMode, saveMode } from '../../../utils/themeStorage'
import {
  MdPerson, MdLock, MdNotifications, MdAccountBalanceWallet,
  MdPalette, MdSave, MdVisibility, MdVisibilityOff,
  MdCheckCircle, MdAddCircle, MdDelete,
  MdCreditCard, MdExpandMore, MdExpandLess,
  MdSettings, MdDevices, MdLogout, MdLightMode, MdDarkMode,
} from 'react-icons/md'
import { usePaymentMethods, BANK_CATALOG } from '../../../context/PaymentMethodsContext'
import { useUser, AVATAR_OPTIONS, ROLE_CFG } from '../../../context/UserContext'
import TabMaintenance from './TabMaintenance'

const TABS_ALL = [
  { id: 'perfil',         icon: MdPerson,               label: 'Perfil'          },
  { id: 'seguridad',      icon: MdLock,                  label: 'Seguridad'       },
  { id: 'notificaciones', icon: MdNotifications,         label: 'Notificaciones'  },
  { id: 'pagos',          icon: MdAccountBalanceWallet,  label: 'Pagos'           },
  { id: 'apariencia',     icon: MdPalette,               label: 'Apariencia'      },
  { id: 'sesiones',       icon: MdDevices,               label: 'Sesiones'        },
  { id: 'maintenance',    icon: MdSettings,              label: 'Mantenimiento', adminOnly: true },
]


export default function SettingsPage() {
  const location = useLocation()
  const { user } = useUser()
  const isAdmin = user?.role === 'administrador'
  const tabs = TABS_ALL.filter(t => !t.adminOnly || isAdmin)
  const [activeTab, setActiveTab] = useState(() => {
    const requested = location.state?.tab || 'perfil'
    if (requested === 'maintenance' && !isAdmin) return 'perfil'
    return requested
  })
  const [saved, setSaved]         = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    /* Ocupa todo el alto disponible, sin scroll externo */
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1px' }}>Configuración</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administra tu cuenta, seguridad y preferencias</p>
      </div>

      {/* ── LAYOUT: tabs izq + contenido der ── */}
      <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0 }}>

        {/* TABS izquierda — fijos */}
        <div className="glass-card" style={{ padding: '8px', width: '180px', flexShrink: 0, height: 'fit-content', alignSelf: 'flex-start' }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                padding: '10px 12px', borderRadius: '9px', border: '1px solid', cursor: 'pointer',
                fontSize: '13px', transition: 'all 0.15s', textAlign: 'left', marginBottom: '2px',
                background:   activeTab === t.id ? 'rgba(0,230,118,0.12)' : 'transparent',
                color:        activeTab === t.id ? 'var(--green-primary)'  : 'var(--text-secondary)',
                fontWeight:   activeTab === t.id ? '600' : '400',
                borderColor:  activeTab === t.id ? 'rgba(0,230,118,0.22)' : 'transparent',
              }}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO derecha — con scroll propio */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {saved && (
            <div className="fade-in" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '9px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green-primary)', fontSize: '13px', flexShrink: 0 }}>
              <MdCheckCircle size={16} /> Cambios guardados correctamente.
            </div>
          )}
          {activeTab === 'perfil'         && <TabPerfil      onSave={handleSave} />}
          {activeTab === 'seguridad'      && <TabSeguridad   onSave={handleSave} />}
          {activeTab === 'notificaciones' && <TabNotifs      onSave={handleSave} />}
          {activeTab === 'pagos'          && <TabPagos />}
          {activeTab === 'apariencia'     && <TabApariencia  onSave={handleSave} />}
          {activeTab === 'sesiones'       && <TabSesiones />}

          {activeTab === 'maintenance' && isAdmin && <TabMaintenance />}

        </div>
      </div>
    </div>
  )
}

/* ══ TAB PAGOS ══ */
function TabPagos() {
  const { methods, addMethod, removeMethod } = usePaymentMethods()
  const [showForm, setShowForm]     = useState(false)
  const [selectedBank, setSelBank]  = useState(null)
  const [form, setForm]             = useState({ ownerName: '', nit: '', accountNumber: '' })
  const [savedOk, setSavedOk]       = useState(false)

  function handleAdd(e) {
    e.preventDefault()
    addMethod({ bankId: selectedBank.id, ...form })
    setSavedOk(true)
    setTimeout(() => { setSavedOk(false); setShowForm(false); setSelBank(null); setForm({ ownerName: '', nit: '', accountNumber: '' }) }, 1600)
  }
  function resetForm() { setShowForm(false); setSelBank(null); setForm({ ownerName: '', nit: '', accountNumber: '' }); setSavedOk(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Card title="Cuentas conectadas">
        {methods.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
            No tienes ninguna cuenta conectada.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {methods.map((m) => {
              const bank = BANK_CATALOG.find(b => b.id === m.bankId)
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '11px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,230,118,0.1)', transition: 'border-color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.25)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.1)')}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: `${bank?.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: `1px solid ${bank?.color}28` }}>
                    {bank?.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{bank?.label}</p>
                      <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '999px', background: `${bank?.color}18`, color: bank?.color, border: `1px solid ${bank?.color}28`, fontWeight: '700', textTransform: 'uppercase' }}>{bank?.type}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.ownerName} · {m.nit}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)' }}>{bank?.accountLabel}: {m.accountNumber}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: '#00e676', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '999px', padding: '2px 8px', fontWeight: '600' }}>● Conectada</span>
                    <button onClick={() => removeMethod(m.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,83,80,0.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', transition: 'color 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef5350')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(239,83,80,0.45)')}>
                      <MdDelete size={12} /> Desconectar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', fontSize: '12px', marginTop: '12px' }}>
            <MdAddCircle size={15} /> Conectar nueva cuenta
          </button>
        )}
      </Card>

      {showForm && (
        <Card title="Conectar nueva cuenta">
          {savedOk ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '36px', marginBottom: '8px' }}>✅</p>
              <p style={{ color: 'var(--green-primary)', fontWeight: '700', fontSize: '16px' }}>¡Cuenta conectada!</p>
            </div>
          ) : (
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <FL label="Selecciona el banco o billetera" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
                  {BANK_CATALOG.map((bank) => (
                    <button key={bank.id} type="button" onClick={() => setSelBank(bank)}
                      style={{ padding: '10px 6px', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s', background: selectedBank?.id === bank.id ? `${bank.color}18` : 'rgba(0,0,0,0.22)', border: `1px solid ${selectedBank?.id === bank.id ? bank.color + '45' : 'rgba(0,230,118,0.07)'}`, color: selectedBank?.id === bank.id ? bank.color : 'var(--text-secondary)' }}>
                      <span style={{ fontSize: '20px' }}>{bank.emoji}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600' }}>{bank.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {selectedBank && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '9px 12px', background: `${selectedBank.color}10`, border: `1px solid ${selectedBank.color}28`, borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span style={{ fontSize: '18px' }}>{selectedBank.emoji}</span>
                    <span style={{ fontSize: '12px', color: selectedBank.color, fontWeight: '700' }}>Completar datos para {selectedBank.label}</span>
                  </div>
                  <FI label="Nombre completo del titular" placeholder="Ej: Carlos Martínez" value={form.ownerName} onChange={v => setForm({ ...form, ownerName: v })} />
                  <FI label="Número de identificación (NIT o CC)" placeholder="Ej: 1020304050" value={form.nit} onChange={v => setForm({ ...form, nit: v })} />
                  <FI label={selectedBank.accountLabel} placeholder={selectedBank.placeholder} value={form.accountNumber} onChange={v => setForm({ ...form, accountNumber: v })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-ghost" onClick={resetForm} style={{ flex: 1, padding: '9px', fontSize: '13px' }}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={!selectedBank} style={{ flex: 1, padding: '9px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: selectedBank ? 1 : 0.35, cursor: selectedBank ? 'pointer' : 'not-allowed' }}>
                  <MdCreditCard size={14} /> Conectar
                </button>
              </div>
            </form>
          )}
        </Card>
      )}

      <div style={{ padding: '10px 14px', background: 'rgba(0,230,118,0.04)', border: '1px solid rgba(0,230,118,0.1)', borderRadius: '9px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.55)', lineHeight: '1.7' }}>
          💡 Las cuentas aquí conectadas se usan en <strong style={{ color: 'var(--green-primary)' }}>Retiros</strong> para cobrar tus ganancias.
        </p>
      </div>
    </div>
  )
}

/* ══ TAB PERFIL ══ */
function TabPerfil({ onSave }) {
  const { user, updateUser, updateAvatar } = useUser()
  const roleCfg = ROLE_CFG[user.role] || ROLE_CFG.usuario
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [name,     setName]     = useState(user.name     || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [phone,    setPhone]    = useState(user.phone    || '')
  const [city,     setCity]     = useState(user.city     || '')
  const [username, setUsername] = useState(user.username || '')
  const [userErr,  setUserErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  /* Fecha de membresía */
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
    : user.joined || '—'

  async function handleSave(e) {
    e.preventDefault()
    setUserErr('')
    setSaving(true)
    try {
      const token = localStorage.getItem('bazar_token')
      const res   = await fetch(`${API_BASE}/api/profile/update`, {
        method:  'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
body: JSON.stringify({
          phone,
          avatar:   selectedAvatar,
          username: username.trim(),
          city,
          fullName: `${name.trim()} ${lastName.trim()}`.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setUserErr(data.error || 'Error al guardar.')
        setSaving(false)
        return
      }
      // Actualizar contexto con los nuevos datos del servidor
      const raw = data.user
      const parts = (raw.full_name || '').trim().split(/\s+/).filter(Boolean)
      updateUser({
        username:  raw.username,
        name:      parts[0] || raw.username,
        lastName:  parts.slice(1).join(' ') || '',
        phone:     raw.phone,
        city,
        avatar:    raw.avatar,
        created_at: raw.created_at,
      })
      updateAvatar(raw.avatar)
      onSave(e)
    } catch { setUserErr('Error de conexión.') }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} style={{ position:'relative' }}>
      <Card title="Información personal">

        {/* Avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px', position:'relative' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'50%', fontSize:'36px', background:`${roleCfg.color}18`, border:`3px solid ${roleCfg.color}45`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 20px ${roleCfg.color}25` }}>
            {selectedAvatar}
          </div>
          <div>
            <p style={{ fontSize:'14px', color:'var(--text-primary)', fontWeight:'700', marginBottom:'2px' }}>
              {name} {lastName}
            </p>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 9px', borderRadius:'999px', background:roleCfg.bg, color:roleCfg.color, border:`1px solid ${roleCfg.color}30`, fontSize:'10px', fontWeight:'700', marginBottom:'4px' }}>
              {roleCfg.emoji} {roleCfg.label}
            </span>
            <p style={{ fontSize:'10px', color:'rgba(165,214,167,0.35)', fontFamily:'monospace', letterSpacing:'1px', margin:'2px 0 6px' }}>
              {user.code}
            </p>
            {/* Miembro desde */}
            <p style={{ fontSize:'10px', color:'rgba(165,214,167,0.4)', margin:'0 0 6px' }}>
              🗓️ Miembro desde <strong style={{ color:'var(--text-secondary)' }}>{memberSince}</strong>
            </p>
            <button type="button" onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="btn-ghost"
              style={{ padding:'5px 14px', fontSize:'12px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
              🎭 Cambiar avatar
            </button>
          </div>

          {showAvatarPicker && (
            <div className="fade-in" style={{ position:'absolute', top:'100%', left:0, zIndex:100, marginTop:'8px', width:'100%', padding:'14px 16px', background:'rgba(10,15,13,0.97)', backdropFilter:'blur(16px)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:'14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <p style={{ fontSize:'11px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'700' }}>Elige tu avatar</p>
                <button type="button" onClick={() => setShowAvatarPicker(false)} style={{ background:'none', border:'none', color:'rgba(165,214,167,0.4)', cursor:'pointer', fontSize:'16px', lineHeight:1, padding:0 }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:'6px' }}>
                {AVATAR_OPTIONS.map(av => (
                  <button key={av} type="button" onClick={() => { setSelectedAvatar(av); setShowAvatarPicker(false) }}
                    style={{ width:'36px', height:'36px', borderRadius:'10px', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.14s', background: selectedAvatar===av ? `${roleCfg.color}22` : 'rgba(0,0,0,0.3)', border:`2px solid ${selectedAvatar===av ? roleCfg.color+'70' : 'transparent'}`, outline:'1px solid rgba(0,230,118,0.08)', transform: selectedAvatar===av ? 'scale(1.18)' : 'scale(1)' }}>
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Campos */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <FIControlled label="Nombre"   value={name}     onChange={setName} />
          <FIControlled label="Apellido" value={lastName} onChange={setLastName} />

          {/* Username editable con validación */}
          <div>
            <p style={{ fontSize:'11px', color:'var(--text-secondary)', marginBottom:'5px', fontWeight:'600' }}>Usuario</p>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'rgba(0,230,118,0.4)', fontSize:'13px' }}>@</span>
              <input className="input-dark"
                style={{ width:'100%', padding:'9px 12px 9px 26px', fontSize:'13px', borderColor: userErr ? 'rgba(239,83,80,0.5)' : undefined }}
                value={username}
                onChange={e => { setUsername(e.target.value); setUserErr('') }}
                placeholder="nombre_usuario"
              />
            </div>
            {userErr && <p style={{ fontSize:'10px', color:'#ef5350', marginTop:'3px' }}>{userErr}</p>}
          </div>

          <FI label="Correo" defaultValue={user.email} type="email" disabled />
          <FIControlled label="Teléfono" value={phone} onChange={setPhone} type="tel" />
          <FIControlled label="Ciudad"   value={city}  onChange={setCity} />
        </div>
      </Card>
      <SaveBtn label={saving ? 'Guardando...' : 'Guardar perfil'} disabled={saving} />
    </form>
  )
}

/* ══ TAB SEGURIDAD ══ */
function TabSeguridad({ onSave }) {
  const [show, setShow]           = useState(false)
  const [openPass, setOpenPass]   = useState(true)
  const [open2fa, setOpen2fa]     = useState(false)

  function handlePasswordSubmit(e) {
    e.preventDefault()
    onSave(e)
  }

  return (
    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* ── Cambiar contraseña ── */}
      <Accordion
        icon={<MdLock size={16} />}
        title="Cambiar contraseña"
        subtitle="Actualiza tu clave de acceso"
        open={openPass}
        onToggle={() => setOpenPass(!openPass)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
          <PF label="Contraseña actual"          show={show} toggle={() => setShow(!show)} />
          <PF label="Nueva contraseña"           show={show} toggle={() => setShow(!show)} />
          <PF label="Confirmar nueva contraseña" show={show} toggle={() => setShow(!show)} />
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', fontSize: '12px', width: 'fit-content', marginTop: '4px' }}>
            <MdSave size={14} /> Actualizar contraseña
          </button>
        </div>
      </Accordion>

      {/* ── Verificación en dos pasos ── */}
      <Accordion
        icon={<MdCheckCircle size={16} />}
        title="Verificación en dos pasos"
        subtitle="Añade seguridad adicional a tu cuenta"
        open={open2fa}
        onToggle={() => setOpen2fa(!open2fa)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px' }}>Autenticación por SMS</p>
            <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)' }}>Recibirás un código en tu celular al iniciar sesión</p>
          </div>
          <Toggle label="" checked={false} onChange={() => {}} />
        </div>
      </Accordion>

    </form>
  )
}

/* ══ TAB NOTIFICACIONES ══ */
function TabNotifs({ onSave }) {
  const [prefs, setPrefs] = useState({ recargas: true, ventas: true, compras: true, retiros: true, sistema: true, mensajes: true, email: false })
  return (
    <form onSubmit={onSave}>
      <Card title="Preferencias de notificaciones">
        {[
          { key: 'recargas', label: 'Recargas de créditos' },
          { key: 'ventas',   label: 'Cuando alguien compra tu producto' },
          { key: 'compras',  label: 'Confirmaciones de compra' },
          { key: 'retiros',  label: 'Estado de retiros' },
          { key: 'sistema',  label: 'Notificaciones del sistema' },
          { key: 'mensajes', label: 'Mensajes de otros usuarios' },
          { key: 'email',    label: 'Notificaciones por correo' },
        ].map(({ key, label }) => (
          <Toggle key={key} label={label} checked={prefs[key]} onChange={() => setPrefs({ ...prefs, [key]: !prefs[key] })} />
        ))}
      </Card>
      <SaveBtn />
    </form>
  )
}

/* ══ TAB APARIENCIA ══ */
function TabApariencia() {
  const navigate = useNavigate()
  const { setUser } = useUser()
  const [accent, setAccent] = useState(getStoredAccent())
  const [mode,   setMode]   = useState(getStoredMode())
  const colors = ['#00e676', '#64b5f6', '#ce93d8', '#ffa726', '#f48fb1', '#80cbc4']

  useEffect(() => { saveAccent(accent) }, [accent])

  function toggleMode(m) {
    setMode(m)
    saveMode(m)
  }

  function handleLogout() {
    localStorage.removeItem('bazar_token')
    localStorage.removeItem('bazar_user')
    setUser(null)
    navigate('/auth')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

      {/* Modo oscuro / claro */}
      <Card title="🎨 Tema">
        <div style={{ display:'flex', gap:'10px' }}>
          {[
            { id:'dark',  icon: MdDarkMode,  label:'Oscuro', desc:'Fondo negro cristalino' },
            { id:'light', icon: MdLightMode, label:'Claro',  desc:'Fondo blanco suave'     },
          ].map(t => {
            const active = mode === t.id
            return (
              <button key={t.id} type="button" onClick={() => toggleMode(t.id)}
                style={{ flex:1, padding:'14px', borderRadius:'12px', cursor:'pointer', transition:'all 0.2s', background: active ? 'rgba(0,230,118,0.12)' : 'rgba(0,0,0,0.2)', border:`2px solid ${active ? 'rgba(0,230,118,0.4)' : 'rgba(0,230,118,0.08)'}`, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                <t.icon size={24} style={{ color: active ? 'var(--green-primary)' : 'var(--text-secondary)' }} />
                <div>
                  <p style={{ margin:0, fontSize:'13px', fontWeight:700, color: active ? 'var(--green-primary)' : 'var(--text-primary)' }}>{t.label}</p>
                  <p style={{ margin:0, fontSize:'10px', color:'var(--text-secondary)' }}>{t.desc}</p>
                </div>
                {active && <span style={{ fontSize:'10px', background:'rgba(0,230,118,0.2)', color:'var(--green-primary)', padding:'2px 8px', borderRadius:'999px', fontWeight:700 }}>Activo</span>}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Color de acento */}
      <Card title="🎯 Color de acento">
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
          {colors.map(c => (
            <button key={c} type="button" onClick={() => setAccent(c)}
              style={{ width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', background:c, border:`3px solid ${accent===c ? 'white' : 'transparent'}`, boxShadow: accent===c ? `0 0 14px ${c}90` : 'none', transition:'all 0.2s' }} />
          ))}
        </div>
        <p style={{ fontSize:'11px', color:'var(--text-secondary)', marginTop:'8px' }}>Se aplica a botones, iconos y resaltados.</p>
      </Card>

      {/* Cerrar sesión */}
      <Card title="🔐 Sesión actual">
        <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'14px', lineHeight:1.6 }}>
          Cierra tu sesión en este dispositivo. Tendrás que volver a iniciar sesión para acceder.
        </p>
        <button type="button" onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 20px', borderRadius:'10px', background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.3)', color:'#ef5350', cursor:'pointer', fontWeight:700, fontSize:'13px', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,83,80,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,83,80,0.1)'}>
          <MdLogout size={18} /> Cerrar sesión
        </button>
      </Card>
    </div>
  )
}

/* ══ TAB SESIONES ══ */
function TabSesiones() {
  const navigate = useNavigate()
  const { setUser } = useUser()
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('bazar_token')
    if (!token) { setLoading(false); return } // eslint-disable-line react-hooks/set-state-in-effect

    /* Intentar obtener la IP real del backend */
    fetch(`${API_BASE}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.sessions?.length) {
          const apiSession = d.sessions[0]
          /* Guardar en localStorage para persistencia */
          localStorage.setItem('bazar_session', JSON.stringify(apiSession))
          setSessions([apiSession])
        } else {
          /* Fallback: usar sesión almacenada en localStorage */
          const stored = JSON.parse(localStorage.getItem('bazar_session') || 'null')
          setSessions(stored ? [stored] : [])
        }
      })
      .catch(() => {
        const stored = JSON.parse(localStorage.getItem('bazar_session') || 'null')
        setSessions(stored ? [stored] : [])
      })
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    localStorage.removeItem('bazar_token')
    localStorage.removeItem('bazar_user')
    localStorage.removeItem('bazar_session')
    setUser(null)
    navigate('/auth')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      <Card title="📡 Sesiones activas">
        <p style={{ fontSize:'12px', color:'var(--text-secondary)', marginBottom:'14px' }}>
          Dispositivos donde tu cuenta está iniciada en este momento.
        </p>
        {loading ? (
          <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>Cargando sesiones...</p>
        ) : sessions.length === 0 ? (
          <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>Sin sesiones encontradas.</p>
        ) : sessions.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px', borderRadius:'12px', background: s.current ? 'rgba(0,230,118,0.07)' : 'rgba(0,0,0,0.2)', border:`1px solid ${s.current ? 'rgba(0,230,118,0.25)' : 'rgba(0,230,118,0.08)'}`, marginBottom:'8px' }}>
            <div style={{ fontSize:'28px' }}>{s.device?.includes('Móvil') ? '📱' : '💻'}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'var(--text-primary)' }}>
                  {s.device} · {s.browser}
                </p>
                {s.current && (
                  <span style={{ fontSize:'10px', background:'rgba(0,230,118,0.15)', color:'var(--green-primary)', padding:'2px 8px', borderRadius:'999px', fontWeight:700 }}>
                    Este dispositivo
                  </span>
                )}
              </div>
              <p style={{ margin:0, fontSize:'11px', color:'var(--text-secondary)' }}>
                IP: <span style={{ fontFamily:'monospace', color:'var(--green-primary)' }}>{s.ip}</span>
              </p>
              <p style={{ margin:0, fontSize:'10px', color:'rgba(165,214,167,0.35)', marginTop:'2px' }}>
                Último acceso: {new Date(s.createdAt).toLocaleString('es-CO', { dateStyle:'medium', timeStyle:'short' })}
              </p>
            </div>
            {s.current && (
              <button onClick={handleLogout}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'9px', background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.25)', color:'#ef5350', cursor:'pointer', fontSize:'12px', fontWeight:700, transition:'all 0.15s', flexShrink:0 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(239,83,80,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(239,83,80,0.1)'}>
                <MdLogout size={14} /> Cerrar
              </button>
            )}
          </div>
        ))}
      </Card>

      <Card title="🚨 Seguridad">
        <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'14px', lineHeight:1.6 }}>
          Si ves una sesión que no reconoces, cierra todas y cambia tu contraseña inmediatamente.
        </p>
        <button onClick={handleLogout}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 20px', borderRadius:'10px', background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.3)', color:'#ef5350', cursor:'pointer', fontWeight:700, fontSize:'13px', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(239,83,80,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(239,83,80,0.1)'}>
          <MdLogout size={18} /> Cerrar sesión en este dispositivo
        </button>
      </Card>
    </div>
  )
}

/* ─── Shared helpers ─── */
function Card({ title, children, style }) {
  return (
    <div className="glass-card" style={{ padding: '18px 20px', ...style }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', paddingBottom: '9px', borderBottom: '1px solid rgba(0,230,118,0.08)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function FL({ label }) {
  return <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>{label}</p>
}

function FIControlled({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      {label && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>{label}</p>}
      <input className="input-dark"
        style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function FI({ label, defaultValue, value, onChange, placeholder, type = 'text', disabled = false }) {
  const isControlled = value !== undefined
  return (
    <div>
      {label && <p style={{ fontSize:'11px', color:'var(--text-secondary)', marginBottom:'5px', fontWeight:'500' }}>{label}</p>}
      <input className="input-dark"
        style={{ width:'100%', padding:'9px 12px', fontSize:'13px', opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : undefined }}
        type={type}
        placeholder={placeholder}
        defaultValue={!isControlled ? defaultValue : undefined}
        value={isControlled ? value : undefined}
        onChange={isControlled && !disabled ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        readOnly={disabled}
      />
    </div>
  )
}

function PF({ label, show, toggle }) {
  return (
    <div>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input className="input-dark" type={show ? 'text' : 'password'} style={{ width: '100%', padding: '9px 36px 9px 12px', fontSize: '13px' }} />
        <button type="button" onClick={toggle} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(0,230,118,0.4)', cursor: 'pointer', display: 'flex' }}>
          {show ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
        </button>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,230,118,0.06)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{label}</span>
      <button type="button" onClick={onChange} style={{ width: '40px', height: '22px', borderRadius: '999px', cursor: 'pointer', background: checked ? 'var(--green-primary)' : 'rgba(255,255,255,0.1)', border: 'none', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: '2px', left: checked ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: checked ? '#0a0f0d' : 'rgba(255,255,255,0.4)', transition: 'left 0.2s', display: 'block' }} />
      </button>
    </div>
  )
}

function SaveBtn({ label = 'Guardar cambios' }) {
  return (
    <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', fontSize: '13px', marginTop: '12px' }}>
      <MdSave size={15} /> {label}
    </button>
  )
}

/* ── Acordeón con icono abierto/cerrado ── */
function Accordion({ icon, title, subtitle, open, onToggle, children }) {
  return (
    <div
      className="glass-card"
      style={{ overflow: 'hidden', transition: 'border-color 0.2s' }}
    >
      {/* Cabecera clickeable */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Icono del tema */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
          background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--green-primary)', border: '1px solid rgba(0,230,118,0.2)',
        }}>
          {icon}
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1px' }}>{title}</p>
          <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.45)' }}>{subtitle}</p>
        </div>

        {/* Flecha abierto/cerrado */}
        <div style={{
          width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0,
          background: open ? 'rgba(0,230,118,0.1)' : 'rgba(0,0,0,0.2)',
          border: `1px solid ${open ? 'rgba(0,230,118,0.22)' : 'rgba(255,255,255,0.06)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--green-primary)' : 'rgba(165,214,167,0.35)',
          transition: 'all 0.2s',
        }}>
          {open ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
        </div>
      </button>

      {/* Contenido expandible */}
      {open && (
        <div
          className="fade-in"
          style={{
            padding: '0 18px 16px',
            borderTop: '1px solid rgba(0,230,118,0.08)',
            paddingTop: '14px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
