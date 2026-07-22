import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { PaymentMethodsProvider } from './context/PaymentMethodsContext'
import { ActivityProvider }       from './context/ActivityContext'
import { SupportProvider }        from './context/SupportContext'
import { UserProvider }           from './context/UserContext'
import './index.css'
import App from './App.jsx'
import { applyAccentColor, getStoredAccent } from './utils/themeStorage'

applyAccentColor(getStoredAccent())

/* ── Ruta inicial desde sessionStorage (sobrevive refresh) ── */
const savedPath = sessionStorage.getItem('bazar_last_path') || '/'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter initialEntries={[savedPath]}>
      <UserProvider>
        <PaymentMethodsProvider>
          <ActivityProvider>
              <SupportProvider>
                <App />
              </SupportProvider>
          </ActivityProvider>
        </PaymentMethodsProvider>
      </UserProvider>
    </MemoryRouter>
  </StrictMode>,
)
