import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PaymentMethodsProvider } from './context/PaymentMethodsContext'
import { ActivityProvider }       from './context/ActivityContext'
import { SupportProvider }        from './context/SupportContext'
import { UserProvider }           from './context/UserContext'
import './index.css'
import App from './App.jsx'
import { applyAccentColor, getStoredAccent } from './utils/themeStorage'

applyAccentColor(getStoredAccent())

/* ── Interceptar history para que la URL NUNCA muestre rutas ── */
;(function hideAllRoutes() {
  const origPush    = window.history.pushState.bind(window.history)
  const origReplace = window.history.replaceState.bind(window.history)

  window.history.pushState = function (state, title, url) {
    if (url && url !== '/') sessionStorage.setItem('bazar_last_path', url)
    return origPush(state, title, '/')
  }
  window.history.replaceState = function (state, title, url) {
    if (url && url !== '/') sessionStorage.setItem('bazar_last_path', url)
    return origReplace(state, title, '/')
  }
  window.addEventListener('popstate', () => {
    window.history.replaceState(null, '', '/')
  })
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <PaymentMethodsProvider>
          <ActivityProvider>
              <SupportProvider>
                <App />
              </SupportProvider>
          </ActivityProvider>
        </PaymentMethodsProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
)
