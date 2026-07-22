import API_BASE from '../config/api'
/**
 * Contexto del usuario actual.
 * Settings lo actualiza — Dashboard y ProfileModal lo leen.
 * Polling cada 5 segundos para sincronizar el saldo desde el servidor.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const UserContext = createContext(null)

function getInitialUser() {
  try {
    const stored = localStorage.getItem('bazar_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('bazar_token') : null
}

function persistUser(user) {
  if (typeof window === 'undefined') return user
  if (user) {
    localStorage.setItem('bazar_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('bazar_user')
  }
  window.dispatchEvent(new CustomEvent('bazar_user_updated'))
  return user
}

export const ROLE_CFG = { // eslint-disable-line react-refresh/only-export-components
  administrador: { label: 'Administrador', color: '#ce93d8', bg: 'rgba(206,147,216,0.12)', emoji: '👑' },
  vendedor:      { label: 'Vendedor',      color: '#64b5f6', bg: 'rgba(100,181,246,0.12)', emoji: '💼' },
  comprador:     { label: 'Comprador',     color: '#ffa726', bg: 'rgba(255,167,38,0.12)',  emoji: '🛒' },
  usuario:       { label: 'Usuario',       color: '#69f0ae', bg: 'rgba(105,240,174,0.12)', emoji: '👤' },
}

/* Avatares disponibles para elegir */
export const AVATAR_OPTIONS = [ // eslint-disable-line react-refresh/only-export-components
  '','👨','👩','🧑','👨‍💻','👩‍💻','🧑‍💼','👨‍💼','👩‍💼',
  '🦸','🦹','🧙','🎩','😎','🤖','🐱','🦊','🐺','🎭',
]

export function UserProvider({ children }) {
  const [user, setUserState] = useState(getInitialUser())
  const pollingRef = useRef(null)

  // Inicial: NO dependemos del snapshot antiguo de localStorage para city/estado.
  // El valor se refresca desde /api/auth/me (polling), para que sea “real” y en tiempo real.
  useEffect(() => {
    function syncUser() {
      const fresh = getInitialUser()
      setUserState(fresh)
    }

    window.addEventListener('bazar_user_updated', syncUser)
    return () => window.removeEventListener('bazar_user_updated', syncUser)
  }, [])

  // Polling al servidor: sincroniza el saldo/créditos en tiempo real
  useEffect(() => {
    function startPolling() {
      stopPolling()
      pollingRef.current = setInterval(async () => {
        const token = getToken()
        if (!token) return
        try {
          const res  = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return
          const data = await res.json()
          if (!data.user) return

          const raw = data.user
          const fullNameParts = (raw.full_name || '').trim().split(/\s+/).filter(Boolean)
          const fresh = {
            ...raw,
            name:     fullNameParts[0]                 || raw.username || 'Usuario',
            lastName: fullNameParts.slice(1).join(' ') || '',
          }

          // Solo actualizar si algo relevante cambió para evitar re-renders innecesarios
          setUserState(prev => {
            if (!prev) return prev
            if (
              Number(prev.balance) === Number(fresh.balance) &&
              Number(prev.credits) === Number(fresh.credits) &&
              prev.city === fresh.city &&
              prev.phone === fresh.phone &&
              prev.full_name === fresh.full_name &&
              prev.avatar === fresh.avatar
            ) return prev
            // Mantener el usuario completo que viene del servidor (incluye city)
            const next = {
              ...prev,
              ...fresh,
            }
            persistUser(next)
            return next
          })
        } catch { /* servidor no disponible, ignorar */ }
      }, 5000)
    }

    function stopPolling() {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    // Iniciar polling si hay token
    if (getToken()) startPolling()

    // Reiniciar polling cuando cambia la sesión (login/logout)
    function handleUserUpdate() {
      if (getToken()) {
        startPolling()
      } else {
        stopPolling()
      }
    }

    window.addEventListener('bazar_user_updated', handleUserUpdate)
    return () => {
      stopPolling()
      window.removeEventListener('bazar_user_updated', handleUserUpdate)
    }
  }, [])

  function setUser(valueOrFn) {
    setUserState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn
      return persistUser(next)
    })
  }

  function updateUser(fields) {
    setUser(prev => (prev ? { ...prev, ...fields } : prev))
  }

  function updateAvatar(avatar) {
    setUser(prev => (prev ? { ...prev, avatar } : prev))
  }

  return (
    <UserContext.Provider value={{ user, setUser, updateUser, updateAvatar }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() { // eslint-disable-line react-refresh/only-export-components
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
