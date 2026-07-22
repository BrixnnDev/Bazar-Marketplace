export function buildSystemNotification({ title, body, details = '' }) {
  return {
    id: `notif-${Date.now()}`,
    type: 'sistema',
    title,
    body,
    details,
    time: 'Ahora',
    read: false,
  }
}

export async function addNotification({ title, body, details = '', type = 'sistema', role = 'user' }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bazar_token') : null
  if (!token) return null

  try {
    const res = await fetch('http://localhost:3001/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, body, details, type, role }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(role === 'admin' ? 'bazar_admin_notif_updated' : 'bazar_notifications_updated'))
    }
    return data.notification
  } catch {
    return null
  }
}
