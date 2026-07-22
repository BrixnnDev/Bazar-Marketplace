import API_BASE from '../../config/api'
import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  MdDashboard, MdStorefront, MdSell, MdAccountBalanceWallet,
  MdNotifications, MdSettings, MdLogout,
  MdPeople, MdInventory2, MdSupportAgent, MdHeadsetMic,
  MdAddCard, MdPayments,
} from 'react-icons/md'
import { useSupport } from '../../context/SupportContext'
import { useUser } from '../../context/UserContext'


const mainNav = [
  { to: '/dashboard',               icon: MdDashboard,            label: 'Inicio'         },
  { to: '/dashboard/marketplace',   icon: MdStorefront,           label: 'Marketplace'    },
  { to: '/dashboard/sell',          icon: MdSell,                 label: 'Vender'         },
  { to: '/dashboard/withdrawals',   icon: MdAccountBalanceWallet, label: 'Retiros',       userOnly: true },
  { to: '/dashboard/recharge',      icon: MdAddCard,              label: 'Recargas',      userOnly: true },
  { to: '/dashboard/notifications', icon: MdNotifications,        label: 'Notificaciones' },
  { to: '/dashboard/support',       icon: MdSupportAgent,         label: 'Soporte'        },
]

const adminNav = [
  { to: '/dashboard/admin/recharge',  icon: MdPayments,             label: 'Recargas Admin' },
  { to: '/dashboard/admin/inventory', icon: MdInventory2,            label: 'Inventario'     },
  { to: '/dashboard/admin/users',     icon: MdPeople,                label: 'Usuarios'       },
  { to: '/dashboard/admin/support',   icon: MdHeadsetMic,            label: 'Soporte Admin'  },
]

/* Tooltip via ::after con position:fixed para evitar clipping del aside */
const CSS = `
  .sb-wrap { position: relative; }
  .sb-wrap::after {
    content: attr(data-tip);
    position: fixed;
    left: 74px;
    background: rgba(6,10,8,0.97);
    border: 1px solid rgba(0,230,118,0.28);
    color: #e8f5e9;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 8px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.14s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.55);
    z-index: 9999;
    transform: translateY(-50%);
  }
  .sb-wrap:hover::after { opacity: 1; }

  .sb-link {
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 11px;
    text-decoration: none; position: relative; margin: 0 auto;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }
  .sb-link:hover:not([aria-current="page"]) {
    background: rgba(0,230,118,0.08) !important;
    color: #e8f5e9 !important;
  }
  .sb-link.admin:hover:not([aria-current="page"]) {
    background: rgba(206,147,216,0.1) !important;
    color: #ce93d8 !important;
  }
`

export default function Sidebar() {
  const navigate = useNavigate()
  const { user } = useUser()
  const isAdmin = user?.role === 'administrador'
  const { unreadCount: supportUnread } = useSupport()

  /* ── Badges reactivos ── */
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [pendingRecharges, setPendingRecharges] = useState(0)

  // Polling de notificaciones no leídas del servidor (solo las de hoy)
  useEffect(() => {
    async function loadUnread() {
      const token = localStorage.getItem('bazar_token')
      if (!token) return
      try {
        const res  = await fetch(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const today = new Date().toDateString()
        // Solo contar no-leídas de HOY que no sean login
        const unread = (data.notifications || []).filter(n => {
          const isToday = new Date(n.createdAt).toDateString() === today
          const isLogin = n.type === 'sistema' && n.title === 'Inicio de sesión'
          return isToday && !isLogin && !n.read
        }).length
        setUnreadNotifications(unread)
      // eslint-disable-next-line no-empty
      } catch {}
    }
    loadUnread()
    const interval = setInterval(loadUnread, 5000)
    return () => clearInterval(interval)
  }, [])

  // Polling de recargas pendientes para el admin
  useEffect(() => {
    if (!isAdmin) return
    async function loadPending() {
      const token = localStorage.getItem('bazar_token')
      if (!token) return
      try {
        const res  = await fetch(`${API_BASE}/api/recharges`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setPendingRecharges((data.requests || []).filter(r => r.status === 'pending').length)
      // eslint-disable-next-line no-empty
      } catch {}
    }
    loadPending()
    const interval = setInterval(loadPending, 5000)
    return () => clearInterval(interval)
  }, [isAdmin])

  const mainItems = mainNav
    .filter(item => !(isAdmin && item.to === '/dashboard/support'))
    .filter(item => !(isAdmin && item.userOnly))
    .map(item => {
      if (item.to === '/dashboard/notifications')
        return { ...item, badge: unreadNotifications }
      return item
    })

  const adminItems = adminNav.map(item => {
    if (item.to === '/dashboard/admin/support')  return { ...item, badge: supportUnread }
    if (item.to === '/dashboard/admin/recharge') return { ...item, badge: pendingRecharges }
    return item
  })

  return (
    <>
      <style>{CSS}</style>
      <aside
        className="sidebar-aside"
        style={{
          width: '64px', flexShrink: 0,
          background: 'rgba(10,15,13,0.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(0,230,118,0.1)',
          display: 'flex', flexDirection: 'column',
          height: '100vh', position: 'sticky', top: 0, zIndex: 50,
        }}>

        {/* ── LOGO ── */}
        <div
          className="sidebar-logo"
          style={{
            height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid rgba(0,230,118,0.08)', flexShrink: 0,
          }}>
          <BazarLogoIcon size={36} />
        </div>

        {/* ── NAV ── */}
        <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'hidden' }}>
          <Sep />
          {mainItems.map(item => <SBItem key={item.to} {...item} />)}
          {isAdmin && (
            <>
              <div style={{ margin: '6px 10px', height: '1px', background: 'rgba(206,147,216,0.15)' }} />
              <Sep admin />
              {adminItems.map(item => <SBItem key={item.to} {...item} admin />)}
            </>
          )}
        </nav>

        {/* ── FOOTER ── */}
        <div
          className="sidebar-footer"
          style={{ padding: '6px 0 8px', borderTop: '1px solid rgba(0,230,118,0.08)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <SBItem to="/dashboard/settings" icon={MdSettings} label="Configuración" />
          <LogoutBtn onLogout={() => {
            localStorage.removeItem('bazar_token')
            localStorage.removeItem('bazar_user')
            navigate('/auth')
          }} />
        </div>
      </aside>
    </>
  )
}

/* ════════════════════════════
   LOGO — B mitad verde / mitad negro difuminada
════════════════════════════ */
function BazarLogoIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradiente vertical: verde arriba → negro abajo */}
        <linearGradient id="bFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00e676" stopOpacity="1" />
          <stop offset="50%"  stopColor="#00c853" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#000000" stopOpacity="1" />
        </linearGradient>

        {/* Difuminación suave */}
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" in="SourceGraphic" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* B — fuente system-ui renderizada como texto SVG, gradiente verde→negro */}
      <text
        x="50" y="82"
        textAnchor="middle"
        fontSize="95"
        fontWeight="900"
        fontFamily="'Arial Black', 'Impact', system-ui, sans-serif"
        fill="url(#bFade)"
        filter="url(#soft)"
        letterSpacing="-4"
      >
        B
      </text>
    </svg>
  )
}

/* ── Separador de sección ── */
function Sep({ admin }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3px 0 4px' }}>
      <div style={{ width: '18px', height: '2px', borderRadius: '999px', background: admin ? 'rgba(206,147,216,0.25)' : 'rgba(0,230,118,0.18)' }} />
    </div>
  )
}

/* ── Item de navegación ── */
function SBItem({ to, icon: Icon, label, admin, badge, msgBadge }) {
  const tipLabel = badge > 0
    ? `${label}  ·  ${badge} sin leer${msgBadge > 0 ? `  💬 ${msgBadge}` : ''}`
    : label

  return (
    <div className="sb-wrap" data-tip={tipLabel} style={{ padding: '0 9px' }}>
      <NavLink
        to={to}
        end={to === '/dashboard'}
        className={`sb-link${admin ? ' admin' : ''}`}
        style={({ isActive }) => ({
          color:      isActive ? (admin ? '#ce93d8' : '#00e676') : 'rgba(232,245,233,0.45)',
          background: isActive ? (admin ? 'rgba(206,147,216,0.14)' : 'rgba(0,230,118,0.11)') : 'transparent',
          border:     isActive
            ? `1px solid ${admin ? 'rgba(206,147,216,0.28)' : 'rgba(0,230,118,0.24)'}`
            : '1px solid transparent',
        })}
      >
        <Icon size={20} />
        {badge > 0 && (
          <span style={{
            position: 'absolute', top: '5px', right: '5px',
            background: '#ef5350', color: '#fff',
            width: '14px', height: '14px', borderRadius: '50%',
            fontSize: '8px', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {badge}
          </span>
        )}
      </NavLink>
    </div>
  )
}

/* ── Botón logout ── */
function LogoutBtn({ onLogout }) {
  return (
    <div className="sb-wrap" data-tip="Cerrar sesión" style={{ padding: '0 9px' }}>
      <button
        onClick={onLogout}
        className="sb-link"
        style={{
          background: 'transparent', border: '1px solid transparent',
          color: '#ef5350', cursor: 'pointer',
          width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '11px', margin: '0 auto', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,83,80,0.12)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <MdLogout size={20} />
      </button>
    </div>
  )
}
