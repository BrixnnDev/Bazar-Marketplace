import { useState, useEffect } from 'react'
import {
  fetchProductsFromAPI,
  createProductAPI,
  updateProductAPI,
  toggleVisibilityAPI,
  deleteProductAPI,
} from '../../../utils/productStorage'
import {
  MdSearch,
  MdAddCircle,
  MdEdit,
  MdDelete,
  MdClose,
  MdInventory2,
  MdAttachMoney,
  MdCategory,
  MdDescription,
  MdImage,
  MdCheckCircle,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md'

/* ── Categorías con rol ── */
const CATEGORIES = [
  { id: 'electrodomestico', label: 'Electrodoméstico', emoji: '🔌', color: '#64b5f6' },
  { id: 'electronica',      label: 'Electrónica',      emoji: '📱', color: '#00e676' },
  { id: 'gaming',           label: 'Gaming',           emoji: '🎮', color: '#ce93d8' },
  { id: 'ropa',             label: 'Ropa y Calzado',   emoji: '👕', color: '#ffa726' },
  { id: 'deportes',         label: 'Deportes',         emoji: '⚽', color: '#ef5350' },
  { id: 'hogar',            label: 'Hogar',            emoji: '🏠', color: '#80cbc4' },
  { id: 'vehiculos',        label: 'Vehículos',        emoji: '🚗', color: '#ffcc02' },
  { id: 'libros',           label: 'Libros',           emoji: '📚', color: '#a5d6a7' },
  { id: 'fotografia',       label: 'Fotografía',       emoji: '📷', color: '#f48fb1' },
  { id: 'otro',             label: 'Otro',             emoji: '📦', color: '#90a4ae' },
]

const EMPTY_FORM = { name: '', category: 'electronica', price: '', stock: '', desc: '', emoji: '📦' }

export default function AdminInventoryPage() {
  const [products, setProducts]     = useState([])
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('todos')
  const [showModal, setShowModal]   = useState(false)
  const [editItem, setEditItem]     = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [savedMsg, setSavedMsg]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [apiError, setApiError]     = useState('')
  const [loading, setLoading]       = useState(false)

  /* Cargar desde API al montar y re-sincronizar con eventos locales */
  useEffect(() => {
    fetchProductsFromAPI().then(setProducts)
  }, [])

  /* ── Filtrado ── */
  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === 'todos' || p.category === filterCat
    return matchSearch && matchCat
  })

  /* ── Abrir modal crear ── */
  function openCreate() {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  /* ── Abrir modal editar ── */
  function openEdit(item) {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, price: item.price, stock: item.stock, desc: item.desc, emoji: item.emoji })
    setShowModal(true)
  }

  /* ── Guardar ── */
  async function handleSave(e) {
    e.preventDefault()
    setApiError('')
    setLoading(true)
    try {
      if (editItem) {
        await updateProductAPI(editItem.id, form)
      } else {
        await createProductAPI(form)
      }
      const fresh = await fetchProductsFromAPI()
      setProducts(fresh)
      setSavedMsg(true)
      setTimeout(() => { setSavedMsg(false); setShowModal(false) }, 1800)
    } catch (err) {
      setApiError(err.message || 'Error al guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  /* ── Eliminar ── */
  async function handleDelete(id) {
    try {
      await deleteProductAPI(id)
      const fresh = await fetchProductsFromAPI()
      setProducts(fresh)
    } catch (err) {
      console.error('Error eliminando producto:', err.message)
    }
    setDeleteConfirm(null)
  }

  /* ── Toggle visibilidad ── */
  async function toggleVisible(id) {
    const current = products.find(p => p.id === id)
    if (!current) return
    try {
      await toggleVisibilityAPI(id, !current.visible)
      const fresh = await fetchProductsFromAPI()
      setProducts(fresh)
    } catch (err) {
      console.error('Error cambiando visibilidad:', err.message)
    }
  }

  const totalStock   = products.reduce((s, p) => s + p.stock, 0)
  const totalVisible = products.filter((p) => p.visible).length

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 16px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Inventario
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Solo el administrador puede crear y gestionar el catálogo de productos
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontSize: '14px' }}
        >
          <MdAddCircle size={18} />
          Agregar producto
        </button>
      </div>

      {/* ── STATS RÁPIDAS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
        <StatMini label="Total productos" value={products.length} color="#00e676" />
        <StatMini label="Unidades en stock" value={totalStock} color="#69f0ae" />
        <StatMini label="Visibles en marketplace" value={totalVisible} color="#64b5f6" />
      </div>

      {/* ── SEARCH + FILTRO CATEGORÍA ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <MdSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)' }} />
          <input
            className="input-dark"
            style={{ width: '100%', padding: '10px 14px 10px 38px', fontSize: '14px' }}
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)',
            borderRadius: '10px', color: 'var(--text-primary)', padding: '0 14px',
            fontSize: '14px', cursor: 'pointer', outline: 'none', minWidth: '190px',
          }}
        >
          <option value="todos">Todas las categorías</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {/* ── ETIQUETAS DE ROL ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(filterCat === cat.id ? 'todos' : cat.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '500',
              background: filterCat === cat.id ? `${cat.color}20` : `${cat.color}0d`,
              color: cat.color,
              border: `1px solid ${filterCat === cat.id ? cat.color + '50' : cat.color + '20'}`,
              whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* ── TABLA DE PRODUCTOS ── */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>No hay productos con ese filtro.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {/* Cabecera */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 90px 80px 110px 100px',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(0,230,118,0.08)',
            }}
          >
            {['Producto', 'Categoría · Rol', 'Precio', 'Stock', 'Visible', 'Acciones'].map((h) => (
              <span key={h} style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</span>
            ))}
          </div>

          {filtered.map((item, i) => {
            const cat = CATEGORIES.find(c => c.id === item.category)
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 90px 80px 110px 100px',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,230,118,0.05)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,230,118,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Nombre */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                      background: `${cat?.color}15`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '20px',
                    }}
                  >
                    {item.emoji}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)', marginTop: '2px' }}>{item.desc.slice(0, 40)}…</p>
                  </div>
                </div>

                {/* Categoría / rol */}
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600',
                    background: `${cat?.color}18`, color: cat?.color,
                    border: `1px solid ${cat?.color}30`, width: 'fit-content',
                  }}
                >
                  {cat?.emoji} {cat?.label}
                </span>

                {/* Precio */}
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--green-primary)' }}>
                  ${item.price.toLocaleString()}
                </span>

                {/* Stock */}
                <span
                  style={{
                    fontSize: '13px', fontWeight: '600',
                    color: item.stock === 0 ? '#ef5350' : item.stock <= 2 ? '#ffa726' : 'var(--text-primary)',
                  }}
                >
                  {item.stock} ud.
                </span>

                {/* Visible toggle */}
                <button
                  onClick={() => toggleVisible(item.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '600',
                    background: item.visible ? 'rgba(0,230,118,0.1)' : 'rgba(0,0,0,0.3)',
                    color: item.visible ? '#00e676' : 'rgba(165,214,167,0.3)',
                    border: `1px solid ${item.visible ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    cursor: 'pointer', transition: 'all 0.2s', width: 'fit-content',
                  }}
                >
                  {item.visible ? <MdVisibility size={13} /> : <MdVisibilityOff size={13} />}
                  {item.visible ? 'Visible' : 'Oculto'}
                </button>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <ActionBtn icon={<MdEdit size={15} />} title="Editar" color="var(--green-primary)" onClick={() => openEdit(item)} />
                  <ActionBtn icon={<MdDelete size={15} />} title="Eliminar" color="#ef5350" onClick={() => setDeleteConfirm(item.id)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
        >
          <div
            className="glass-card fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', padding: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {editItem ? 'Editar producto' : 'Agregar producto al inventario'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <MdClose size={20} />
              </button>
            </div>

            {savedMsg ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ color: 'var(--green-primary)', fontWeight: '700', fontSize: '18px', marginBottom: '6px' }}>
                  {editItem ? 'Producto actualizado' : '¡Producto creado!'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ya aparece en el catálogo del marketplace.</p>
              </div>
            ) : (
              <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Error API */}
                {apiError && (
                  <div style={{ gridColumn: '1 / -1', padding: '10px 14px', background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.3)', borderRadius: '10px', fontSize: '13px', color: '#ef5350' }}>
                    ⚠️ {apiError}
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <FormLabel icon={<MdImage size={14} />} label="Emoji representativo" />
                  <input
                    className="input-dark"
                    style={{ width: '80px', padding: '10px', fontSize: '22px', textAlign: 'center' }}
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    maxLength={2}
                    required
                  />
                </div>

                {/* Nombre */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormLabel icon={<MdDescription size={14} />} label="Nombre del producto" />
                  <input
                    className="input-dark"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px' }}
                    placeholder="Ej: MacBook Air M2 256GB"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                {/* Categoría */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormLabel icon={<MdCategory size={14} />} label="Categoría · Rol del producto" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.id })}
                        style={{
                          padding: '8px 6px', borderRadius: '10px', cursor: 'pointer',
                          background: form.category === cat.id ? `${cat.color}20` : 'rgba(0,0,0,0.25)',
                          border: `1px solid ${form.category === cat.id ? cat.color + '50' : 'rgba(0,230,118,0.08)'}`,
                          color: form.category === cat.id ? cat.color : 'var(--text-secondary)',
                          fontSize: '11px', fontWeight: '500', transition: 'all 0.15s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{cat.emoji}</span>
                        <span style={{ fontSize: '10px', textAlign: 'center', lineHeight: '1.2' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Precio */}
                <div>
                  <FormLabel icon={<MdAttachMoney size={14} />} label="Precio (COP)" />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)', fontSize: '14px' }}>$</span>
                    <input
                      className="input-dark"
                      style={{ width: '100%', padding: '11px 14px 11px 26px', fontSize: '14px' }}
                      placeholder="800,000"
                      type="number" min="1000"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <FormLabel icon={<MdInventory2 size={14} />} label="Unidades (stock)" />
                  <input
                    className="input-dark"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px' }}
                    placeholder="10"
                    type="number" min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                </div>

                {/* Descripción */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <FormLabel icon={<MdDescription size={14} />} label="Descripción" />
                  <textarea
                    className="input-dark"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                    placeholder="Estado, accesorios incluidos, características..."
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} style={{ padding: '10px 24px', fontSize: '14px' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 28px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.75 : 1 }}>
                    <MdCheckCircle size={16} />
                    {loading ? 'Guardando...' : editItem ? 'Guardar cambios' : 'Crear producto'}
                  </button>                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINAR ── */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px',
          }}
        >
          <div className="glass-card fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '14px' }}>🗑️</div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              ¿Eliminar producto?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Esta acción lo quitará del catálogo y del marketplace. No se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600',
                  background: 'rgba(239,83,80,0.15)', border: '1px solid rgba(239,83,80,0.35)',
                  borderRadius: '10px', color: '#ef5350', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Helpers ─── */
function StatMini({ label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <span style={{ fontSize: '26px', fontWeight: '800', color }}>{value}</span>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

function FormLabel({ icon, label }) {
  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '7px', fontWeight: '500' }}>
      <span style={{ color: 'var(--green-primary)' }}>{icon}</span>
      {label}
    </p>
  )
}

function ActionBtn({ icon, title, color, onClick }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)',
        borderRadius: '8px', width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, cursor: 'pointer', transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${color === '#ef5350' ? 'rgba(239,83,80,0.1)' : 'rgba(0,230,118,0.08)'}`; e.currentTarget.style.borderColor = `${color}40` }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'var(--border-glass)' }}
    >
      {icon}
    </button>
  )
}
