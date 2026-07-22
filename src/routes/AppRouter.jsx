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

/* ── Modo mantenimiento (persistente en backend) ── */


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

    // Si no hay token, no hacer nada (las rutas manejan la redirección)
    if (!token) { setChecked(true); return } // eslint-disable-line react-hooks/set-state-in-effect

    // Si está en la página de auth, no hacer nada
    if (location.pathname === '/auth' || location.pathname === '/') {
      setChecked(true); return
    }

    fetch('http://localhost:3001/api/auth/me', {
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

export default function AppRouter() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [maintenanceChecked, setMaintenanceChecked] = useState(false)

  const cachedUser = getUser()
  const isAdmin = cachedUser?.role === 'administrador'

  // Si el usuario está en mantenimiento y no es admin, también bloquear /auth y /
  // (para que no se quede viendo pantallas antiguas sin recargar)
  useEffect(() => {
    let mounted = true
    fetch('http://localhost:3001/api/maintenance/public')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        setMaintenanceEnabled(!!data.enabled)
        setMaintenanceChecked(true)
      })
      .catch(() => {
        if (!mounted) return
        setMaintenanceEnabled(false)
        setMaintenanceChecked(true)
      })
    return () => { mounted = false }
  }, [])

  // Si está en mantenimiento y NO es admin → bloquear la app (incluye /auth) hasta que se apague
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
