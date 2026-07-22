/**
 * Contexto global de actividad reciente.
 * Dashboard lo lee — Retiros, Marketplace, etc. lo escriben.
 */
import { createContext, useContext, useState } from 'react'

const ActivityContext = createContext(null)

const TYPE_CFG = {
  venta:   { label: 'Venta',   color: '#00e676', sign: '+' },
  compra:  { label: 'Compra',  color: '#ef5350', sign: '-' },
  recarga: { label: 'Recarga', color: '#69f0ae', sign: '+' },
  retiro:  { label: 'Retiro',  color: '#ffa726', sign: '-' },
}

const INITIAL = []

export { TYPE_CFG }

export function ActivityProvider({ children }) {
  const [activity, setActivity] = useState(INITIAL)

  function pushActivity(entry) {
    const now = new Date()
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
    setActivity(prev => [{ id: `a-${Date.now()}`, ...entry, time: `Hoy ${timeStr}` }, ...prev])
  }

  return (
    <ActivityContext.Provider value={{ activity, pushActivity }}>
      {children}
    </ActivityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActivity() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error('useActivity must be used inside ActivityProvider')
  return ctx
}
