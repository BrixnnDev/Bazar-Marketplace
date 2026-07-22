import API_BASE from '../config/api'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LandingPage          from '../modules/landing/pages/LandingPage'
import AuthPage             from '../modules/auth/pages/AuthPage'
import CompleteProfilePage  from '../modules/profile/pages/CompleteProfilePage'
import HomePage             from '../modules/dashboard/pages/HomePage'
import WithdrawalsPage      from '../modules/withdrawals/pages/WithdrawalsPage'
import MarketplacePage      from '../modules/marketplace/pages/MarketplacePage'
import SellPage             from '../modules/sell/pages/SellPage'
import NotificationsPage    from '../modules/notifications/pages/NotificationsPage'
import SupportPage          from '../modules/support/pages/SupportPage'
import AdminUsersPage       from '../modules/admin/pages/AdminUsersPage'
import AdminInventoryPage   from '../modules/admin/pages/AdminInventoryPage'
import AdminSupportPage     from '../modules/admin/pages/AdminSupportPage'
import AdminRechargePage    from '../modules/admin/pages/AdminRechargePage'
import RechargePage         from '../modules/recharge/pages/RechargePage'
import SettingsPage         from '../modules/settings/pages/SettingsPage'
import DashboardLayout      from '../components/layout/DashboardLayout'
import NotFoundPage         from '../modules/errors/NotFoundPage'
import MaintenancePage      from '../modules/errors/MaintenancePage'
import { useUser }          from '../context/UserContext'

/* ── Helpers ── */
function getToken() { return localStorage.getItem('bazar_token') }
function getUser()  {
  const u = localStorage.getItem('bazar_user')
  return u ? JSON.parse(u) : null
}

/* ── Verificador de sesión al recargar ──
   Al montar, llama /api/auth/me para refrescar los datos del usuario
   y decide a dónde redirigir según el estado del perfil. */
function SessionVerifier() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { setUser } = useUser()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = getToken()

    // Guardar ruta actual en sessionStorage
    if (location.pathname && location.pathname !== '/') {
      sessionStorage.setItem('bazar_last_path', location.pathname)
    }

    // Si no hay token, no hacer nada (las rutas manejan la redirección)
    if (!token) { setChecked(true); return } // eslint-disable-line react-hooks/set-state-in-effect

    // Si está en la página de auth, no hacer nada
    if (location.pathname === '/auth' || location.pathname === '/') {
      setChecked(true); return
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          // Normalizar el usuario
          const raw = data.user
          const fullNameParts = (raw.full_name || '').trim().split(/\s+/).filter(Boolean)
          const normalizedUser = {
            ...raw,
            name:     fullNameParts[0]             || raw.username || 'Usuario',
            lastName: fullNameParts.slice(1).join(' ') || '',
          }

          localStorage.setItem('bazar_user', JSON.stringify(normalizedUser))
          setUser(normalizedUser)

          // Redirigir según estado del perfil
          const isAdmin = normalizedUser.role === 'administrador'
          const hasProfile = normalizedUser.profile_completed

          // Si está en /complete-profile pero ya tiene perfil → dashboard
          if (location.pathname === '/complete-profile' && (isAdmin || hasProfile)) {
            navigate('/dashboard', { replace: true })
            return
          }

          // Si está en cualquier ruta del dashboard pero NO tiene perfil → complete-profile
          if (location.pathname.startsWith('/dashboard') && !isAdmin && !hasProfile) {
            navigate('/complete-profile', { replace: true })
            return
          }
        } else {
          // Token inválido → limpiar y redirigir a auth
          localStorage.removeItem('bazar_token')
          localStorage.removeItem('bazar_user')
          if (!['/', '/auth'].includes(location.pathname)) {
            navigate('/auth', { replace: true })
          }
        }
      })
      .catch(() => {
        // Si el servidor no responde, usar datos en caché de localStorage
        const cached = getUser()
        if (cached) setUser(cached)
      })
      .finally(() => setChecked(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!checked && getToken() && !['/', '/auth'].includes(location.pathname)) {
    // Pantalla de carga mientras verifica sesión
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid rgba(0,230,118,0.15)',
          borderTop: '3px solid #00e676',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: 'rgba(165,214,167,0.5)', fontSize: '13px' }}>Verificando sesión...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return null
}

/* ── Redirige a /auth si no está logueado ── */
function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/auth" replace />
}

/* ── Si está logueado pero sin perfil → /complete-profile ── */
function ProfileGuard({ children }) {
  if (!getToken()) return <Navigate to="/auth" replace />
  const user = getUser()
  if (user && !user.profile_completed && user.role !== 'administrador') {
    return <Navigate to="/complete-profile" replace />
  }
  return children
}

function SupportRoute() {
  if (!getToken()) return <Navigate to="/auth" replace />
  const user = getUser()
  if (user?.role === 'administrador') return <Navigate to="/dashboard/admin/support" replace />
  if (user && !user.profile_completed) return <Navigate to="/complete-profile" replace />
  return <SupportPage />
}

function AdminRoute({ children }) {
  const user = getUser()
  if (!getToken()) return <Navigate to="/auth" replace />
  if (user?.role !== 'administrador') return <Navigate to="/dashboard" replace />
  return children
}

/* Recargas: admin → admin/recharge, usuario → RechargePage */
function RechargeRoute() {
  const user = getUser()
  if (user?.role === 'administrador') return <Navigate to="/dashboard/admin/recharge" replace />
  return <RechargePage />
}

/* ── Servidor desconectado — overlay global ── */
function ServerReconnecting() {
  return (
    <div style={{
      minHeight:'100vh', background:'#0a0f0d',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:'20px', padding:'24px', textAlign:'center',
    }}>
      <style>{`
        @keyframes pulse-conn { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.07)} }
        @keyframes dash-move { from{stroke-dashoffset:24} to{stroke-dashoffset:0} }
      `}</style>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginBottom:'12px' }}>
        <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(255,167,38,0.1)', border:'1px solid rgba(255,167,38,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', animation:'pulse-conn 1.6s ease-in-out infinite' }}>
          📶
        </div>
        <svg width="44" height="16" style={{ flexShrink:0, marginBottom:'16px' }}>
          <line x1="0" y1="8" x2="44" y2="8" stroke="rgba(255,167,38,0.45)" strokeWidth="2" strokeDasharray="5 3" style={{ animation:'dash-move 0.9s linear infinite' }} />
        </svg>
        <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'rgba(239,83,80,0.12)', border:'1px solid rgba(239,83,80,0.45)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', animation:'pulse-conn 1.6s ease-in-out infinite', animationDelay:'0.4s' }}>
          🗄️
        </div>
      </div>

      <div>
        <p style={{ fontSize:'20px', fontWeight:800, color:'#ffa726', margin:'0 0 6px' }}>Intentando conectar a la base de datos...</p>
        <p style={{ fontSize:'13px', color:'rgba(165,214,167,0.45)', margin:0, lineHeight:1.7 }}>
          El servidor está iniciando o en mantenimiento.<br/>La página se reconectará automáticamente.
        </p>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'12px' }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#ffa726', animation:'pulse-conn 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize:'11px', color:'rgba(165,214,167,0.4)', fontWeight:600 }}>Reintentando cada 8 segundos...</span>
      </div>
    </div>
  )
}

export default function AppRouter() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceChecked, setMaintenanceChecked] = useState(false)
  const [serverDown, setServerDown] = useState(false)

  const cachedUser = getUser()
  const isAdmin = cachedUser?.role === 'administrador'

  // Check maintenance mode + server health on mount + every 8 seconds
  useEffect(() => {
    let mounted = true
    function check() {
      // Check maintenance mode
      fetch(`${API_BASE}/api/maintenance/public`)
        .then(r => r.json())
        .then(data => {
          if (!mounted) return
          setMaintenanceEnabled(!!data.enabled)
          setMaintenanceChecked(true)
          setServerDown(false)
        })
        .catch(() => {
          if (!mounted) return
          setMaintenanceEnabled(false)
          setMaintenanceChecked(true)
          setServerDown(true)
        })
    }
    check()
    const interval = setInterval(check, 8000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Si el servidor está caído — mostrar banner de reconexión
  if (serverDown) {
    return <ServerReconnecting />
  }

  // Si está en mantenimiento y NO es admin → bloquear la app
  if (maintenanceChecked && maintenanceEnabled && !isAdmin) {
    return <MaintenancePage />
  }



  return (

    <>
      <SessionVerifier />
      <Routes>
        {/* ── Públicas ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* ── Mantenimiento público (solo usuarios no-admin) ── */}
        <Route
          path="/maintenance"
          element={<MaintenancePage />}
        />

        {/* ── Completar perfil ── */}
        <Route path="/complete-profile"
          element={<PrivateRoute><CompleteProfilePage /></PrivateRoute>}
        />

        {/* ── Dashboard ── */}
        <Route path="/dashboard"
          element={<ProfileGuard><DashboardLayout /></ProfileGuard>}
        >
          <Route index                  element={<HomePage />} />
          <Route path="marketplace"     element={<MarketplacePage />} />
          <Route path="sell"            element={<SellPage />} />
          <Route path="withdrawals"     element={<WithdrawalsPage />} />
          <Route path="notifications"   element={<NotificationsPage />} />
          <Route path="support"         element={<SupportRoute />} />
          <Route path="recharge"        element={<RechargeRoute />} />
          <Route path="settings"        element={<SettingsPage />} />
          <Route path="admin/inventory" element={<AdminRoute><AdminInventoryPage /></AdminRoute>} />
          <Route path="admin/users"     element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="admin/recharge"  element={<AdminRoute><AdminRechargePage /></AdminRoute>} />
          <Route path="admin/support"   element={<AdminRoute><AdminSupportPage /></AdminRoute>} />
        </Route>

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
