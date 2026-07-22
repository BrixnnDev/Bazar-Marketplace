import { useEffect, useMemo, useRef, useState } from 'react'

import {
  MdCheckCircle, MdCancel, MdReceipt, MdAccountBalanceWallet,
  MdPerson, MdImage, MdArrowBack, MdAddCard,
  MdRemoveCircle, MdDeleteForever, MdMoney,
} from 'react-icons/md'

const METHODS = {
  nequi:       { emoji: '💜', label: 'Nequi' },
  bancolombia: { emoji: '🟡', label: 'Bancolombia' },
  daviplata:   { emoji: '🔴', label: 'Daviplata' },
  efectivo:    { emoji: '💵', label: 'Efectivo' },
  otro:        { emoji: '💳', label: 'Otro' },
}

const STATUS_CFG = {
  pending:  { label: 'Pendiente', color: '#ffa726', bg: 'rgba(255,167,38,0.12)' },
  approved: { label: 'Aprobada',  color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
  denied:   { label: 'Rechazada', color: '#ef5350', bg: 'rgba(239,83,80,0.12)' },
}

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function AdminRechargePage() {
  // 'home' | 'requests' | 'recharge' | 'deduct' | 'withdrawals'
  const [view, setView] = useState('home')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        {view !== 'home' && (
          <button onClick={() => setView('home')}
            style={{ background: 'none', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '9px', padding: '6px 10px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.2)'}>
            <MdArrowBack size={15} /> Volver
          </button>
        )}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
            {view === 'home'        && 'Recargas & Retiros — Admin'}
            {view === 'requests'    && 'Solicitudes de recarga'}
            {view === 'recharge'    && 'Recargar cuenta'}
            {view === 'deduct'      && 'Eliminar saldo / créditos'}
            {view === 'withdrawals' && 'Solicitudes de Retiro' }
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {view === 'home'        && 'Selecciona una opción para continuar.'}
            {view === 'requests'    && 'Aprueba o rechaza las solicitudes enviadas por los usuarios.'}
            {view === 'recharge'    && 'Agrega saldo o créditos a cualquier cuenta por su ID.'}
            {view === 'deduct'      && 'Busca una cuenta y elimina saldo, créditos o ambos.'}
            {view === 'withdrawals' && 'Aprueba o rechaza los retiros solicitados por los usuarios.'}
          </p>
        </div>
      </div>

      {/* Contenido según vista */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {view === 'home'        && <HomeView     onSelect={setView} />}
        {view === 'requests'    && <RequestsView />}

        {view === 'recharge'    && <RechargeView />}
        {view === 'deduct'      && <DeductView />}
        {view === 'withdrawals' && <WithdrawalRequestsView />}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   VISTA HOME — dos cards centradas
══════════════════════════════════════ */
function HomeView({ onSelect }) {
  const [pending, setPending] = useState(0)
  const [pendingW, setPendingW] = useState(0)

  useEffect(() => {
    async function loadPending() {
      const token = localStorage.getItem('bazar_token')
      if (!token) return
      try {
        const res  = await fetch('http://localhost:3001/api/recharges', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setPending((data.requests || []).filter(r => r.status === 'pending').length)
      // eslint-disable-next-line no-empty
      } catch {}
      try {
        const res  = await fetch('http://localhost:3001/api/withdrawals', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setPendingW((data.requests || []).filter(r => r.status === 'pending').length)
      // eslint-disable-next-line no-empty
      } catch {}
    }
    loadPending()
    const interval = setInterval(loadPending, 5000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      id:     'requests',
      emoji:  '📋',
      title:  'Solicitudes',
      desc:   'Revisa las solicitudes de recarga enviadas por los usuarios y apruébalas o recházalas.',
      badge:  pending,
      color:  '#ffa726',
      bg:     'rgba(255,167,38,0.08)',
      border: 'rgba(255,167,38,0.22)',
    },
    {
      id:     'recharge',
      emoji:  '💳',
      title:  'Recargar',
      desc:   'Agrega saldo o créditos manualmente a cualquier cuenta usando su código #B.',
      badge:  null,
      color:  '#00e676',
      bg:     'rgba(0,230,118,0.08)',
      border: 'rgba(0,230,118,0.22)',
    },
    {
      id:     'deduct',
      emoji:  '🗑️',
      title:  'Eliminar',
      desc:   'Elimina saldo, créditos o ambos de cualquier cuenta de usuario.',
      badge:  null,
      color:  '#ef5350',
      bg:     'rgba(239,83,80,0.07)',
      border: 'rgba(239,83,80,0.2)',
    },

    {
      id:     'withdrawals',
      emoji:  '🏦',
      title:  'Solicitudes de Retiro',
      desc:  'Aprueba o rechaza retiros solicitados por los usuarios.',
      badge:  pendingW,
      color:  '#ffa726',
      bg:     'rgba(255,167,38,0.07)',
      border: 'rgba(255,167,38,0.2)',
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '1100px', flexWrap: 'wrap' }}>
        {cards.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            style={{
              flex: 1, padding: '36px 28px', borderRadius: '18px', cursor: 'pointer',
              background: c.bg, border: `1px solid ${c.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
              transition: 'all 0.2s', textAlign: 'center', position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${c.color}25` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.boxShadow = 'none' }}>

            {/* Badge de solicitudes pendientes */}
            {c.badge > 0 && (
              <div style={{ position: 'absolute', top: '14px', right: '14px', background: c.color, color: '#0a0f0d', borderRadius: '999px', fontSize: '11px', fontWeight: 900, padding: '2px 9px' }}>
                {c.badge} pendiente{c.badge > 1 ? 's' : ''}
              </div>
            )}

            <div style={{ fontSize: '48px', lineHeight: 1 }}>{c.emoji}</div>
            <div>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: c.color }}>{c.title}</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{c.desc}</p>
            </div>
            <div style={{ marginTop: '8px', padding: '8px 22px', borderRadius: '9px', background: c.color + '22', color: c.color, fontSize: '13px', fontWeight: 700, border: `1px solid ${c.color}44` }}>
              Ir a {c.title} →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   VISTA SOLICITUDES — lista derecha, detalle izquierda
══════════════════════════════════════ */
function RequestsView() {
  const [requests,   setRequests]   = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter,     setFilter]     = useState('all')
  const [imgZoom,    setImgZoom]    = useState(false)
  const [toastMsg,   setToastMsg]   = useState('')
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    const token = localStorage.getItem('bazar_token')
    if (!token) return
    try {
      const res  = await fetch('http://localhost:3001/api/recharges', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setRequests(data.requests || [])
    } catch { /* servidor no disponible */ }
  }


  const sorted   = useMemo(() => requests.slice().sort((a, b) => b.createdAt - a.createdAt), [requests])
  const filtered = useMemo(() => filter === 'all' ? sorted : sorted.filter(r => r.status === filter), [sorted, filter])

  const effectiveSelectedId = useMemo(() => {
    if (filtered.length === 0) return selectedId
    return filtered.find(r => r.id === selectedId) ? selectedId : filtered[0].id
  }, [filtered, selectedId])

  function toast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000) }

  function selectReq(id) { setSelectedId(id) }

  async function approve(id) {
    setLoading(true)
    const token = localStorage.getItem('bazar_token')
    try {
      const res  = await fetch(`http://localhost:3001/api/recharges/${id}/approve`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error || 'No se pudo aprobar.'); setLoading(false); return }
      await refresh()
      toast('✅ Recarga aprobada')
    } catch {
      toast('⚠️ Error de conexión.')
    } finally { setLoading(false) }
  }

  async function deny(id) {
    const token = localStorage.getItem('bazar_token')
    try {
      await fetch(`http://localhost:3001/api/recharges/${id}/deny`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      await refresh()
      toast('❌ Solicitud rechazada')
    } catch { toast('⚠️ Error de conexión.') }
  }

  const selected  = requests.find(r => r.id === effectiveSelectedId)
  const selMethod = METHODS[selected?.method] || { emoji: '💳', label: selected?.method || '' }
  const selStatus = STATUS_CFG[selected?.status] || STATUS_CFG.pending
  const pCount = sorted.filter(r => r.status === 'pending').length
  const aCount = sorted.filter(r => r.status === 'approved').length
  const dCount = sorted.filter(r => r.status === 'denied').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {[
          { id: 'all',      label: 'Todas',     count: sorted.length, color: 'var(--text-secondary)' },
          { id: 'pending',  label: 'Pendientes', count: pCount, color: '#ffa726' },
          { id: 'approved', label: 'Aprobadas',  count: aCount, color: '#00e676' },
          { id: 'denied',   label: 'Rechazadas', count: dCount, color: '#ef5350' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 14px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
              background: filter === f.id ? f.color + '18' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${filter === f.id ? f.color + '55' : 'rgba(0,230,118,0.1)'}`,
              color: filter === f.id ? f.color : 'var(--text-secondary)', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            <span style={{ fontWeight: 900 }}>{f.count}</span> {f.label}
          </button>
        ))}
      </div>

      {/* Grid detalle izq — lista der */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '12px', overflow: 'hidden', minHeight: 0 }}>

        {/* ── IZQUIERDA: Detalle de la solicitud seleccionada ── */}
        <div className="glass-card" style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'rgba(165,214,167,0.3)' }}>
              <MdReceipt size={44} opacity={0.3} />
              <p style={{ fontSize: '13px' }}>Selecciona una solicitud de la lista</p>
            </div>
          ) : (
            <>
              {/* Cabecera usuario */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '36px' }}>{selected.userAvatar || '👤'}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{selected.username}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selected.userCode}</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '999px', background: selStatus.bg, color: selStatus.color, border: `1px solid ${selStatus.color}33` }}>
                  {selStatus.label}
                </span>
              </div>

              {/* Datos en grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InfoBox icon={<MdAccountBalanceWallet size={15}/>} label="Monto solicitado" value={`$${fmt(selected.amount)} COP`} highlight />
                <InfoBox icon={<span>{selMethod.emoji}</span>} label="Método" value={selMethod.label} />
                <InfoBox icon={<MdPerson size={15}/>} label="Titular" value={selected.accountName} />
                <InfoBox label="Número de cuenta" value={selected.accountNumber} mono />
                <InfoBox label="Fecha solicitud" value={new Date(selected.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />
                {selected.processedAt && <InfoBox label="Fecha proceso" value={new Date(selected.processedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />}
              </div>

              {/* Comprobante */}
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MdImage size={15} color="var(--green-primary)"/> Comprobante
                </p>
                {selected.imgPreview ? (
                  <div style={{ cursor: 'zoom-in', display: 'inline-block', position: 'relative' }} onClick={() => setImgZoom(true)}>
                    <img src={selected.imgPreview} alt="comprobante" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.2)', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0'}>
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>🔍 Ver completo</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center', color: 'rgba(165,214,167,0.3)', fontSize: '12px', border: '1px dashed rgba(0,230,118,0.1)' }}>Sin comprobante</div>
                )}
              </div>

              {/* Botones acción */}
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn-primary" onClick={() => approve(selected.id)} disabled={loading}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.75 : 1 }}>
                    <MdCheckCircle size={18}/> {loading ? 'Aprobando...' : 'Aprobar'}
                  </button>
                  <button onClick={() => deny(selected.id)}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderRadius: '10px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', color: '#ef5350', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,83,80,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(239,83,80,0.1)'}>
                    <MdCancel size={18}/> Rechazar
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── DERECHA: Lista de solicitudes como notificaciones ── */}
        <div className="glass-card" style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(165,214,167,0.45)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Solicitudes ({filtered.length})
          </p>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.35)', textAlign: 'center', marginTop: '16px' }}>Sin solicitudes.</p>
          ) : filtered.map(r => {
            const s = STATUS_CFG[r.status] || STATUS_CFG.pending
            const m = METHODS[r.method]    || { emoji: '💳' }
            const isActive = effectiveSelectedId === r.id
            return (
              <button key={r.id} onClick={() => selectReq(r.id)}
                style={{
                  textAlign: 'left', padding: '10px 11px', borderRadius: '10px', cursor: 'pointer',
                  background: isActive ? 'rgba(0,230,118,0.08)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isActive ? 'rgba(0,230,118,0.3)' : 'rgba(0,230,118,0.06)'}`,
                  transition: 'all 0.15s', position: 'relative',
                }}>
                {/* Dot indicador de estado */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', background: s.color }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', paddingRight: '16px' }}>
                  {r.userAvatar || '👤'} {r.username}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green-primary)', marginTop: '2px' }}>
                  ${fmt(r.amount)} COP
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {m.emoji} {r.accountName}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(165,214,167,0.35)', marginTop: '2px' }}>
                  {new Date(r.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Zoom imagen */}
      {imgZoom && selected?.imgPreview && (
        <div onClick={() => setImgZoom(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'zoom-out' }}>
          <img src={selected.imgPreview} alt="zoom" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '14px', objectFit: 'contain', border: '1px solid rgba(0,230,118,0.25)' }} />
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,26,20,0.97)', border: '1px solid rgba(0,230,118,0.3)', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', zIndex: 9998, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease' }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════
   VISTA RECARGAR — layout estático, sin scroll
   Grid: [Buscar] [Info usuario] [Formulario]
══════════════════════════════════════ */
function RechargeView() {
  const [targetCode, setTargetCode] = useState('')
  const [foundUser,  setFoundUser]  = useState(null)
  const [searching,  setSearching]  = useState(false)
  const [searchErr,  setSearchErr]  = useState('')
  const [type,       setType]       = useState('balance')
  const [amount,     setAmount]     = useState('')
  const [note,       setNote]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [err,        setErr]        = useState('')
  const token = localStorage.getItem('bazar_token')

  async function searchUser() {
    setSearchErr(''); setFoundUser(null); setSuccess(false); setErr('')
    const code = targetCode.trim().toUpperCase()
    if (!code) { setSearchErr('Ingresa un código.'); return }
    if (!/^#B[A-Z0-9]{8}$/i.test(code)) { setSearchErr('Formato inválido: #B + 8 caracteres.'); return }
    setSearching(true)
    try {
      const res  = await fetch(`http://localhost:3001/api/admin/user-by-code/${encodeURIComponent(code)}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setSearchErr(data.error || 'No encontrado.'); return }
      setFoundUser(data.user)
    } catch {
      setSearchErr('Sin conexión al servidor.')
    } finally { setSearching(false) }
  }

  async function handleRecharge() {
    setErr('')
    if (!amount || Number(amount) <= 0) { setErr('Ingresa un monto válido.'); return }
    setLoading(true)
    try {
      const res  = await fetch('http://localhost:3001/api/admin/recharge', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: foundUser.code, type, amount: Number(amount), note }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Error.'); return }
      applyLocally()
    } catch { applyLocally() }
    finally { setLoading(false) }

    function applyLocally() {
      setFoundUser(prev => ({ ...prev, [type]: Number(prev[type]||0)+Number(amount) }))
      setSuccess(true); setAmount(''); setNote('')
      setTimeout(() => setSuccess(false), 3500)
    }
  }

  return (
    /* Layout estático: 3 columnas del mismo alto, sin overflow */
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', overflow: 'hidden' }}>

      {/* ── COL 1: Buscar por ID ── */}
      <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div>
          <p style={sec}>🔍 Buscar cuenta</p>
          <p style={sub}>Ingresa el código #B del usuario</p>
        </div>

        {/* Input + botón */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input className="input-dark" placeholder="#B12345678" value={targetCode}
            onChange={e => { setTargetCode(e.target.value.toUpperCase()); setFoundUser(null); setSuccess(false) }}
            onKeyDown={e => e.key === 'Enter' && searchUser()}
            style={{ width: '100%', padding: '11px 14px', fontSize: '15px', fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 700, textAlign: 'center' }}
            maxLength={10} />
          <button className="btn-primary" onClick={searchUser} disabled={searching}
            style={{ padding: '11px', fontSize: '14px', fontWeight: 700, opacity: searching ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {searching ? <><span style={spinnerSt}/>Buscando...</> : <><MdPerson size={17}/>Buscar</>}
          </button>
        </div>

        {searchErr && (
          <div style={{ padding: '10px 12px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: '9px', fontSize: '12px', color: '#ef5350' }}>
            ⚠️ {searchErr}
          </div>
        )}

        {/* Instrucciones cuando no hay búsqueda */}
        {!foundUser && !searchErr && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.35 }}>
            <MdPerson size={48} color="var(--green-primary)" />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.6' }}>
              El código tiene el formato<br /><strong style={{ fontFamily: 'monospace', color: 'var(--green-primary)' }}>#B</strong> + 8 caracteres
            </p>
          </div>
        )}
      </div>

      {/* ── COL 2: Info del usuario encontrado ── */}
      <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
        <div>
          <p style={sec}>👤 Información de cuenta</p>
          <p style={sub}>Datos del usuario encontrado</p>
        </div>

        {!foundUser ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.3 }}>
            <MdAccountBalanceWallet size={52} color="var(--green-primary)" />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Busca una cuenta para ver su información</p>
          </div>
        ) : (
          <>
            {/* Avatar + nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: 'rgba(0,230,118,0.06)', borderRadius: '12px', border: '1px solid rgba(0,230,118,0.18)' }}>
              <div style={{ fontSize: '42px', lineHeight: 1 }}>{foundUser.avatar || '👤'}</div>
              <div>
                <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{foundUser.username || foundUser.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: '1px' }}>{foundUser.code}</p>
              </div>
            </div>

            {/* Cards de saldo y créditos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px 10px', background: 'rgba(0,230,118,0.07)', borderRadius: '12px', border: '1px solid rgba(0,230,118,0.18)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(165,214,167,0.5)', fontWeight: 600, marginBottom: '5px' }}>💰 SALDO</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--green-primary)', wordBreak: 'break-all', lineHeight: 1.3 }}>
                  ${fmt(foundUser.balance)} <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>COP</span>
                </p>
              </div>
              <div style={{ padding: '12px 10px', background: 'rgba(206,147,216,0.07)', borderRadius: '12px', border: '1px solid rgba(206,147,216,0.18)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(206,147,216,0.6)', fontWeight: 600, marginBottom: '5px' }}>⭐ CRÉDITOS</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#ce93d8', wordBreak: 'break-all', lineHeight: 1.3 }}>
                  {fmt(foundUser.credits)} <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>Bz</span>
                </p>
              </div>
            </div>

            {/* Estado activo */}
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Estado de cuenta</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: foundUser.is_active !== false ? '#00e676' : '#ef5350', background: foundUser.is_active !== false ? 'rgba(0,230,118,0.1)' : 'rgba(239,83,80,0.1)', padding: '3px 10px', borderRadius: '999px' }}>
                {foundUser.is_active !== false ? '✓ Activa' : '✗ Suspendida'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── COL 3: Formulario de recarga ── */}
      <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
        <div>
          <p style={sec}><MdAddCard size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }}/>Aplicar recarga</p>
          <p style={sub}>Elige tipo, monto y confirma</p>
        </div>

        {!foundUser ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.3 }}>
            <MdAddCard size={52} color="var(--green-primary)" />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Primero busca la cuenta destino</p>
          </div>
        ) : (
          <>
            {/* Tipo */}
            <div>
              <p style={lbl}>Tipo de recarga</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'balance', label: '💰 Saldo',    color: '#00e676' },
                  { id: 'credits', label: '⭐ Créditos', color: '#ce93d8' },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setType(t.id)}
                    style={{ padding: '11px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: type===t.id ? t.color+'18' : 'rgba(0,0,0,0.25)', border: `1px solid ${type===t.id ? t.color+'44' : 'rgba(0,230,118,0.08)'}`, color: type===t.id ? t.color : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div>
              <p style={lbl}>Monto <span style={{ color: '#ef5350' }}>*</span></p>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', color: 'rgba(0,230,118,0.5)', fontSize: '14px', fontWeight: 700 }}>$</span>
                <input className="input-dark" type="text" inputMode="numeric" placeholder="0"
                  value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g,''))}
                  style={{ width: '100%', padding: '11px 55px 11px 28px', fontSize: '18px', fontWeight: 900 }} />
                <span style={{ position: 'absolute', right: '12px', fontSize: '11px', fontWeight: 700, color: 'rgba(165,214,167,0.4)', pointerEvents: 'none' }}>COP</span>
              </div>
            </div>

            {/* Nota */}
            <div>
              <p style={lbl}>Nota interna (opcional)</p>
              <input className="input-dark" type="text" placeholder="Ej: Recarga manual por soporte"
                value={note} onChange={e => setNote(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }} />
            </div>

            {/* Feedback */}
            {err && <div style={{ padding: '9px 12px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: '9px', fontSize: '12px', color: '#ef5350' }}>⚠️ {err}</div>}
            {success && (
              <div style={{ padding: '10px 12px', background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: '9px', fontSize: '13px', color: 'var(--green-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>
                <MdCheckCircle size={16}/> Recarga aplicada correctamente
              </div>
            )}

            {/* Botón — al final, pegado abajo */}
            <div style={{ marginTop: 'auto' }}>
              <button className="btn-primary" onClick={handleRecharge} disabled={loading}
                style={{ width: '100%', padding: '13px', fontSize: '14px', fontWeight: 700, opacity: loading ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px' }}>
                {loading ? <><span style={spinnerSt}/>Aplicando...</> : <><MdAccountBalanceWallet size={18}/> Aplicar {type === 'balance' ? 'saldo' : 'créditos'}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Helpers ── */
const lbl = { fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 500 }
const sec = { margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }
const sub = { margin: '3px 0 0', fontSize: '11px', color: 'rgba(165,214,167,0.45)' }
const spinnerSt = {
  display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%',
  border: '2px solid rgba(10,15,13,0.3)', borderTop: '2px solid #0a0f0d',
  animation: 'spin 0.7s linear infinite',
}

function InfoBox({ icon, label, value, highlight, mono }) {
  return (
    <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.22)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.07)' }}>
      <p style={{ fontSize: '10px', color: 'rgba(165,214,167,0.5)', margin: '0 0 4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
        {icon && <span style={{ color: 'rgba(0,230,118,0.5)', display: 'flex' }}>{icon}</span>}
        {label}
      </p>
      <p style={{ margin: 0, fontSize: highlight ? '15px' : '13px', fontWeight: highlight ? 800 : 600, color: highlight ? 'var(--green-primary)' : 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value || '—'}
      </p>
    </div>
  )
}

/* ══════════════════════════════════════
   VISTA ELIMINAR — quitar saldo/créditos
   Layout: [Buscar + perfiles] [Acciones]
══════════════════════════════════════ */
function DeductView() {
  const [query,      setQuery]      = useState('')
  const [allUsers,   setAllUsers]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [confirm,    setConfirm]    = useState(null) // { type: 'balance'|'credits'|'all', label }
  const [success,    setSuccess]    = useState('')
  const [err,        setErr]        = useState('')
  const token = localStorage.getItem('bazar_token')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allUsers
    return allUsers.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.code?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  }, [query, allUsers])

  /* Cargar todos los usuarios al montar */
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res  = await fetch('http://localhost:3001/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok) { setAllUsers(data.users || []) }
      } catch {
        setErr('Sin conexión al servidor.')
      } finally { setLoading(false) }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function doDeduct(type) {
    setErr(''); setSuccess('')
    try {
      const res  = await fetch('http://localhost:3001/api/admin/deduct', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code: selected.code, type }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Error.'); return }
      /* Actualizar lista local */
      const updated = { ...selected, balance: type !== 'credits' ? 0 : selected.balance, credits: type !== 'balance' ? 0 : selected.credits }
      setSelected(updated)
      setAllUsers(prev => prev.map(u => u.code === selected.code ? updated : u))
      const labels = { balance: 'Saldo', credits: 'Créditos', all: 'Saldo y Créditos' }
      setSuccess(`✅ ${labels[type]} eliminado${type === 'all' ? 's' : ''} correctamente.`)
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setErr('Sin conexión al servidor.')
    }
    setConfirm(null)
  }

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', overflow: 'hidden' }}>

      {/* ── IZQUIERDA: buscador + lista de perfiles ── */}
      <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
        <div>
          <p style={sec}>🔍 Buscar usuarios</p>
          <p style={sub}>Busca por nombre, código o correo</p>
        </div>

        <input className="input-dark" placeholder="Buscar usuario..."
          value={query} onChange={e => setQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }} />

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cargando usuarios...</span>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
            {filtered.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.35)', textAlign: 'center', marginTop: '20px' }}>Sin resultados.</p>
            ) : filtered.map(u => {
              const isActive = selected?.code === u.code
              return (
                <button key={u.code || u.id} onClick={() => { setSelected(u); setSuccess(''); setErr('') }}
                  style={{
                    textAlign: 'left', padding: '11px 13px', borderRadius: '10px', cursor: 'pointer',
                    background: isActive ? 'rgba(239,83,80,0.08)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isActive ? 'rgba(239,83,80,0.3)' : 'rgba(0,230,118,0.07)'}`,
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                  <div style={{ fontSize: '26px', lineHeight: 1 }}>{u.avatar || '👤'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.username || u.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: '1px' }}>{u.code}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-primary)' }}>${fmt(u.balance)}</div>
                    <div style={{ fontSize: '10px', color: '#ce93d8' }}>⭐ {fmt(u.credits)}</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── DERECHA: acciones sobre el usuario seleccionado ── */}
      <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.3 }}>
            <MdRemoveCircle size={52} color="#ef5350" />
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Selecciona un usuario de la lista</p>
          </div>
        ) : (
          <>
            {/* Perfil del usuario */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: 'rgba(239,83,80,0.06)', borderRadius: '12px', border: '1px solid rgba(239,83,80,0.18)' }}>
              <div style={{ fontSize: '38px' }}>{selected.avatar || '👤'}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>{selected.username || selected.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selected.code}</p>
              </div>
            </div>

            {/* Saldo y créditos actuales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px 10px', background: 'rgba(0,230,118,0.07)', borderRadius: '12px', border: '1px solid rgba(0,230,118,0.18)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(165,214,167,0.5)', fontWeight: 600, marginBottom: '5px' }}>💰 SALDO</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--green-primary)', wordBreak: 'break-all', lineHeight: 1.3 }}>
                  ${fmt(selected.balance)} <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>COP</span>
                </p>
              </div>
              <div style={{ padding: '12px 10px', background: 'rgba(206,147,216,0.07)', borderRadius: '12px', border: '1px solid rgba(206,147,216,0.18)', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(206,147,216,0.6)', fontWeight: 600, marginBottom: '5px' }}>⭐ CRÉDITOS</p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#ce93d8', wordBreak: 'break-all', lineHeight: 1.3 }}>
                  {fmt(selected.credits)} <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.6 }}>Bz</span>
                </p>
              </div>
            </div>

            {/* Botones de eliminación */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', alignItems: 'flex-start' }}>
              <p style={lbl}>Selecciona qué eliminar</p>
              <button onClick={() => setConfirm({ type: 'balance', label: 'el saldo' })}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', color: 'var(--green-primary)', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,230,118,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,230,118,0.08)'}>
                <MdMoney size={17}/> Eliminar solo saldo (${fmt(selected.balance)} COP)
              </button>
              <button onClick={() => setConfirm({ type: 'credits', label: 'los créditos' })}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: 'rgba(206,147,216,0.08)', border: '1px solid rgba(206,147,216,0.2)', color: '#ce93d8', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(206,147,216,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(206,147,216,0.08)'}>
                <MdRemoveCircle size={17}/> Eliminar solo créditos ({fmt(selected.credits)} Bz)
              </button>
              <button onClick={() => setConfirm({ type: 'all', label: 'el saldo y los créditos' })}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.25)', color: '#ef5350', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,83,80,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,83,80,0.08)'}>
                <MdDeleteForever size={18}/> Eliminar TODO (saldo + créditos)
              </button>
            </div>

            {err     && <div style={{ padding: '9px 12px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: '9px', fontSize: '12px', color: '#ef5350' }}>⚠️ {err}</div>}
            {success && <div style={{ padding: '10px 12px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: '9px', fontSize: '13px', color: 'var(--green-primary)', fontWeight: 700 }}>{success}</div>}
          </>
        )}
      </div>

      {/* ── Modal de confirmación ── */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setConfirm(null)}>
          <div className="glass-card fade-in" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '100%', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px' }}>⚠️</div>
            <div>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>¿Confirmar eliminación?</p>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Se eliminará <strong style={{ color: '#ef5350' }}>{confirm.label}</strong> de la cuenta de<br />
                <strong style={{ color: 'var(--text-primary)' }}>{selected?.username}</strong> ({selected?.code}).<br />
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={() => setConfirm(null)}
                style={{ flex: 1, padding: '11px', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={() => doDeduct(confirm.type)}
                style={{ flex: 1, padding: '11px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderRadius: '10px', background: 'rgba(239,83,80,0.15)', border: '1px solid rgba(239,83,80,0.4)', color: '#ef5350', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,83,80,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,83,80,0.15)'}>
                <MdDeleteForever size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }}/>Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/* ══════════════════════════════════════
   VISTA SOLICITUDES DE RETIRO (admin)
   Admin aprueba/rechaza retiros de usuarios
══════════════════════════════════════ */
const W_STATUS = {
  pending:  { label: 'Pendiente', color: '#ffa726', bg: 'rgba(255,167,38,0.12)' },
  approved: { label: 'Aprobado',  color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
  denied:   { label: 'Rechazado', color: '#ef5350', bg: 'rgba(239,83,80,0.12)' },
}

function WithdrawalRequestsView() {
  const [requests,   setRequests]   = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter,     setFilter]     = useState('all')
  const [loading,    setLoading]    = useState(false)
  const [toastMsg,   setToastMsg]   = useState('')

  const refreshRef = useRef(null)

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('bazar_token')
      if (!token) return
      try {
        const res  = await fetch('http://localhost:3001/api/withdrawals', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('Withdrawals fetch error:', res.status, err.error)
          if (res.status === 401) {
            setRequests([])
          }
          return
        }
        const data = await res.json()
        setRequests(data.requests || [])
      } catch (e) {
        console.error('Withdrawals fetch exception:', e)
      }
    }
    refreshRef.current = load
    load()
    const interval = setInterval(() => { if (refreshRef.current) refreshRef.current() }, 5000)
    return () => clearInterval(interval)
  }, [])

  const sorted   = useMemo(() => requests.slice().sort((a, b) => b.createdAt - a.createdAt), [requests])
  const filtered = useMemo(() => filter === 'all' ? sorted : sorted.filter(r => r.status === filter), [sorted, filter])

  const effectiveSelectedId = useMemo(() => {
    if (filtered.length === 0) return selectedId
    return filtered.find(r => r.id === selectedId) ? selectedId : filtered[0]?.id
  }, [filtered, selectedId])

  function toast(msg) { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000) }

  async function approve(id) {
    setLoading(true)
    const token = localStorage.getItem('bazar_token')
    try {
      const res  = await fetch(`http://localhost:3001/api/withdrawals/${id}/approve`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error || 'No se pudo aprobar.'); setLoading(false); return }
      if (refreshRef.current) await refreshRef.current()
      toast('✅ Retiro aprobado — saldo descontado')
    } catch {
      toast('⚠️ Error de conexión.')
    } finally { setLoading(false) }
  }

  async function deny(id) {
    const token = localStorage.getItem('bazar_token')
    try {
      await fetch(`http://localhost:3001/api/withdrawals/${id}/deny`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (refreshRef.current) await refreshRef.current()
      toast('❌ Retiro rechazado')
    } catch { toast('⚠️ Error de conexión.') }
  }

  const selected = requests.find(r => r.id === effectiveSelectedId)
  const selBank  = selected ? BANK_LABELS[selected.bankId] || { emoji: '🏦', label: selected.bankLabel } : null
  const selStatus = W_STATUS[selected?.status] || W_STATUS.pending
  const pCount = sorted.filter(r => r.status === 'pending').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {[
          { id: 'all',      label: 'Todas',     count: sorted.length, color: 'var(--text-secondary)' },
          { id: 'pending',  label: 'Pendientes', count: pCount, color: '#ffa726' },
          { id: 'approved', label: 'Aprobados',  count: sorted.filter(r => r.status === 'approved').length, color: '#00e676' },
          { id: 'denied',   label: 'Rechazados', count: sorted.filter(r => r.status === 'denied').length, color: '#ef5350' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 14px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
              background: filter === f.id ? f.color + '18' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${filter === f.id ? f.color + '55' : 'rgba(0,230,118,0.1)'}`,
              color: filter === f.id ? f.color : 'var(--text-secondary)', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            <span style={{ fontWeight: 900 }}>{f.count}</span> {f.label}
          </button>
        ))}
      </div>

      {/* Grid detalle izq — lista der */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: '12px', overflow: 'hidden', minHeight: 0 }}>

        {/* ── IZQUIERDA: Detalle ── */}
        <div className="glass-card" style={{ padding: '22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'rgba(165,214,167,0.3)' }}>
              <MdMoney size={44} opacity={0.3} />
              <p style={{ fontSize: '13px' }}>Selecciona una solicitud de retiro</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '36px' }}>{selected.userAvatar || '👤'}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>{selected.username}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selected.userCode}</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '999px', background: selStatus.bg, color: selStatus.color, border: `1px solid ${selStatus.color}33` }}>
                  {selStatus.label}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <InfoBox icon={<MdMoney size={15}/>} label="Monto a retirar" value={`$${fmt(selected.amount)} COP`} highlight />
                <InfoBox icon={<span>{selBank?.emoji}</span>} label="Banco destino" value={selBank?.label || selected.bankLabel} />
                <InfoBox icon={<MdPerson size={15}/>} label="Titular" value={selected.ownerName} />
                <InfoBox icon={<MdAccountBalanceWallet size={15}/>} label="Cuenta" value={selected.accountNumber} mono />
                {selected.nit && <InfoBox label="NIT/CC" value={selected.nit} />}
                <InfoBox label="Fecha solicitud" value={new Date(selected.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />
                {selected.processedAt && <InfoBox label="Fecha proceso" value={new Date(selected.processedAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />}
              </div>

              {selected.status === 'pending' && (
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn-primary" onClick={() => approve(selected.id)} disabled={loading}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.75 : 1 }}>
                    <MdCheckCircle size={18}/> {loading ? 'Aprobando...' : 'Aprobar retiro'}
                  </button>
                  <button onClick={() => deny(selected.id)}
                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', borderRadius: '10px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', color: '#ef5350', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(239,83,80,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(239,83,80,0.1)'}>
                    <MdCancel size={18}/> Rechazar
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── DERECHA: Lista ── */}
        <div className="glass-card" style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(165,214,167,0.45)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Solicitudes ({filtered.length})
          </p>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.35)', textAlign: 'center', marginTop: '16px' }}>Sin solicitudes.</p>
          ) : filtered.map(r => {
            const s = W_STATUS[r.status] || W_STATUS.pending
            const bk = BANK_LABELS[r.bankId] || { emoji: '🏦' }
            const isActive = effectiveSelectedId === r.id
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)}
                style={{
                  textAlign: 'left', padding: '10px 11px', borderRadius: '10px', cursor: 'pointer',
                  background: isActive ? 'rgba(255,167,38,0.08)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${isActive ? 'rgba(255,167,38,0.3)' : 'rgba(0,230,118,0.06)'}`,
                  transition: 'all 0.15s', position: 'relative',
                }}>
                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '7px', height: '7px', borderRadius: '50%', background: s.color }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', paddingRight: '16px' }}>
                  {r.userAvatar || '👤'} {r.username}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green-primary)', marginTop: '2px' }}>
                  ${fmt(r.amount)} COP
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {bk.emoji} {r.bankLabel || r.bankId} · {r.accountNumber}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(165,214,167,0.35)', marginTop: '2px' }}>
                  {new Date(r.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,26,20,0.97)', border: '1px solid rgba(0,230,118,0.3)', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', zIndex: 9998, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}

const BANK_LABELS = {
  nequi:       { emoji: '💜', label: 'Nequi' },
  bancolombia: { emoji: '🟡', label: 'Bancolombia' },
  daviplata:   { emoji: '🔴', label: 'Daviplata' },
  efectivo:    { emoji: '💵', label: 'Efectivo' },
  otro:        { emoji: '💳', label: 'Otro' },
}
