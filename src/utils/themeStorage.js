const THEME_KEY  = 'bazar_theme_mode'
const ACCENT_KEY = 'bazar_theme_accent'

function normalizeHex(hex) {
  if (!hex) return '#00e676'
  const c = hex.toString().trim().replace('#', '')
  return '#' + (c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c.slice(0, 6))
}
function hexToRgb(hex) {
  const n = normalizeHex(hex).slice(1)
  const i = parseInt(n, 16)
  return `${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255}`
}
function darkenHex(hex, amount = 0.15) {
  const n = normalizeHex(hex).slice(1)
  const i = parseInt(n, 16)
  const f = v => Math.max(0, Math.min(255, Math.floor(v * (1 - amount))))
  const r = f((i >> 16) & 255), g = f((i >> 8) & 255), b = f(i & 255)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

export function getStoredMode() {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function saveMode(mode) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_KEY, mode)
    // Evento para que DashboardLayout reactive el tema
    window.dispatchEvent(new CustomEvent('bazar_theme_changed'))
  }
}

/* applyMode ya NO toca el :root — el layout lo aplica por atributo data-theme */
export function applyMode() { /* no-op — controlado por DashboardLayout */ }

export function getStoredAccent() {
  if (typeof window === 'undefined') return '#00e676'
  return normalizeHex(localStorage.getItem(ACCENT_KEY) || '#00e676')
}

export function saveAccent(accent) {
  const a = normalizeHex(accent)
  if (typeof window !== 'undefined') localStorage.setItem(ACCENT_KEY, a)
  applyAccentColor(a)
  return a
}

export function applyAccentColor(accent) {
  if (typeof document === 'undefined') return
  const a = normalizeHex(accent)
  const s = darkenHex(a, 0.18)
  const rgb = hexToRgb(a)
  // Solo actualiza las variables de acento (aplica a todo, incluye botones en landing/auth)
  document.documentElement.style.setProperty('--accent-primary',   a)
  document.documentElement.style.setProperty('--accent-secondary',  s)
  document.documentElement.style.setProperty('--accent-rgb',        rgb)
  document.documentElement.style.setProperty('--accent-glow',      `rgba(${rgb}, 0.15)`)
  document.documentElement.style.setProperty('--accent-border',    `rgba(${rgb}, 0.25)`)
  document.documentElement.style.setProperty('--accent-bg',        `rgba(${rgb}, 0.12)`)
  document.documentElement.style.setProperty('--green-primary',    a)
  document.documentElement.style.setProperty('--green-secondary',   s)
  document.documentElement.style.setProperty('--green-border',     `rgba(${rgb}, 0.25)`)
}
