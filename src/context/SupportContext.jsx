/* eslint-disable react-refresh/only-export-components */
/**
 * Contexto global de soporte.
 * Soporte badges read from API — no localStorage.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SupportContext = createContext(null)

const API = 'http://localhost:3001'

export function SupportProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bazar_token') : null
    if (!token) return
    try {
      const res = await fetch(`${API}/api/support/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.count || 0)
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchUnread, 0)
    const iv = setInterval(fetchUnread, 5000)
    return () => { clearTimeout(t); clearInterval(iv) }
  }, [fetchUnread])

  return (
    <SupportContext.Provider value={{ unreadCount, refreshUnread: fetchUnread }}>
      {children}
    </SupportContext.Provider>
  )
}

export function useSupport() {
  const ctx = useContext(SupportContext)
  if (!ctx) throw new Error('useSupport must be used inside SupportProvider')
  return ctx
}
