import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../../context/UserContext'
import {
  MdSell, MdSearch, MdStorefront, MdClose,
  MdDescription, MdAttachMoney, MdUndo,
} from 'react-icons/md'

import API from '../../../config/api'
function getToken() { return localStorage.getItem('bazar_token') }

const CATS = [
  { id: 'electrodomestico', label: 'Electrodoméstico', emoji: '🔌', color: '#64b5f6' },
  { id: 'electronica',      label: 'Electrónica',      emoji: '📱', color: '#00e676' },
  { id: 'gaming',           label: 'Gaming',           emoji: '🎮', color: '#ce93d8' },
  { id: 'ropa',             label: 'Ropa',             emoji: '👕', color: '#ffa726' },
  { id: 'deportes',         label: 'Deportes',         emoji: '⚽', color: '#ef5350' },
  { id: 'hogar',            label: 'Hogar',            emoji: '🏠', color: '#80cbc4' },
  { id: 'vehiculos',        label: 'Vehículos',        emoji: '🚗', color: '#ffcc02' },
  { id: 'libros',           label: 'Libros',           emoji: '📚', color: '#a5d6a7' },
  { id: 'fotografia',       label: 'Fotografía',       emoji: '📷', color: '#f48fb1' },
  { id: 'otro',             label: 'Otro',             emoji: '📦', color: '#90a4ae' },
]

const STS = {
  disponible: { label: 'Disponible', color: '#00e676', bg: 'rgba(0,230,118,0.1)'  },
  en_venta:   { label: 'En venta',   color: '#ffa726', bg: 'rgba(255,167,38,0.1)' },
  vendido:    { label: 'Vendido',    color: '#90a4ae', bg: 'rgba(144,164,174,0.1)'},
}

const fl = { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '5px' }

export default function SellPage() {
  const navigate = useNavigate()
  const { updateUser } = useUser()
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('todos')
  const [modal,     setModal]     = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [returnId,  setReturnId]  = useState(null)
  const [returning, setReturning] = useState(false)

  useEffect(() => { loadPurchases() }, [])

  async function loadPurchases() {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/purchases/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) { const d = await res.json(); setPurchases(d.purchases || []) }
    // eslint-disable-next-line no-empty
    } catch {}
    setLoading(false)
  }

  async function handleReturn(id) {
    setReturning(true)
    try {
      const token = getToken()
      const res   = await fetch(`${API}/api/purchases/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'No se pudo devolver.'); setReturning(false); setReturnId(null); return }
      updateUser({ balance: data.newBalance })
      await loadPurchases()
    } catch { alert('Error de conexión.') }
    setReturning(false)
    setReturnId(null)
  }

  const filtered = purchases.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === 'todos' || p.status === filter)
  )

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Mis compras · Vender</h1>
          <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Selecciona un objeto para revenderlo o devolver</p>
        </div>
        <span style={{ padding: '6px 10px', borderRadius: '10px', background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(0,230,118,0.06)', fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)' }}>
          {purchases.length} compras
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <MdSearch size={17} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)' }} />
          <input className="input-dark" style={{ width: '100%', padding: '9px 11px 9px 34px', fontSize: '13px' }}
            placeholder="Buscar entre tus compras..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['todos', 'disponible', 'en_venta', 'vendido'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '8px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', background: filter === s ? 'rgba(0,230,118,0.12)' : 'rgba(0,0,0,0.28)', color: filter === s ? 'var(--green-primary)' : 'var(--text-secondary)', border: `1px solid ${filter === s ? 'rgba(0,230,118,0.3)' : 'var(--border-glass)'}`, transition: 'all 0.15s' }}>
              {s === 'todos' ? 'Todos' : STS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>Cargando...</div>
        ) : purchases.length === 0 ? (
          <Empty navigate={navigate} />
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>Sin resultados.</p>
            <button className="btn-ghost" onClick={() => { setSearch(''); setFilter('todos') }} style={{ padding: '8px 20px', fontSize: '13px' }}>Limpiar</button>
          </div>
        ) : filtered.map(item => (
          <PItem key={item.id} item={item}
            onSell={() => item.status === 'disponible' && setModal(item)}
            onReturn={() => item.status === 'disponible' && setReturnId(item.id)}
          />
        ))}
      </div>

      {modal && <SellModal item={modal} onClose={() => { setModal(null); loadPurchases() }} />}

      {returnId && (
        <div onClick={() => !returning && setReturnId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="glass-card fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔄</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>¿Devolver producto?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
              Se te reembolsará el precio pagado y el producto volverá al marketplace.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={() => setReturnId(null)} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>Cancelar</button>
              <button onClick={() => handleReturn(returnId)} disabled={returning}
                style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', borderRadius: '10px', background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: 'var(--green-primary)', opacity: returning ? 0.7 : 1 }}>
                {returning ? 'Procesando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PItem({ item, onSell, onReturn }) {
  const cat    = CATS.find(c => c.id === item.category) || CATS[CATS.length - 1]
  const status = STS[item.status] || STS.disponible
  const can    = item.status === 'disponible'
  return (
    <div className="glass-card"
      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s', flexShrink: 0 }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.28)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.12)')}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0, background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
        {item.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: 600, background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}28` }}>
            {cat.emoji} {cat.label}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)' }}>Pagué ${Number(item.boughtFor || item.price).toLocaleString()}</span>
        </div>
      </div>
      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: status.bg, color: status.color, flexShrink: 0 }}>
        {status.label}
      </span>
      {can && (
        <button onClick={onReturn}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 11px', borderRadius: '8px', border: '1px solid rgba(239,83,80,0.3)', background: 'rgba(239,83,80,0.08)', color: '#ef5350', cursor: 'pointer', fontSize: '11px', fontWeight: 600, flexShrink: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,83,80,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,83,80,0.08)'}>
          <MdUndo size={13} /> Devolver
        </button>
      )}
      <button onClick={onSell} disabled={!can} className={can ? 'btn-primary' : ''}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12px', borderRadius: '8px', flexShrink: 0, fontWeight: 600, ...(can ? {} : { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(165,214,167,0.2)', cursor: 'not-allowed' }) }}>
        <MdSell size={14} />
        {item.status === 'vendido' ? 'Vendido' : item.status === 'en_venta' ? 'En venta' : 'Vender'}
      </button>
    </div>
  )
}

function SellModal({ item, onClose }) {
  const cat = CATS.find(c => c.id === item.category) || CATS[CATS.length - 1]
  const { user } = useUser()
  const [price,  setPrice]  = useState('')
  const [desc,   setDesc]   = useState('')
  const [done,   setDone]   = useState(false)
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const n = Number(price)
    if (!price || isNaN(n) || n <= 0) { setError('Ingresa un precio válido.'); return }
    setError(''); setSaving(true)
    try {
      const token = getToken()
      const r = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: item.name, category: item.category, categoryLabel: item.categoryLabel, price: n, stock: 1, visible: true, emoji: item.emoji, desc: desc || `${item.name} - buen estado`, seller: user?.username || 'Usuario', sellerId: user?.code }),
      })
      if (!r.ok) { const d = await r.json(); setError(d.error || 'Error.'); setSaving(false); return }
      await fetch(`${API}/api/purchases/${item.id}/sell`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ salePrice: n }),
      })
      setDone(true)
    } catch { setError('Error de conexión.') }
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
      <div className="glass-card fade-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '11px', background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{item.emoji}</div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Publicar para vender</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MdClose size={18} /></button>
        </div>
        {!done ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(0,230,118,0.1)', borderRadius: '9px', padding: '10px 13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lo pagué por</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-primary)' }}>${Number(item.boughtFor || item.price).toLocaleString()}</span>
            </div>
            <div>
              <p style={fl}><MdAttachMoney size={13} style={{ color: 'var(--green-primary)' }} /> Precio de venta (COP)</p>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)', fontSize: '13px' }}>$</span>
                <input className="input-dark" style={{ width: '100%', padding: '10px 11px 10px 24px', fontSize: '14px' }}
                  placeholder={String(Math.round(Number(item.boughtFor || item.price) * 1.2).toLocaleString())}
                  type="number" min="1000" value={price} onChange={e => { setPrice(e.target.value); setError('') }} required />
              </div>
            </div>
            <div>
              <p style={fl}><MdDescription size={13} style={{ color: 'var(--green-primary)' }} /> Descripción (opcional)</p>
              <textarea className="input-dark" style={{ width: '100%', padding: '10px 11px', fontSize: '13px', resize: 'none', minHeight: '72px', fontFamily: 'inherit' }}
                placeholder="Estado, qué incluye..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            {error && <p style={{ fontSize: '11px', color: '#ef5350' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1, padding: '10px', fontSize: '13px' }}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}
                style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.75 : 1 }}>
                <MdSell size={15} /> {saving ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</p>
            <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--green-primary)', marginBottom: '6px' }}>¡Publicado en el marketplace!</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Tu producto ya está visible para todos.</p>
            <button className="btn-primary" onClick={onClose} style={{ padding: '9px 28px', fontSize: '13px' }}>Listo</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Empty({ navigate }) {
  return (
    <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
      <p style={{ fontSize: '48px', marginBottom: '14px' }}>🛍️</p>
      <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>No has comprado nada aún</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '340px', lineHeight: '1.7', marginBottom: '20px' }}>
        Compra objetos en el marketplace para verlos aquí.
      </p>
      <button className="btn-primary" onClick={() => navigate('/dashboard/marketplace')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', fontSize: '13px' }}>
        <MdStorefront size={16} /> Ir al marketplace
      </button>
    </div>
  )
}
