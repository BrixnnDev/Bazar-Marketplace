import { useState, useEffect, useRef } from 'react'
import { useUser } from '../../../context/UserContext'
import {
  MdAccountBalanceWallet, MdUploadFile, MdCheckCircle,
  MdWarning, MdClose, MdImage, MdReceipt,
} from 'react-icons/md'

import API from '../../../config/api'

const METHODS = [
  { value: 'nequi',       label: 'Nequi',       emoji: '💜' },
  { value: 'bancolombia', label: 'Bancolombia',  emoji: '🟡' },
  { value: 'daviplata',   label: 'Daviplata',    emoji: '🔴' },
  { value: 'efectivo',    label: 'Efectivo',     emoji: '💵' },
  { value: 'otro',        label: 'Otro',         emoji: '💳' },
]

const STATUS_CFG = {
  pending:  { label: 'Pendiente', color: '#ffa726', bg: 'rgba(255,167,38,0.12)' },
  approved: { label: 'Aprobada',  color: '#00e676', bg: 'rgba(0,230,118,0.12)' },
  denied:   { label: 'Rechazada', color: '#ef5350', bg: 'rgba(239,83,80,0.12)' },
}

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }
function getToken() { return localStorage.getItem('bazar_token') }

export default function RechargePage() {
  const { user } = useUser()

  const [method, setMethod]  = useState('nequi')  // sin selección visible
  const [accName, setAccName] = useState('')
  const [accNum,  setAccNum]  = useState('')
  const [amount,  setAmount]  = useState('')
  const [imgFile,    setImgFile]    = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const fileRef = useRef(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending,     setSending]     = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [error,       setError]       = useState('')

  const [myReqs, setMyReqs] = useState([])
  /* Carga solicitudes desde el servidor */
  useEffect(() => {
    loadMyRequests()
    // Polling cada 5 segundos para ver si el admin aprobó/rechazó
    const interval = setInterval(loadMyRequests, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  async function loadMyRequests() {
    const token = getToken()
    if (!token) return
    try {
      const res  = await fetch(`${API}/api/recharges/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setMyReqs(data.requests || [])
    } catch { /* servidor no disponible */ }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes.'); return }
    setImgFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(file)
    setError('')
  }

  function handleSolicitar() {
    setError('')
    if (!amount || Number(amount) <= 0)  { setError('Ingresa un monto válido.'); return }
    if (!accName.trim())                  { setError('El nombre de la cuenta es obligatorio.'); return }
    if (!accNum.trim())                   { setError('El número de cuenta es obligatorio.'); return }
    if (!imgFile)                         { setError('Debes adjuntar la captura del comprobante.'); return }
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    setSending(true)
    setError('')
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/recharges`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accountName:   accName,
          accountNumber: accNum,
          amount:        Number(amount),
          type:          'balance',
          method,
          imgPreview,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar.'); setSending(false); return }

      // Notificación local para el usuario
      const nToken = getToken()
      if (nToken) {
        fetch(`${API}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nToken}` },
          body: JSON.stringify({
            type:    'recarga',
            title:   'Solicitud de recarga enviada 📤',
            body:    `Solicitaste recargar $${Number(amount).toLocaleString('es-CO')} COP vía ${METHODS.find(m => m.value === method)?.label}.`,
            details: 'El administrador revisará tu solicitud pronto.',
          }),
        }).catch(() => {})
      }

      setSending(false)
      setConfirmOpen(false)
      setSuccessOpen(true)
      setAmount(''); setAccName(''); setAccNum(''); setMethod('nequi')
      setImgFile(null); setImgPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      await loadMyRequests()
      setTimeout(() => setSuccessOpen(false), 3000)
    } catch {
      setError('No se pudo contactar al servidor. Intenta de nuevo.')
      setSending(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', overflow: 'hidden' }}>

      {/* ══ COLUMNA IZQUIERDA — Solicitud ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>
            Recargas
          </h1>
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Envía tu comprobante y solicita la recarga al administrador.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflow: 'hidden' }}>
          <div>
            <p style={lbl}>ID de tu cuenta</p>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,230,118,0.12)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(165,214,167,0.4)' }}>No modificable · Asignado por el sistema</span>
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--green-primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {user?.code || '#B????????'}
              </span>
            </div>
          </div>

          {/* Nombre del titular */}
          <div>
            <p style={lbl}>Nombre del titular <Req /></p>
            <input className="input-dark" type="text" placeholder="Ej: Juan Pérez"
              value={accName} onChange={e => setAccName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }} />
          </div>

          <div>
            <p style={lbl}>Número de cuenta / teléfono <Req /></p>
            <input className="input-dark" type="text" placeholder="Ej: 300 123 4567"
              value={accNum} onChange={e => setAccNum(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }} />
          </div>

          <div>
            <p style={lbl}>Monto a recargar (COP) <Req /></p>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'rgba(0,230,118,0.5)', fontSize: '13px', fontWeight: 700, pointerEvents: 'none' }}>$</span>
              <input className="input-dark" type="text" inputMode="numeric" placeholder="0"
                value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                style={{ width: '100%', padding: '10px 58px 10px 26px', fontSize: '15px', fontWeight: 700 }} />
              <span style={{ position: 'absolute', right: '12px', fontSize: '11px', fontWeight: 700, color: 'rgba(165,214,167,0.45)', pointerEvents: 'none' }}>COP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ COLUMNA DERECHA — Adjunto + Historial ══ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: 'transparent', margin: 0, userSelect: 'none' }}>Recargas</h1>
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'transparent', userSelect: 'none' }}>placeholder</p>
        </div>

        {/* Adjuntar comprobante */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdUploadFile size={18} color="var(--green-primary)" /> Adjuntar comprobante
            </h3>
            <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.45)', marginTop: '3px' }}>
              La imagen es obligatoria para procesar tu solicitud
            </p>
          </div>

          <div onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${imgPreview ? 'rgba(0,230,118,0.45)' : 'rgba(0,230,118,0.18)'}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', minHeight: '130px', background: imgPreview ? 'rgba(0,230,118,0.05)' : 'rgba(0,0,0,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = imgPreview ? 'rgba(0,230,118,0.45)' : 'rgba(0,230,118,0.18)'}>
            {imgPreview ? (
              <>
                <img src={imgPreview} alt="comprobante" style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                <p style={{ fontSize: '11px', color: 'var(--green-primary)', fontWeight: 600 }}>
                  <MdCheckCircle size={13} style={{ verticalAlign: 'middle' }} /> {imgFile?.name}
                </p>
              </>
            ) : (
              <>
                <MdImage size={32} color="rgba(0,230,118,0.35)" />
                <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.5)', textAlign: 'center', lineHeight: '1.5' }}>
                  Haz clic para subir la captura<br /><span style={{ fontSize: '10px' }}>PNG, JPG, WEBP</span>
                </p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

          {error && (
            <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.28)', borderRadius: '9px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '7px', color: '#ef5350', fontSize: '12px' }}>
              <MdWarning size={14} /> {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleSolicitar}
            style={{ padding: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <MdAccountBalanceWallet size={18} /> Solicitar recarga
          </button>
        </div>

        {/* Mis solicitudes */}
        <div className="glass-card" style={{ padding: '14px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
            <MdReceipt size={15} color="var(--green-primary)" />
            Mis solicitudes
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(0,230,118,0.08)', padding: '2px 7px', borderRadius: '999px' }}>
              {myReqs.length}
            </span>
          </h3>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
            {myReqs.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'rgba(165,214,167,0.4)', textAlign: 'center', marginTop: '12px' }}>
                No has hecho solicitudes aún.
              </p>
            ) : myReqs.map(r => {
              const s = STATUS_CFG[r.status] || STATUS_CFG.pending
              const m = METHODS.find(x => x.value === r.method) || { emoji: '💳', label: r.method }
              return (
                <div key={r.id} style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,230,118,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>${fmt(r.amount)} COP</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.emoji} {m.label} · {r.accountName}
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(165,214,167,0.35)', marginTop: '2px' }}>
                      {new Date(r.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: s.bg, color: s.color, border: `1px solid ${s.color}30`, whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ MODAL CONFIRMACIÓN ══ */}
      {confirmOpen && (
        <div style={overlay} onClick={() => !sending && setConfirmOpen(false)}>
          <div className="glass-card fade-in" onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '440px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Confirmar solicitud</h2>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={sending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Cerrar"
              >
                <MdClose size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <RowData label="Tu cuenta"  value={user?.code} mono />
              <RowData label="Titular"    value={accName} />
              <RowData label="Número"     value={accNum} />
              <RowData label="Monto"      value={`$${fmt(amount)} COP`} highlight />
            </div>
            {imgPreview && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: 'rgba(165,214,167,0.45)', marginBottom: '8px' }}>Comprobante adjunto</p>
                <img src={imgPreview} alt="comprobante" style={{ maxWidth: '100%', maxHeight: '140px', borderRadius: '10px', border: '1px solid rgba(0,230,118,0.2)', objectFit: 'contain' }} />
              </div>
            )}
            {error && (
              <div style={{ background: 'rgba(239,83,80,0.1)', border: '1px solid rgba(239,83,80,0.28)', borderRadius: '9px', padding: '9px 12px', color: '#ef5350', fontSize: '12px' }}>
                ⚠️ {error}
              </div>
            )}
            <button className="btn-primary" onClick={handleConfirm} disabled={sending}
              style={{ padding: '13px', fontSize: '15px', fontWeight: 700, opacity: sending ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {sending ? <><span style={spinner} /> Enviando...</> : <><MdAccountBalanceWallet size={18} /> Solicitar</>}
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL ÉXITO ══ */}
      {successOpen && (
        <div style={overlay} onClick={() => setSuccessOpen(false)}>
          <div
            className="glass-card fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              padding: '36px 40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              maxWidth: '320px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSuccessOpen(false)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '14px',
                background: 'none',
                border: 'none',
                color: 'rgba(165,214,167,0.7)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Cerrar"
            >
              <MdClose size={20} />
            </button>

            <div style={{ fontSize: '52px' }}>✅</div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--green-primary)' }}>Enviado correctamente</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Tu solicitud fue enviada al administrador.<br />La revisará en breve.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

const lbl = { fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 500 }
function Req() { return <span style={{ color: '#ef5350', marginLeft: '2px' }}>*</span> }

function RowData({ label, value, mono, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(0,230,118,0.07)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: highlight ? '15px' : '13px', fontWeight: highlight ? 800 : 600, color: highlight ? 'var(--green-primary)' : 'var(--text-primary)', fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? '1px' : 'normal' }}>{value}</span>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }
const spinner = { display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(10,15,13,0.3)', borderTop: '2px solid #0a0f0d', animation: 'spin 0.7s linear infinite' }
