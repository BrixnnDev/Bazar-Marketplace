import { useState, useEffect, useCallback } from 'react'
import { useUser } from '../../../context/UserContext'
import {
  MdSell, MdShoppingCart, MdMoneyOff, MdSettings,
  MdMarkEmailRead, MdDeleteSweep, MdMessage, MdCircle,
  MdAddCard, MdHistory, MdClose,
} from 'react-icons/md'

import API from '../../../config/api'

const TYPES = {
  recarga: { label: 'Recarga', icon: MdAddCard,      color: '#69f0ae', bg: 'rgba(105,240,174,0.1)' },
  retiro:  { label: 'Retiro',  icon: MdMoneyOff,     color: '#ffa726', bg: 'rgba(255,167,38,0.1)'  },
  compra:  { label: 'Compra',  icon: MdShoppingCart, color: '#64b5f6', bg: 'rgba(100,181,246,0.1)' },
  venta:   { label: 'Venta',   icon: MdSell,         color: '#00e676', bg: 'rgba(0,230,118,0.1)'   },
  sistema: { label: 'Sistema', icon: MdSettings,     color: '#ce93d8', bg: 'rgba(206,147,216,0.1)' },
  mensaje: { label: 'Mensaje', icon: MdMessage,      color: '#f48fb1', bg: 'rgba(244,143,177,0.1)' },
}

const TABS = [
  { key: 'todas',   label: 'Todas',   color: '#00e676' },
  { key: 'recarga', label: 'Recarga', color: '#69f0ae' },
  { key: 'retiro',  label: 'Retiro',  color: '#ffa726' },
  { key: 'compra',  label: 'Compra',  color: '#64b5f6' },
  { key: 'venta',   label: 'Venta',   color: '#00e676' },
  { key: 'sistema', label: 'Sistema', color: '#ce93d8' },
  { key: 'mensaje', label: 'Mensaje', color: '#f48fb1' },
]

function getToken() { return localStorage.getItem('bazar_token') }

/* Devuelve true si la notif es del día de hoy */
function isToday(notif) {
  const d = new Date(notif.createdAt || Date.now())
  const t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

/* La notificación de bienvenida de inicio de sesión no se muestra
   en la lista principal, solo en el historial */
function isLoginNotif(n) {
  return n.type === 'sistema' && n.title === 'Inicio de sesión'
}

export default function NotificationsPage() {
  useUser()
  const [allNotifs,      setAllNotifs]        = useState([])
  const [activeTab,      setTab]              = useState('todas')
  const [selectedNotif,  setSelectedNotif]    = useState(null)
  const [loading,        setLoading]          = useState(true)
  const [showHistory,    setShowHistory]      = useState(false)

  const loadNotifs = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const res  = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setAllNotifs(data.notifications || [])
    // eslint-disable-next-line no-empty
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadNotifs() // eslint-disable-line react-hooks/set-state-in-effect
    const iv = setInterval(loadNotifs, 5000)
    return () => clearInterval(iv)
  }, [loadNotifs])

  /* ── Notifs de hoy (sin login) — se ven en la lista principal ── */
  const todayNotifs   = allNotifs.filter(n => isToday(n) && !isLoginNotif(n))
  /* ── Historial: todo lo que no es de hoy + notifs de login ── */
  const historyNotifs = allNotifs.filter(n => !isToday(n) || isLoginNotif(n))

  /* Fuente según la vista activa */
  const sourceNotifs = showHistory ? historyNotifs : todayNotifs

  const filtered = activeTab === 'todas'
    ? sourceNotifs
    : sourceNotifs.filter(n => n.type === activeTab)

  const unreadToday   = todayNotifs.filter(n => !n.read).length
  const unreadHistory = historyNotifs.filter(n => !n.read).length

  /* ── Acciones ── */
  async function markOne(id) {
    setAllNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch(`${API}/api/notifications/${id}/read`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {})
  }

  async function markAll() {
    setAllNotifs(prev => prev.map(n => ({ ...n, read: true })))
    await fetch(`${API}/api/notifications/read-all`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {})
  }

  async function dismiss(id) {
    setAllNotifs(prev => prev.filter(n => n.id !== id))
    await fetch(`${API}/api/notifications/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {})
  }

  async function clearRead() {
    const readInView = sourceNotifs.filter(n => n.read).map(n => n.id)
    setAllNotifs(prev => prev.filter(n => !readInView.includes(n.id)))
    await fetch(`${API}/api/notifications?read=true`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {})
  }

  const readCount = sourceNotifs.filter(n => n.read).length

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Notificaciones</h1>
          {!showHistory && unreadToday > 0 && (
            <span style={{ background: 'var(--green-primary)', color: '#0a0f0d', borderRadius: '999px', padding: '1px 9px', fontSize: '12px', fontWeight: 700 }}>
              {unreadToday}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Botón historial */}
          <button
            onClick={() => { setShowHistory(!showHistory); setTab('todas') }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: showHistory ? 'rgba(255,167,38,0.12)' : 'rgba(0,0,0,0.25)',
              border: `1px solid ${showHistory ? 'rgba(255,167,38,0.4)' : 'rgba(0,230,118,0.15)'}`,
              color: showHistory ? '#ffa726' : 'var(--text-secondary)', transition: 'all 0.2s',
            }}>
            <MdHistory size={15} />
            Historial
            {unreadHistory > 0 && !showHistory && (
              <span style={{ background: '#ffa726', color: '#0a0f0d', borderRadius: '999px', padding: '0 6px', fontSize: '9px', fontWeight: 800 }}>
                {unreadHistory}
              </span>
            )}
          </button>

          {unreadToday > 0 && !showHistory && (
            <button onClick={markAll} className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '12px' }}>
              <MdMarkEmailRead size={14} /> Leer todo
            </button>
          )}
          {readCount > 0 && (
            <button onClick={clearRead}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)', borderRadius: '9px', color: '#ef5350', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
              <MdDeleteSweep size={14} /> Limpiar leídas
            </button>
          )}
        </div>
      </div>

      {/* Banner modo historial */}
      {showHistory && (
        <div className="fade-in" style={{ flexShrink: 0, padding: '8px 14px', background: 'rgba(255,167,38,0.08)', border: '1px solid rgba(255,167,38,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ffa726' }}>
          <MdHistory size={15} />
          Mostrando historial de notificaciones anteriores a hoy.
          <button onClick={() => setShowHistory(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ffa726', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <MdClose size={15} />
          </button>
        </div>
      )}

      {/* ── LAYOUT TABS + LISTA ── */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>

        {/* Tabs verticales */}
        <div className="glass-card" style={{ padding: '6px', width: '150px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {TABS.map(t => {
            const src      = showHistory ? historyNotifs : todayNotifs
            const typeList = t.key === 'todas' ? src : src.filter(n => n.type === t.key)
            const tabUnread = typeList.filter(n => !n.read).length
            const active   = activeTab === t.key
            const cfg      = TYPES[t.key]
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', background: active ? `${t.color}18` : 'transparent', color: active ? t.color : 'var(--text-secondary)', fontWeight: active ? 600 : 400, fontSize: '12px', transition: 'all 0.15s', textAlign: 'left', width: '100%', borderColor: active ? `${t.color}35` : 'transparent' }}>
                {cfg && <cfg.icon size={13} style={{ flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                {tabUnread > 0 && (
                  <span style={{ background: t.color, color: '#0a0f0d', borderRadius: '999px', padding: '0 4px', fontSize: '9px', fontWeight: 800, flexShrink: 0 }}>
                    {tabUnread}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Lista */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>{showHistory ? '📂' : '🔔'}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>
                {showHistory ? 'Sin notificaciones anteriores.' : 'No hay notificaciones hoy.'}
              </p>
              {!showHistory && (
                <p style={{ color: 'rgba(165,214,167,0.35)', fontSize: '12px' }}>
                  Las notificaciones de tus acciones aparecerán aquí.
                </p>
              )}
            </div>
          ) : filtered.map(n => (
            <NotifRow key={n.id} notif={n}
              onDismiss={dismiss}
              onOpen={n2 => { if (!n2.read) markOne(n2.id); setSelectedNotif(n2) }}
            />
          ))}
        </div>
      </div>

      {/* Modal detalle */}
      {selectedNotif && (
        <div onClick={() => setSelectedNotif(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-card fade-in" onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '460px', padding: '24px', position: 'relative' }}>
            <button onClick={() => setSelectedNotif(null)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            {(() => {
              const cfg = TYPES[selectedNotif.type] || TYPES.sistema
              return (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, fontSize: '11px', fontWeight: 700, marginBottom: '12px' }}>
                  <cfg.icon size={13} /> {cfg.label}
                </div>
              )
            })()}
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {selectedNotif.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '10px' }}>
              {selectedNotif.body}
            </p>
            {selectedNotif.details && (
              <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(0,230,118,0.1)', borderRadius: '10px', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {selectedNotif.details}
              </div>
            )}
            <p style={{ fontSize: '10px', color: 'rgba(165,214,167,0.35)', marginTop: '12px' }}>{selectedNotif.time}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function NotifRow({ notif, onDismiss, onOpen }) {
  const cfg  = TYPES[notif.type] || TYPES.sistema
  const Icon = cfg.icon
  return (
    <div className="glass-card"
      onClick={() => onOpen(notif)}
      style={{ padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', opacity: notif.read ? 0.72 : 1, borderColor: !notif.read ? `${cfg.color}25` : 'rgba(0,230,118,0.08)', transition: 'all 0.15s', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)'; e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.opacity = notif.read ? '0.72' : '1' }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${cfg.color}25` }}>
        <Icon size={17} style={{ color: cfg.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <p style={{ fontSize: '13px', fontWeight: notif.read ? 500 : 700, color: 'var(--text-primary)' }}>{notif.title}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: '999px', fontSize: '9px', fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25`, textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0 }}>
              {cfg.label}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(165,214,167,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>{notif.time}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{notif.body}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {!notif.read && <MdCircle size={8} style={{ color: 'var(--green-primary)' }} />}
        <button onClick={e => { e.stopPropagation(); onDismiss(notif.id) }}
          style={{ background: 'none', border: 'none', color: 'rgba(165,214,167,0.2)', cursor: 'pointer', fontSize: '16px', padding: 0, lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef5350')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(165,214,167,0.2)')}>
          ×
        </button>
      </div>
    </div>
  )
}
