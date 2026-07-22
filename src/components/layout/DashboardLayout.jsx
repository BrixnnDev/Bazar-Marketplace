import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef }   from 'react'
import Sidebar from './Sidebar'
import { getStoredMode } from '../../utils/themeStorage'

const STATIC_ROUTES = [
  '/dashboard',
  '/dashboard/withdrawals',
  '/dashboard/notifications',
  '/dashboard/support',
  '/dashboard/admin/support',
  '/dashboard/admin/users',
]

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const isStatic     = STATIC_ROUTES.includes(pathname)
  const wrapRef      = useRef(null)

  /* Aplica el tema SOLO al wrapper del dashboard, no al body/html */
  useEffect(() => {
    function applyTheme() {
      if (!wrapRef.current) return
      const mode = getStoredMode()
      wrapRef.current.setAttribute('data-theme', mode)
    }
    applyTheme()
    /* Escucha cambios de tema guardados desde Settings */
    window.addEventListener('bazar_theme_changed', applyTheme)
    return () => window.removeEventListener('bazar_theme_changed', applyTheme)
  }, [])

  return (
    <div
      ref={wrapRef}
      className="dashboard-layout"
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--dash-bg)',
      }}
    >
      <Sidebar />
      <main
        className="dashboard-main"
        style={{
          flex: 1,
          padding: '16px 18px',
          background: 'var(--dash-bg)',
          overflowY: isStatic ? 'hidden' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Outlet />
      </main>
    </div>
  )
}
