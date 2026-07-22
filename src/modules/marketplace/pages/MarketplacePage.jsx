import { useEffect, useState } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useUser } from '../../../context/UserContext'
import { fetchProductsFromAPI } from '../../../utils/productStorage'
import {
  MdSearch,
  MdShoppingCart,
  MdSell,
  MdStar,
  MdVerified,
  MdClose,
  MdTune,
} from 'react-icons/md'

/* ── Datos mock ── */
const CATEGORIES = ['Todos', 'Electrónica', 'Ropa y Calzado', 'Deportes', 'Hogar', 'Gaming', 'Fotografía', 'Vehículos', 'Libros']

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor calificados' },
]

const TAG_COLORS = {
  Destacado: { bg: 'rgba(0,230,118,0.12)',  color: '#00e676' },
  Nuevo:     { bg: 'rgba(100,181,246,0.15)', color: '#64b5f6' },
  Popular:   { bg: 'rgba(255,167,38,0.12)', color: '#ffa726' },
  Oferta:    { bg: 'rgba(239,83,80,0.12)',  color: '#ef5350' },
}

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [priceMax, setPriceMax] = useState(10000000)
  const [selectedTags, setSelectedTags] = useState([])
  const [buyModal, setBuyModal] = useState(null)

  useEffect(() => {
    fetchProductsFromAPI().then(setProducts)

    const interval = setInterval(() => {
      fetchProductsFromAPI().then(setProducts)
    }, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  /* ── Filtrado ── */
  let filtered = products.filter((p) => {
    if (!p.visible) return false
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.seller.toLowerCase().includes(search.toLowerCase())
    const matchCat    = activeCategory === 'Todos' || p.categoryLabel === activeCategory
    const matchPrice  = p.price <= priceMax
    return matchSearch && matchCat && matchPrice
  })

  if (sortBy === 'price_asc')  filtered = [...filtered].sort((a, b) => a.price - b.price)
  if (sortBy === 'price_desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  if (sortBy === 'rating')     filtered = [...filtered].sort((a, b) => b.rating - a.rating)

  function toggleTag(tag) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  function handlePurchase() {
    // Refrescar productos desde API para reflejar el stock actualizado
    fetchProductsFromAPI().then(setProducts)
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Marketplace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {filtered.length} productos disponibles
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate('/dashboard/sell')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '14px' }}
        >
          <MdSell size={18} />
          Vender objeto
        </button>
      </div>

      {/* ── SEARCH + FILTROS ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <MdSearch
            size={20}
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)' }}
          />
          <input
            className="input-dark"
            style={{ width: '100%', padding: '11px 14px 11px 42px', fontSize: '14px' }}
            placeholder="Buscar productos, vendedores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            padding: '0 14px',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
            minWidth: '210px',
          }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Filtros toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: showFilters ? 'rgba(0,230,118,0.12)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${showFilters ? 'rgba(0,230,118,0.3)' : 'var(--border-glass)'}`,
            borderRadius: '10px', color: showFilters ? 'var(--green-primary)' : 'var(--text-secondary)',
            padding: '0 16px', fontSize: '14px', cursor: 'pointer', height: '44px',
            transition: 'all 0.2s',
          }}
        >
          <MdTune size={18} />
          Filtros {selectedTags.length > 0 && <span style={{ background: 'var(--green-primary)', color: '#0a0f0d', borderRadius: '999px', padding: '0 6px', fontSize: '11px', fontWeight: '700' }}>{selectedTags.length}</span>}
        </button>
      </div>

      {/* ── PANEL FILTROS ── */}
      {showFilters && (
        <div className="glass-card fade-in" style={{ padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Precio */}
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Precio máx: <span style={{ color: 'var(--green-primary)' }}>${priceMax.toLocaleString()}</span>
            </p>
            <input
              type="range" min="50000" max="10000000" step="50000"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              style={{ width: '220px', accentColor: 'var(--green-primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Tags */}
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Etiquetas
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.keys(TAG_COLORS).map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: '5px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: '500',
                      background: active ? TAG_COLORS[tag].bg : 'rgba(0,0,0,0.3)',
                      color: active ? TAG_COLORS[tag].color : 'var(--text-secondary)',
                      border: `1px solid ${active ? TAG_COLORS[tag].color + '50' : 'var(--border-glass)'}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setSelectedTags([]); setPriceMax(10000000); setSearch('') }}
            style={{ background: 'none', border: 'none', color: 'rgba(239,83,80,0.7)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-end', marginBottom: '2px' }}
          >
            <MdClose size={15} /> Limpiar filtros
          </button>
        </div>
      )}

      {/* ── CATEGORÍAS ── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '7px 18px', borderRadius: '999px', fontSize: '13px', fontWeight: '500',
              whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
              background: activeCategory === cat ? 'rgba(0,230,118,0.15)' : 'rgba(0,0,0,0.3)',
              color: activeCategory === cat ? 'var(--green-primary)' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === cat ? 'rgba(0,230,118,0.3)' : 'var(--border-glass)'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── GRID DE PRODUCTOS (3 por fila) ── */}
      {filtered.length === 0 ? (
        <EmptyState onReset={() => { setSearch(''); setActiveCategory('Todos'); setSelectedTags([]); setPriceMax(10000000) }} />
      ) : (
        <div className="marketplace-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onBuy={() => setBuyModal(product)} isOwner={Boolean(product.sellerId && user?.code && product.sellerId === user.code)} />
          ))}
        </div>
      )}

      {/* ── MODAL COMPRA ── */}
      {buyModal && <BuyModal product={buyModal} onClose={() => setBuyModal(null)} onPurchaseSuccess={handlePurchase} />}
    </div>
  )
}

/* ─────────── ProductCard ─────────── */
function ProductCard({ product, onBuy, isOwner }) {
  const tag = isOwner && product.forSale ? 'En venta' : null
  return (
    <div
      className="glass-card"
      style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', cursor: 'default', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'rgba(0,230,118,0.28)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,230,118,0.12)' }}
    >
      {/* Imagen / emoji */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,230,118,0.05), rgba(0,0,0,0.3))',
          height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '56px', position: 'relative',
          borderBottom: '1px solid rgba(0,230,118,0.07)',
        }}
      >
        {product.emoji}
        {tag && (
          <span
            style={{
              position: 'absolute', top: '10px', left: '10px',
              ...TAG_COLORS[tag],
              borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: '600',
              border: `1px solid ${TAG_COLORS[tag].color}30`,
            }}
          >
            {tag}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3' }}>{product.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            <MdStar size={13} style={{ color: '#ffa726' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{product.rating}</span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.5)' }}>
          {product.categoryLabel} · {product.sales} ventas
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '2px', flexGrow: 1 }}>
          {product.desc}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <MdVerified size={13} style={{ color: 'var(--green-primary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.seller}</span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(0,230,118,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--green-primary)' }}>
          ${product.price.toLocaleString()}
        </span>
        <button
          className="btn-primary"
          onClick={onBuy}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
        >
          <MdShoppingCart size={15} />
          Comprar
        </button>
      </div>
    </div>
  )
}

/* ─────────── Modal compra ─────────── */
function BuyModal({ product, onClose, onPurchaseSuccess }) {
  const { user, updateUser } = useUser()
  const [step,      setStep]      = useState('confirm') // 'confirm' | 'processing' | 'success' | 'error'
  const [errorMsg,  setErrorMsg]  = useState('')
  const balance    = Number(user?.balance || 0)
  const canBuy     = balance >= product.price

  async function handleConfirm() {
    if (!canBuy) { setErrorMsg('Saldo insuficiente para completar la compra.'); return }
    setStep('processing')
    setErrorMsg('')
    try {
      const token = localStorage.getItem('bazar_token')
      const res   = await fetch('http://localhost:3001/api/purchases', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo completar la compra.')
        setStep('error')
        return
      }
      // Actualizar saldo en contexto y localStorage
      updateUser({ balance: data.newBalance })
      onPurchaseSuccess(product)
      setStep('success')
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.')
      setStep('error')
    }
  }

  return (
    <div onClick={step !== 'processing' ? onClose : undefined}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
      <div className="glass-card fade-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>

        {/* ── PROCESANDO ── */}
        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Verificando transacción...</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Estamos procesando tu compra, espera un momento.</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,230,118,0.15)', borderTop: '3px solid #00e676', animation: 'spin 0.8s linear infinite' }} />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── CONFIRMAR ── */}
        {(step === 'confirm' || step === 'error') && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{product.emoji}</div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>{product.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Vendido por {product.seller}</p>
            </div>

            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', background: 'rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Precio</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${product.price.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tu saldo</span>
                <span style={{ color: 'var(--green-primary)', fontWeight: '600' }}>${balance.toLocaleString()}</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(0,230,118,0.08)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Saldo restante</span>
                <span style={{ color: !canBuy ? '#ef5350' : 'var(--green-primary)', fontWeight: '700' }}>
                  ${Math.max(0, balance - product.price).toLocaleString()}
                </span>
              </div>
            </div>

            {(errorMsg || !canBuy) && (
              <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.25)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#ef5350' }}>
                ⚠️ {errorMsg || 'Saldo insuficiente para completar la compra.'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={onClose} style={{ flex: 1, padding: '11px', fontSize: '14px' }}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirm} disabled={!canBuy}
                style={{ flex: 1, padding: '11px', fontSize: '14px', opacity: !canBuy ? 0.5 : 1 }}>
                Confirmar compra
              </button>
            </div>
          </>
        )}

        {/* ── ÉXITO ── */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--green-primary)', marginBottom: '8px' }}>¡Compra exitosa!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong> fue agregado a tus compras.
            </p>
            <p style={{ color: 'rgba(165,214,167,0.5)', fontSize: '12px', marginBottom: '24px' }}>
              Puedes verlo en "Mis compras · Vender" para revenderlo.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ padding: '10px 32px', fontSize: '14px' }}>Continuar</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────── Empty state ─────────── */
function EmptyState({ onReset }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
        Sin resultados
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
        No hay productos disponibles por el momento.
      </p>
      <button className="btn-ghost" onClick={onReset} style={{ padding: '9px 24px', fontSize: '14px' }}>
        Limpiar filtros
      </button>
    </div>
  )
}
