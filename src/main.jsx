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
