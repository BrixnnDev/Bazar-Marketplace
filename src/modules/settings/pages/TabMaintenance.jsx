import { useEffect, useState } from 'react'
import { MdToggleOn, MdToggleOff } from 'react-icons/md'

export default function TabMaintenance() {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    fetch('http://localhost:3001/api/maintenance/public')
      .then(r => r.json())
      .then(d => {
        if (!mounted) return
        setEnabled(!!d.enabled)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setEnabled(false)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  async function handleToggle() {
    const token = localStorage.getItem('bazar_token')
    setSaving(true)
    setError('')
    try {
      const nextEnabled = !enabled
      const res = await fetch('http://localhost:3001/api/admin/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: nextEnabled }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar')

      setEnabled(nextEnabled)
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="glass-card" style={{ padding: '18px 20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          🚨 Modo mantenimiento (global)
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
          Cuando está activo, los usuarios verán la página de mantenimiento. El administrador puede seguir usando el panel.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Estado</p>
            <p style={{ fontSize: '16px', fontWeight: 900, color: enabled ? '#ef5350' : '#00e676' }}>
              {loading ? '...' : enabled ? 'EN MANTENIMIENTO' : 'NORMAL'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            style={{
              minWidth: '130px',
              padding: '10px 14px',
              borderRadius: '12px',
              cursor: saving ? 'not-allowed' : 'pointer',
              border: `1px solid ${enabled ? 'rgba(239,83,80,0.35)' : 'rgba(0,230,118,0.25)'}`,
              background: enabled ? 'rgba(239,83,80,0.12)' : 'rgba(0,230,118,0.10)',
              color: enabled ? '#ef5350' : 'var(--green-primary)',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {enabled ? <MdToggleOff size={18} /> : <MdToggleOn size={18} />}
            {saving ? 'Actualizando...' : enabled ? 'Desactivar' : 'Activar'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.25)', color: '#ef5350', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

