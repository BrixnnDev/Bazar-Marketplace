import { useEffect, useState } from 'react'
import { fetchProductsFromAPI } from '../../../utils/productStorage'
import {
  MdTrendingUp, MdAccountBalanceWallet, MdStorefront, MdSell,
  MdClose, MdEmail, MdPhone, MdLocationOn,
  MdVerified, MdAdminPanelSettings, MdShoppingCart, MdContentCopy, MdCheckCircle,
} from 'react-icons/md'
import { TYPE_CFG } from '../../../context/ActivityContext'
import { useUser, ROLE_CFG } from '../../../context/UserContext'


const TAG_COLORS = {
  Destacado: { bg: 'rgba(0,230,118,0.15)',   color: '#00e676' },
  Popular:   { bg: 'rgba(255,167,38,0.15)',  color: '#ffa726' },
  Oferta:    { bg: 'rgba(239,83,80,0.15)',   color: '#ef5350' },
  Nuevo:     { bg: 'rgba(100,181,246,0.15)', color: '#64b5f6' },
}

function getDisplayName(user) {
  const value = user?.username?.trim() || user?.name?.trim() || user?.full_name?.trim() || user?.email?.split('@')[0]?.trim() || ''
  if (value && value !== 'Usuario') return value
  return user?.username?.trim() || user?.email?.split('@')[0]?.trim() || 'Usuario'
}

export default function HomePage() {
  const { user, updateUser } = useUser()
  const [showProfile, setShowProfile] = useState(false)
  const [products,    setProducts]    = useState([])
  const [buyModal,    setBuyModal]    = useState(null)
  const [stats,       setStats]       = useState({ totalCompras: 0, gananciaReventa: 0 })
  const [liveActivity, setLiveActivity] = useState([])
  const roleCfg = ROLE_CFG[user.role] || ROLE_CFG.usuario

  useEffect(() => {
    fetchProductsFromAPI().then(setProducts)
    const interval = setInterval(() => fetchProductsFromAPI().then(setProducts), 10000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  // Cargar estadísticas reales desde la BD
  useEffect(() => {
    const token = localStorage.getItem('bazar_token')
    if (!token) return
    async function loadStats() {
      try {
        const res = await fetch('http://localhost:3001/api/purchases/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) { const d = await res.json(); setStats(d) }
      // eslint-disable-next-line no-empty
      } catch {}
    }
    async function loadActivity() {
      try {
        const res = await fetch('http://localhost:3001/api/purchases/activity', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) { const d = await res.json(); setLiveActivity(d.activity || []) }
      // eslint-disable-next-line no-empty
      } catch {}
    }
    loadStats(); loadActivity()
    const iv = setInterval(() => { loadStats(); loadActivity() }, 10000)
    return () => clearInterval(iv)
  }, [])

  const visibleProducts = products.filter((p) => p.visible)
  const displayName = getDisplayName(user)

  const bal = Number(user.balance || 0)
  const crd = Number(user.credits || 0)

  const statCards = [
    {
      label:     'Saldo',
      value:     `$${bal.toLocaleString('es-CO')}`,
      unit:      'COP',
      sub:       'Disponible',
      icon:      MdAccountBalanceWallet,
      color:     '#00e676',
      valueColor:'#00e676',
    },
    {
      label:     'Créditos',
      value:     `${crd.toLocaleString('es-CO')}`,
      unit:      'Bz',
      sub:       'Puntos acumulados',
      icon:      MdTrendingUp,
      color:     '#64b5f6',
      valueColor:'#64b5f6',
    },
    {
      label:     'Compras',
      value:     String(stats.totalCompras),
      unit:      '',
      sub:       'Productos adquiridos',
      icon:      MdStorefront,
      color:     '#69f0ae',
      valueColor:'var(--text-primary)',
    },
    {
      label:     'Ganancias',
      value:     `$${Number(stats.gananciaReventa).toLocaleString('es-CO')}`,
      unit:      'COP',
      sub:       'Por reventas',
      icon:      MdSell,
      color:     '#ffa726',
      valueColor:'#ffa726',
    },
  ]

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

        {/* Saludo + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Círculo de avatar — div clickeable (evita tooltip nativo del browser) */}
          <div
            className="avatar-btn"
            role="button"
            tabIndex={0}
            onClick={() => setShowProfile(true)}
            onKeyDown={e => e.key === 'Enter' && setShowProfile(true)}
            style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${roleCfg.color}22, ${roleCfg.color}08)`,
              border: `2px solid ${roleCfg.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', cursor: 'pointer', flexShrink: 0,
              boxShadow: `0 0 14px ${roleCfg.color}20`,
              position: 'relative', zIndex: 10,
              outline: 'none', overflow: 'hidden',
              userSelect: 'none',
            }}
          >
            {user.avatar}
          </div>

          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1px' }}>
              Bienvenido, <span style={{ color: 'var(--green-primary)' }}>{displayName}</span> 👋
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Actividad de todos los usuarios hoy</p>
              <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '999px', background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.color}30`, fontWeight: '700' }}>
                {roleCfg.emoji} {roleCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Nombre de la plataforma */}
        <div style={{ textAlign: 'right', lineHeight: 1 }}>
          <span style={{
            fontSize: '42px', fontWeight: '900', letterSpacing: '-3px',
            background: 'linear-gradient(135deg, #00e676 10%, #00c853 60%, #004d40 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'block', lineHeight: 1, userSelect: 'none',
            filter: 'drop-shadow(0 0 12px rgba(0,230,118,0.25))',
          }}>
            Bazar
          </span>
          <span style={{ fontSize: '9px', color: 'rgba(0,230,118,0.45)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: '600' }}>
            marketplace
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', flexShrink: 0 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Grid principal */}
      <div className="home-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '10px', flex: 1, minHeight: 0 }}>

        {/* Marketplace */}
        <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionHeader title="Marketplace" sub={visibleProducts.length > 0 ? `${visibleProducts.length} disponibles` : 'Sin productos'} />
          {visibleProducts.length === 0 ? (
            <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
              <div>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>📦</div>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>No hay productos disponibles</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>El administrador aún no ha agregado productos.</p>
              </div>
            </div>
          ) : (
            <div className="marketplace-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr 1fr', gap: '8px', flex: 1, minHeight: 0 }}>
              {visibleProducts.slice(0, 6).map(item => <MarketCard key={item.id} item={item} onBuy={() => setBuyModal(item)} />)}
            </div>
          )}
        </section>

        {/* Actividad */}
        <section className="activity-col" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ marginBottom: '7px', flexShrink: 0 }}>
            <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Actividad reciente</h2>
          </div>
          <div className="glass-card" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 2px' }}>
            {liveActivity.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                Aún no hay actividad para mostrar.
              </div>
            ) : liveActivity.map(a => <ActivityRow key={a.id} {...a} />)}
          </div>
        </section>
      </div>

      {/* ── MODAL PERFIL ── */}
      {showProfile && <ProfileModal user={user} roleCfg={roleCfg} onClose={() => setShowProfile(false)} />}

      {/* ── MODAL COMPRA ── */}
      {buyModal && (
        <BuyModal
          product={buyModal}
          onClose={() => setBuyModal(null)}
          onPurchaseSuccess={() => fetchProductsFromAPI().then(setProducts)}
          updateUser={updateUser}
        />
      )}
    </div>
  )
}

/* ─── Modal de perfil ─── */
function ProfileModal({ user, roleCfg, onClose }) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(user.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // fallback para navegadores sin clipboard API
      const el = document.createElement('textarea')
      el.value = user.code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
    : user.joined || '—'

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '24px' }}
    >
      <div
        className="glass-card fade-in"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '420px', padding: '0', overflow: 'hidden' }}
      >
        {/* Cabecera con avatar */}
        <div style={{ padding: '28px 28px 20px', background: `linear-gradient(135deg, ${roleCfg.color}12, rgba(0,0,0,0.3))`, borderBottom: '1px solid rgba(0,230,118,0.08)', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <MdClose size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              background: `${roleCfg.color}18`, border: `3px solid ${roleCfg.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', boxShadow: `0 0 24px ${roleCfg.color}30`,
            }}>
              {user.avatar}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '3px' }}>
                {user.name} {user.lastName}
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.5)', marginBottom: '6px' }}>@{user.username}</p>
              {/* Rol */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.color}35`, fontSize: '11px', fontWeight: '700' }}>
                {user.role === 'administrador' ? <MdAdminPanelSettings size={12} /> : <MdVerified size={12} />}
                {roleCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Datos del perfil */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Código único + copiar */}
          <div style={{ padding: '10px 14px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.18)', borderRadius: '10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Código de usuario</span>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--green-primary)', letterSpacing: '1px', fontFamily: 'monospace' }}>{user.code}</span>
                <button
                  onClick={copyCode}
                  title="Copiar código"
                  style={{ background: copied ? 'rgba(0,230,118,0.15)' : 'rgba(0,0,0,0.25)', border: `1px solid ${copied ? 'rgba(0,230,118,0.4)' : 'rgba(0,230,118,0.15)'}`, borderRadius: '7px', padding: '5px 7px', cursor: 'pointer', display:'flex', alignItems:'center', transition:'all 0.2s', color: copied ? '#00e676' : 'rgba(165,214,167,0.5)' }}
                  onMouseEnter={e => { if (!copied) { e.currentTarget.style.background='rgba(0,230,118,0.1)'; e.currentTarget.style.borderColor='rgba(0,230,118,0.35)' }}}
                  onMouseLeave={e => { if (!copied) { e.currentTarget.style.background='rgba(0,0,0,0.25)'; e.currentTarget.style.borderColor='rgba(0,230,118,0.15)' }}}>
                  {copied
                    ? <MdCheckCircle size={14} />
                    : <MdContentCopy size={14} />}
                </button>
              </div>
            </div>
            {copied && (
              <p style={{ fontSize:'9px', color:'#00e676', marginTop:'4px', textAlign:'right' }}>¡Copiado!</p>
            )}
          </div>

          {/* Miembro desde */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', background:'rgba(0,0,0,0.18)', border:'1px solid rgba(0,230,118,0.08)', borderRadius:'10px' }}>
            <span style={{ fontSize:'13px' }}>🗓️</span>
            <span style={{ fontSize:'11px', color:'var(--text-secondary)' }}>Miembro desde</span>
            <span style={{ fontSize:'12px', fontWeight:'600', color:'var(--text-primary)', marginLeft:'auto' }}>{memberSince}</span>
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            <ProfileRow icon={<MdEmail size={14} />}       label="Correo"    value={user.email} />
            <ProfileRow icon={<MdPhone size={14} />}       label="Teléfono"  value={user.phone} />
            <ProfileRow icon={<MdLocationOn size={14} />}  label="Ciudad"    value={user.city} />
          </div>

          {/* Saldos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,230,118,0.12)', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: 'rgba(165,214,167,0.4)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#00e676' }}>${Number(user.balance || 0).toLocaleString()} COP</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(100,181,246,0.12)', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: 'rgba(165,214,167,0.4)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Créditos</p>
              <p style={{ fontSize: '16px', fontWeight: '800', color: '#64b5f6' }}>${Number(user.credits || 0).toLocaleString()} Bz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: 'rgba(0,230,118,0.45)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)', width: '90px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{value}</span>
    </div>
  )
}

/* ── StatCard ── */
function StatCard({ label, value, unit, sub, icon: Icon, color, valueColor }) {
  const RGBA = {
    '#00e676': '0,230,118', '#69f0ae': '105,240,174',
    '#00c853': '0,200,83',  '#b9f6ca': '185,246,202',
    '#64b5f6': '100,181,246', '#ffa726': '255,167,38',
  }
  return (
    <div className="glass-card" style={{ padding: '12px', transition: 'transform 0.2s', cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ marginBottom: '6px' }}>
        <div style={{ background: `rgba(${RGBA[color] || '0,230,118'},0.12)`, borderRadius: '8px', padding: '5px', display: 'inline-flex' }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      {/* Número con color + unidad pequeña */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: valueColor || 'var(--text-primary)', margin: 0, wordBreak: 'break-all', lineHeight: 1.2 }}>
          {value}
        </p>
        {unit && (
          <span style={{ fontSize: '9px', fontWeight: '700', color: valueColor || color, opacity: 0.7, letterSpacing: '0.5px', flexShrink: 0 }}>
            {unit}
          </span>
        )}
      </div>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '1px' }}>{label}</p>
      <p style={{ fontSize: '9px', color: 'rgba(165,214,167,0.4)' }}>{sub}</p>
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 }}>
      <h2 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</h2>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sub}</span>
    </div>
  )
}

function MarketCard({ item, onBuy }) {
  const tagCfg = item.tag ? TAG_COLORS[item.tag] : null
  return (
    <div className="glass-card"
      style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0 }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(0,230,118,0.32)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,230,118,0.12)' }}
    >
      <div style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.07), rgba(0,0,0,0.35))', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', position: 'relative', borderBottom: '1px solid rgba(0,230,118,0.07)' }}>
        {item.emoji}
        {tagCfg && (
          <span style={{ position: 'absolute', top: '6px', left: '6px', background: tagCfg.bg, color: tagCfg.color, fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px', border: `1px solid ${tagCfg.color}40` }}>
            {item.tag}
          </span>
        )}
      </div>
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
        <p style={{ fontSize: '10px', color: 'rgba(165,214,167,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.categoryLabel} · {item.seller}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--green-primary)', letterSpacing: '-0.5px' }}>${item.price.toLocaleString()}</span>
          <button
            onClick={e => { e.stopPropagation(); onBuy && onBuy() }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 13px', background: 'linear-gradient(135deg, #00e676, #00c853)', border: 'none', borderRadius: '8px', color: '#0a0f0d', fontSize: '12px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,230,118,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <MdShoppingCart size={13} /> Comprar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── BuyModal inline para el Dashboard ── */
function BuyModal({ product, onClose, onPurchaseSuccess, updateUser }) {
  const [step,     setStep]     = useState('confirm') // confirm | processing | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const { user } = useUser()
  const balance    = Number(user?.balance || 0)
  const canBuy     = balance >= product.price

  async function handleConfirm() {
    if (!canBuy) { setErrorMsg('Saldo insuficiente.'); return }
    setStep('processing')
    try {
      const token = localStorage.getItem('bazar_token')
      const res   = await fetch('http://localhost:3001/api/purchases', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error || 'No se pudo completar.'); setStep('error'); return }
      updateUser({ balance: data.newBalance })
      onPurchaseSuccess()
      setStep('success')
    } catch {
      setErrorMsg('Error de conexión.')
      setStep('error')
    }
  }

  return (
    <div onClick={step !== 'processing' ? onClose : undefined}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '24px' }}>
      <div className="glass-card fade-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '44px', marginBottom: '14px' }}>⏳</div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Verificando transacción...</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>Espera un momento.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(0,230,118,0.15)', borderTop: '3px solid #00e676', animation: 'spin 0.8s linear infinite' }} />
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {(step === 'confirm' || step === 'error') && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>{product.emoji}</div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{product.name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Vendido por {product.seller}</p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Precio</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>${product.price.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tu saldo</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--green-primary)' }}>${balance.toLocaleString()}</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(0,230,118,0.08)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Saldo restante</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: canBuy ? 'var(--green-primary)' : '#ef5350' }}>
                  ${Math.max(0, balance - product.price).toLocaleString()}
                </span>
              </div>
            </div>
            {(errorMsg || !canBuy) && (
              <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: '9px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#ef5350' }}>
                ⚠️ {errorMsg || 'Saldo insuficiente.'}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirm} disabled={!canBuy}
                style={{ flex: 1, padding: '10px', fontSize: '13px', opacity: canBuy ? 1 : 0.5 }}>
                Confirmar compra
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '14px' }}>🎉</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green-primary)', marginBottom: '6px' }}>¡Compra exitosa!</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong> está en tus compras.
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.45)', marginBottom: '22px' }}>
              Ve a "Vender" para revenderlo en el marketplace.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ padding: '10px 28px', fontSize: '13px' }}>Continuar</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityRow({ type, user, item, amount, time }) {
  const cfg = TYPE_CFG[type]
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 8px', borderRadius: '7px', transition: 'background 0.15s', cursor: 'default' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,230,118,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '999px', background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}28`, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {cfg.label}
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</p>
          <p style={{ fontSize: '9px', color: 'rgba(165,214,167,0.4)' }}>{user} · {time}</p>
        </div>
      </div>
      <span style={{ fontSize: '10px', fontWeight: '700', color: cfg.color, flexShrink: 0, marginLeft: '5px' }}>
        {cfg.sign}${amount.toLocaleString()}
      </span>
    </div>
  )
}
