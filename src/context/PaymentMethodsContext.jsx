/**
 * Contexto compartido de métodos de pago.
 * Configuración los gestiona → Retiros los consume.
 */
import { createContext, useContext, useState } from 'react'

const PaymentMethodsContext = createContext(null)

/* ── Catálogo de bancos/billeteras disponibles ── */
export const BANK_CATALOG = [ // eslint-disable-line react-refresh/only-export-components
  { id: 'nequi',       label: 'Nequi',        emoji: '🟣', color: '#ce93d8', type: 'billetera',  placeholder: 'Número celular Nequi',          accountLabel: 'Celular Nequi'    },
  { id: 'bancolombia', label: 'Bancolombia',   emoji: '🟡', color: '#ffd54f', type: 'banco',      placeholder: 'Número de cuenta Bancolombia',  accountLabel: 'No. de cuenta'    },
  { id: 'daviplata',   label: 'Daviplata',     emoji: '🔴', color: '#ef9a9a', type: 'billetera',  placeholder: 'Número celular Daviplata',       accountLabel: 'Celular Daviplata'},
  { id: 'paypal',      label: 'PayPal',        emoji: '🔵', color: '#64b5f6', type: 'billetera',  placeholder: 'Correo de tu cuenta PayPal',     accountLabel: 'Correo PayPal'    },
  { id: 'bbancolombia',label: 'Banco Bogotá',  emoji: '🟢', color: '#81c784', type: 'banco',      placeholder: 'Número de cuenta Banco de Bogotá',accountLabel: 'No. de cuenta'  },
  { id: 'davivienda',  label: 'Davivienda',    emoji: '🔶', color: '#ffb74d', type: 'banco',      placeholder: 'Número de cuenta Davivienda',   accountLabel: 'No. de cuenta'    },
]

/* ── Estado inicial — sin cuentas conectadas ── */
const INITIAL_METHODS = []

export function PaymentMethodsProvider({ children }) {
  const [methods, setMethods] = useState(INITIAL_METHODS)

  function addMethod(data) {
    setMethods((prev) => [...prev, { id: `acc-${Date.now()}`, ...data, connected: true }])
  }

  function removeMethod(id) {
    setMethods((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <PaymentMethodsContext.Provider value={{ methods, addMethod, removeMethod }}>
      {children}
    </PaymentMethodsContext.Provider>
  )
}

export function usePaymentMethods() { // eslint-disable-line react-refresh/only-export-components
  const ctx = useContext(PaymentMethodsContext)
  if (!ctx) throw new Error('usePaymentMethods must be used inside PaymentMethodsProvider')
  return ctx
}
