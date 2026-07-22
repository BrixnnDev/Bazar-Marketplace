import API_BASE from '../../../config/api'
import { useEffect, useState } from 'react'
import {
  MdSearch,
  MdEdit,
  MdBlock,
  MdCheckCircle,
  MdEmail,
  MdPhone,
  MdAccountBalanceWallet,
  MdClose,
  MdSave,
  MdAdminPanelSettings,
  MdVerified,
} from 'react-icons/md'

/* ── Roles disponibles ── */
const ROLES = [
  { id: 'usuario',      label: 'Usuario',      color: '#69f0ae', bg: 'rgba(105,240,174,0.1)' },
  { id: 'vendedor',     label: 'Vendedor',      color: '#64b5f6', bg: 'rgba(100,181,246,0.1)' },
  { id: 'comprador',    label: 'Comprador',     color: '#ffa726', bg: 'rgba(255,167,38,0.1)'  },
  { id: 'administrador',label: 'Administrador', color: '#ce93d8', bg: 'rgba(206,147,216,0.1)' },
]

const STATUS_CFG = {
  activo:     { label: 'Activo',      color: '#00e676', bg: 'rgba(0,230,118,0.1)'   },
  suspendido: { label: 'Suspendido',  color: '#ef5350', bg: 'rgba(239,83,80,0.1)'   },
  pendiente:  { label: 'Pendiente',   color: '#ffa726', bg: 'rgba(255,167,38,0.1)'  },
}

/* ── Usuarios mock (incluye el de registro) ── */
const FILTER_ROLES    = ['Todos', 'Usuario', 'Vendedor', 'Comprador', 'Administrador']
const FILTER_STATUSES = ['Todos', 'Activo', 'Suspendido', 'Pendiente']

const API_ADMIN_USERS = `${API_BASE}/api/admin/users`

export default function AdminUsersPage() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterRole, setFilterRole]     = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [editUser, setEditUser]   = useState(null)
  const [editForm, setEditForm]   = useState({})
  const [error, setError]         = useState('')

  /* ── Filtrado ── */
  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase()) ||
                        u.id.toLowerCase().includes(search.toLowerCase())
    const roleCfg = ROLES.find(r => r.id === u.role)
    const matchRole   = filterRole === 'Todos'   || roleCfg?.label === filterRole
    const statusCfg = STATUS_CFG[u.status]
    const matchStatus = filterStatus === 'Todos' || statusCfg?.label === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  function openEdit(user) {
    setEditUser(user)
    setEditForm({
      role:    user.role,
      status:  user.status,
      nequi:   user.nequi || '',
      balance: user.balance ?? 0,
      credits: user.credits ?? 0,
    })
  }

  async function saveEdit() {
    const token = localStorage.getItem('bazar_token')
    try {
      // 1. Cambiar rol y estado si aplica
      await fetch(`${API_BASE}/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role:   editForm.role,
          status: editForm.status,
          nequi:  editForm.nequi,
        }),
      })

      // 2. Ajustar saldo directamente
      await fetch(`${API_BASE}/api/admin/set-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code:    editUser.code,
          balance: Number(editForm.balance),
          credits: Number(editForm.credits),
        }),
      })
    } catch { /* fallback local */ }

    // Actualizar lista local inmediatamente
    setUsers(prev => prev.map(u =>
      u.id === editUser.id
        ? { ...u, ...editForm, balance: Number(editForm.balance), credits: Number(editForm.credits) }
        : u
    ))
    setEditUser(null)
  }

  function toggleStatus(id) {
    const token = localStorage.getItem('bazar_token')
    const u = users.find(x => x.id === id)
    const newStatus = u.status === 'activo' ? false : true
    fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus ? 'activo' : 'suspendido' }),
    }).catch(() => {})
    setUsers(prev => prev.map(x => x.id === id ? { ...x, status: x.status === 'activo' ? 'suspendido' : 'activo' } : x))
  }

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('bazar_token')
        const res = await fetch(API_ADMIN_USERS, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar usuarios.')
        setUsers(data.users || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  /* ── Stats globales ── */
  const totalActive  = users.filter(u => u.status === 'activo').length
  const totalSellers = users.filter(u => u.role === 'vendedor').length

  return (
    /* Pantalla completa, sin scroll externo — el grid ocupa todo */
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Usuarios</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Solo el administrador puede ver y gestionar esta sección</p>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', flexShrink: 0 }}>
        <MiniStat label="Total"       value={users.length}  color="#00e676" />
        <MiniStat label="Activos"     value={totalActive}   color="#69f0ae" />
        <MiniStat label="Vendedores"  value={totalSellers}  color="#64b5f6" />
        <MiniStat label="Suspendidos" value={users.filter(u => u.status === 'suspendido').length} color="#ef5350" />
      </div>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,83,80,0.12)', border: '1px solid rgba(239,83,80,0.25)', color: '#ef5350', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* ── FILTROS ── */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <MdSearch size={16} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)' }} />
          <input className="input-dark" style={{ width: '100%', padding: '9px 11px 9px 34px', fontSize: '13px' }}
            placeholder="Buscar por nombre, usuario, correo o código..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', padding: '0 12px', fontSize: '13px', cursor: 'pointer', outline: 'none', minWidth: '140px' }}>
          {FILTER_ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '10px', color: 'var(--text-primary)', padding: '0 12px', fontSize: '13px', cursor: 'pointer', outline: 'none', minWidth: '130px' }}>
          {FILTER_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)', alignSelf: 'center' }}>
          {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── GRID — scroll interno ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading ? (
          <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⌛</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cargando usuarios...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>👥</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No hay usuarios con ese filtro.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', paddingBottom: '8px' }}>
            {filtered.map(user => (
              <UserCard key={user.id} user={user}
                onEdit={() => openEdit(user)}
                onToggleStatus={() => toggleStatus(user.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL EDITAR ── */}
      {editUser && (
        <div
          onClick={() => setEditUser(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}
        >
          <div
            className="glass-card fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', padding: '32px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '36px' }}>{editUser.avatar}</span>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{editUser.name}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{editUser.username} · {editUser.id}</p>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <MdClose size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Rol */}
              <div>
                <EditLabel label="Rol de usuario" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setEditForm({ ...editForm, role: r.id })}
                      style={{
                        padding: '9px 12px', borderRadius: '9px', cursor: 'pointer',
                        background: editForm.role === r.id ? r.bg : 'rgba(0,0,0,0.25)',
                        border: `1px solid ${editForm.role === r.id ? r.color + '50' : 'rgba(0,230,118,0.08)'}`,
                        color: editForm.role === r.id ? r.color : 'var(--text-secondary)',
                        fontSize: '13px', fontWeight: '500', transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <span>{r.id === 'administrador' ? '👑' : r.id === 'vendedor' ? '💼' : r.id === 'comprador' ? '🛒' : '👤'}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div>
                <EditLabel label="Estado de la cuenta" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setEditForm({ ...editForm, status: key })}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '9px', cursor: 'pointer',
                        background: editForm.status === key ? cfg.bg : 'rgba(0,0,0,0.25)',
                        border: `1px solid ${editForm.status === key ? cfg.color + '50' : 'rgba(0,230,118,0.08)'}`,
                        color: editForm.status === key ? cfg.color : 'var(--text-secondary)',
                        fontSize: '12px', fontWeight: '500', transition: 'all 0.15s',
                      }}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nequi */}
              <div>
                <EditLabel label="Nequi / Cuenta de pago" />
                <input
                  className="input-dark"
                  style={{ width: '100%', padding: '11px 14px', fontSize: '14px' }}
                  value={editForm.nequi}
                  onChange={(e) => setEditForm({ ...editForm, nequi: e.target.value })}
                />
              </div>

              {/* Saldo y Créditos en dos columnas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <EditLabel label="💰 Saldo (COP)" />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.5)', fontSize: '13px', fontWeight: 700 }}>$</span>
                    <input
                      className="input-dark"
                      style={{ width: '100%', padding: '11px 14px 11px 26px', fontSize: '14px', fontWeight: 700, color: '#00e676' }}
                      type="number" min="0"
                      value={editForm.balance}
                      onChange={e => setEditForm({ ...editForm, balance: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <EditLabel label="⭐ Créditos (Bz)" />
                  <input
                    className="input-dark"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px', fontWeight: 700, color: '#ce93d8' }}
                    type="number" min="0"
                    value={editForm.credits}
                    onChange={e => setEditForm({ ...editForm, credits: e.target.value })}
                  />
                </div>
              </div>

              {/* Vista previa de los valores */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '10px', background: 'rgba(0,230,118,0.06)', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.18)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '9px', color: 'rgba(165,214,167,0.5)', fontWeight: 600, marginBottom: '4px' }}>SALDO ACTUAL</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#00e676' }}>${Number(editUser.balance || 0).toLocaleString('es-CO')} COP</p>
                </div>
                <div style={{ padding: '10px', background: 'rgba(206,147,216,0.06)', borderRadius: '10px', border: '1px solid rgba(206,147,216,0.18)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '9px', color: 'rgba(206,147,216,0.5)', fontWeight: 600, marginBottom: '4px' }}>CRÉDITOS ACTUALES</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#ce93d8' }}>{Number(editUser.credits || 0).toLocaleString('es-CO')} Bz</p>
                </div>
              </div>

              {/* Guardar */}
              <button
                onClick={saveEdit}
                className="btn-primary"
                style={{ padding: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
              >
                <MdSave size={16} />
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── UserCard ─────────── */
function UserCard({ user, onEdit, onToggleStatus }) {
  const roleCfg   = ROLES.find(r => r.id === user.role)
  const statusCfg = STATUS_CFG[user.status]

  return (
    <div
      className="glass-card"
      style={{ overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(0,230,118,0.28)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,230,118,0.12)' }}
    >
      {/* ── TOP: Avatar + estado + nombre ── */}
      <div style={{ padding: '18px 18px 14px', background: 'linear-gradient(135deg, rgba(0,230,118,0.05), rgba(0,0,0,0.18))', borderBottom: '1px solid rgba(0,230,118,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `${roleCfg?.color}18`, border: `1px solid ${roleCfg?.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
            {user.avatar}
          </div>
          <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
            {statusCfg.label}
          </span>
        </div>

        <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1px' }}>{user.name}</p>
        <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.45)', marginBottom: '8px' }}>@{user.username} · {user.id}</p>

        {/* Rol badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: '700', background: roleCfg?.bg, color: roleCfg?.color, border: `1px solid ${roleCfg?.color}28` }}>
          {user.role === 'administrador' ? <MdAdminPanelSettings size={11} /> : <MdVerified size={11} />}
          {roleCfg?.label}
        </span>
      </div>

      {/* ── CONTACTO ── */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,230,118,0.06)' }}>
        <InfoRow icon={<MdEmail size={12} />}             value={user.email} />
        <InfoRow icon={<MdPhone size={12} />}             value={user.phone} />
        {user.nequi ? (
          <InfoRow icon={<MdAccountBalanceWallet size={12} />} value={`Nequi: ${user.nequi}`} />
        ) : null}
      </div>

      {/* ── STATS: saldo y créditos reales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '12px 14px', gap: '8px', borderBottom: '1px solid rgba(0,230,118,0.06)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#00e676', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            ${Number(user.balance || 0).toLocaleString('es-CO')}
          </div>
          <span style={{ fontSize: '9px', color: 'rgba(165,214,167,0.4)' }}>Saldo COP</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#ce93d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {Number(user.credits || 0).toLocaleString('es-CO')}
          </div>
          <span style={{ fontSize: '9px', color: 'rgba(165,214,167,0.4)' }}>Créditos Bz</span>
        </div>
      </div>

      {/* ── FOOTER: fecha + acciones ── */}
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: 'rgba(165,214,167,0.3)' }}>Desde {user.joined}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <ActionBtn icon={<MdEdit size={14} />}       title="Editar"    color="var(--green-primary)" onClick={onEdit} />
          <ActionBtn
            icon={user.status === 'activo' ? <MdBlock size={14} /> : <MdCheckCircle size={14} />}
            title={user.status === 'activo' ? 'Suspender' : 'Activar'}
            color={user.status === 'activo' ? '#ef5350' : '#00e676'}
            onClick={onToggleStatus}
          />
        </div>
      </div>
    </div>
  )
}

/* ─── Helpers ─── */
function MiniStat({ label, value, color }) {
  return (
    <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '24px', fontWeight: '800', color }}>{value}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{label}</span>
    </div>
  )
}

function InfoRow({ icon, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
      <span style={{ color: 'rgba(0,230,118,0.4)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
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
      onMouseEnter={(e) => { e.currentTarget.style.background = `${color === '#ef5350' ? 'rgba(239,83,80,0.12)' : 'rgba(0,230,118,0.1)'}` }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)' }}
    >
      {icon}
    </button>
  )
}

function EditLabel({ label }) {
  return <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '7px', fontWeight: '500' }}>{label}</p>
}
