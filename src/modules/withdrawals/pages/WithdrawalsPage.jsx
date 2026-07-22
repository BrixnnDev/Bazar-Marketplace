import API_BASE from '../../../config/api'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MdAccountBalanceWallet, MdCheckCircle, MdCancel,
  MdSettings, MdArrowForward, MdPerson, MdBadge, MdPhone, MdWarning,
  MdMoney,
} from 'react-icons/md'
import { usePaymentMethods, BANK_CATALOG } from '../../../context/PaymentMethodsContext'
import { useUser }                         from '../../../context/UserContext'

const STATUS_CFG = {
  pending:  { icon: MdMoney,     color: '#ffa726', bg: 'rgba(255,167,38,0.1)',  label: 'Pendiente'  },
  approved: { icon: MdCheckCircle, color: '#00e676', bg: 'rgba(0,230,118,0.1)', label: 'Aprobado'   },
  denied:   { icon: MdCancel,    color: '#ef5350', bg: 'rgba(239,83,80,0.1)',   label: 'Rechazado'  },
}

const QUICK = [10000, 20000, 50000, 100000, 200000, 500000, 1000000]
function fmtQ(q) {
  if (q >= 1000000) return `$${q / 1000000}M`
  if (q >= 1000)    return `$${q / 1000}k`
  return `$${q}`
}

export default function WithdrawalsPage() {
  return <WithdrawView />
}

function WithdrawView() {
  const navigate         = useNavigate()
  const { methods }      = usePaymentMethods()
  const { user }         = useUser()
  const balance          = Number(user?.balance || 0)
  const token            = localStorage.getItem('bazar_token')

  const [history,    setHistory]    = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [amount,     setAmount]     = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const selected     = methods.find(m => m.id === selectedId)
  const selectedBank = selected ? BANK_CATALOG.find(b => b.id === selected.bankId) : null
  const noAccounts   = methods.length === 0

  useEffect(() => {
    loadHistory()
    const interval = setInterval(loadHistory, 5000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadHistory() {
    if (!token) return
    try {
      const res  = await fetch(`${API_BASE}/api/withdrawals/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setHistory(data.requests || [])
    // eslint-disable-next-line no-empty
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const amt = Number(amount)
    if (!selected)     { setError('Selecciona una cuenta.'); return }
    if (amt < 10000)   { setError('Mínimo $10,000.'); return }
    if (amt > balance) { setError(`Saldo insuficiente. Máx $${balance.toLocaleString()}.`); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/withdrawals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bankId:        selected.bankId,
          bankLabel:     selectedBank?.label || selected.bankId,
          accountNumber: selected.accountNumber,
          ownerName:     selected.ownerName,
          nit:           selected.nit || null,
          amount:        amt,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar.'); setLoading(false); return }
      await loadHistory()
      setSubmitted(true); setAmount(''); setSelectedId(null)
      setTimeout(() => setSubmitted(false), 3500)
    } catch {
      setError('Sin conexión al servidor.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-in" style={{ height: '100%', display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: '10px', overflow: 'hidden' }}>

      {/* ══ COL A: Cuentas ══ */}
      <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <p style={SL}>Cuentas</p>
        {noAccounts ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '26px' }}>🏦</span>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sin cuentas conectadas</p>
            <button onClick={() => navigate('/dashboard/settings', { state: { tab: 'pagos' } })} className="btn-primary"
              style={{ fontSize: '10px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MdSettings size={11} /> Conectar <MdArrowForward size={11} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {methods.map(m => {
                const bank   = BANK_CATALOG.find(b => b.id === m.bankId)
                const active = selectedId === m.id
                return (
                  <button key={m.id} type="button" onClick={() => setSelectedId(active ? null : m.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 11px', borderRadius: '10px', cursor: 'pointer', width: '100%', background: active ? `${bank?.color}18` : 'rgba(0,0,0,0.2)', border: `2px solid ${active ? bank?.color + '55' : 'transparent'}`, outline: `1px solid ${active ? 'transparent' : 'rgba(0,230,118,0.1)'}`, transition: 'all 0.14s', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${bank?.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>{bank?.emoji}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: active ? bank?.color : 'var(--text-primary)', marginBottom: '1px' }}>{bank?.label}</p>
                      <p style={{ fontSize: '9px', color: 'rgba(165,214,167,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.accountNumber}</p>
                    </div>
                    {active && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: bank?.color, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
            <button onClick={() => navigate('/dashboard/settings', { state: { tab: 'pagos' } })}
              style={{ marginTop: '6px', background: 'none', border: 'none', color: 'rgba(0,230,118,0.4)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}>
              <MdSettings size={10} /> Gestionar
            </button>
          </>
        )}
      </div>

      {/* ══ COL B: Info + Formulario ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
        <div className="glass-card" style={{ padding: '14px 16px', flexShrink: 0, height: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: `${selectedBank?.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: `1px solid ${selectedBank?.color}30`, flexShrink: 0 }}>{selectedBank?.emoji}</div>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: selectedBank?.color, marginBottom: '2px' }}>{selectedBank?.label}</p>
                  <span style={{ fontSize: '9px', padding: '1px 7px', borderRadius: '999px', background: `${selectedBank?.color}18`, color: selectedBank?.color, border: `1px solid ${selectedBank?.color}22`, fontWeight: '700', textTransform: 'uppercase' }}>{selectedBank?.type}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px' }}>
                <DL icon={<MdPerson size={10}/>}               k="Titular"         v={selected.ownerName} />
                <DL icon={<MdBadge size={10}/>}                k="NIT/CC"          v={selected.nit} />
                <DL icon={<MdPhone size={10}/>}                k={selectedBank?.accountLabel} v={selected.accountNumber} />
                <DL icon={<MdAccountBalanceWallet size={10}/>} k="Saldo retirable" v={`$${balance.toLocaleString()}`} green />
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '28px', marginBottom: '6px' }}>🏦</p>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>Selecciona una cuenta</p>
              <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.35)' }}>La información aparecerá aquí</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ ...SL, marginBottom: '0' }}>Solicitar retiro</p>
          {submitted && (
            <div className="fade-in" style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.28)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--green-primary)', fontSize: '12px', flexShrink: 0 }}>
              <MdCheckCircle size={14}/> Solicitud enviada. El admin la revisará pronto.
            </div>
          )}
          {noAccounts ? (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Conecta una cuenta primero.</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: '500' }}>
                  Monto (COP) — disponible:{' '}
                  <span style={{ color: 'var(--green-primary)', fontWeight: '800' }}>${balance.toLocaleString()}</span>
                </p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,230,118,0.6)', fontSize: '15px', fontWeight: '700' }}>$</span>
                  <input className="input-dark"
                    style={{ width: '100%', padding: '11px 12px 11px 28px', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px' }}
                    placeholder="0" type="number" min="10000"
                    value={amount} onChange={e => { setAmount(e.target.value); setError('') }} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flexShrink: 0 }}>
                {QUICK.map(q => {
                  const active = Number(amount) === q
                  return (
                    <button key={q} type="button" onClick={() => { setAmount(String(q)); setError('') }}
                      style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.12s', background: active ? 'rgba(0,230,118,0.18)' : 'rgba(0,0,0,0.28)', border: `1px solid ${active ? 'rgba(0,230,118,0.45)' : 'rgba(0,230,118,0.12)'}`, color: active ? 'var(--green-primary)' : 'var(--text-secondary)' }}>
                      {fmtQ(q)}
                    </button>
                  )
                })}
                <button type="button" onClick={() => { setAmount(String(balance)); setError('') }}
                  style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', background: Number(amount) === balance ? 'rgba(0,230,118,0.18)' : 'rgba(0,0,0,0.28)', border: `1px solid ${Number(amount) === balance ? 'rgba(0,230,118,0.45)' : 'rgba(0,230,118,0.12)'}`, color: Number(amount) === balance ? 'var(--green-primary)' : 'var(--text-secondary)' }}>
                  Todo
                </button>
              </div>
              {error && (
                <div style={{ background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)', borderRadius: '8px', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '5px', color: '#ef5350', fontSize: '11px', flexShrink: 0 }}>
                  <MdWarning size={12}/> {error}
                </div>
              )}
              {selected && amount && !error && (
                <div className="fade-in" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,230,118,0.1)', borderRadius: '8px', padding: '8px 10px', flexShrink: 0 }}>
                  <p style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', marginBottom: '4px' }}>Resumen</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{selectedBank?.emoji} {selectedBank?.label} · {selected.accountNumber}</p>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--green-primary)' }}>${Number(amount).toLocaleString()} COP</p>
                </div>
              )}
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ padding: '11px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginTop: 'auto', flexShrink: 0, borderRadius: '11px', opacity: loading ? 0.75 : 1 }}>
                <MdAccountBalanceWallet size={17}/> {loading ? 'Enviando...' : 'Solicitar retiro'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ══ COL C: Historial ══ */}
      <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <p style={SL}>Historial de retiros</p>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '24px' }}>Sin retiros aún.</p>
          ) : history.map(row => {
            const bank = BANK_CATALOG.find(b => b.id === row.bankId)
            const cfg  = STATUS_CFG[row.status] || STATUS_CFG.pending
            const Icon = cfg.icon
            return (
              <div key={row.id} onClick={() => setDetailItem(row)}
                style={{ padding: '10px 11px', borderRadius: '9px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,230,118,0.07)', cursor: 'pointer', transition: 'border-color 0.14s', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,230,118,0.07)')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '14px' }}>{bank?.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{bank?.label || row.bankLabel}</span>
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--green-primary)' }}>${Number(row.amount).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '9px', color: 'rgba(165,214,167,0.38)' }}>{row.accountNumber} · {new Date(row.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: cfg.bg, color: cfg.color, borderRadius: '999px', padding: '2px 7px', fontSize: '9px', fontWeight: '700', border: `1px solid ${cfg.color}22` }}>
                    <Icon size={9}/> {cfg.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal detalle */}
      {detailItem && (
        <div onClick={() => setDetailItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} className="glass-card fade-in" style={{ width: '100%', maxWidth: '420px', padding: '22px 24px', position: 'relative' }}>
            <button onClick={() => setDetailItem(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}>×</button>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Detalles del retiro</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <DetailRow label="Banco"   value={BANK_CATALOG.find(b => b.id === detailItem.bankId)?.label || detailItem.bankLabel || '—'} />
              <DetailRow label="Cuenta"  value={detailItem.accountNumber} />
              <DetailRow label="Titular" value={detailItem.ownerName} />
              <DetailRow label="Monto"   value={`$${Number(detailItem.amount).toLocaleString()}`} />
              <DetailRow label="Fecha"   value={new Date(detailItem.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })} />
              <DetailRow label="Estado"  value={STATUS_CFG[detailItem.status]?.label} color={STATUS_CFG[detailItem.status]?.color} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const SL = {
  fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', flexShrink: 0,
}

function DL({ icon, k, v, green }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', color: 'rgba(165,214,167,0.38)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        <span style={{ color: 'rgba(0,230,118,0.3)' }}>{icon}</span>{k}
      </span>
      <span style={{ fontSize: green ? '12px' : '10px', fontWeight: green ? '800' : '500', color: green ? 'var(--green-primary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  )
}

function DetailRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span style={{ fontSize: '11px', color: 'rgba(165,214,167,0.5)' }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: '700', color: color || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
