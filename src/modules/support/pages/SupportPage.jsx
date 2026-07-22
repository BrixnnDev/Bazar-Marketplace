import { useState, useRef, useEffect } from 'react'
import { MdSend, MdSupportAgent, MdCircle } from 'react-icons/md'
import { useUser } from '../../../context/UserContext'

import API from '../../../config/api'
function getToken() { return localStorage.getItem('bazar_token') }

const FAQS = [
  { q: '¿Cómo recargo mi saldo?',      a: 'Ve a Recargas, llena el formulario y adjunta el comprobante.' },
  { q: '¿Cuánto tarda un retiro?',      a: 'Una vez aprobado por el admin, es inmediato en Nequi/Daviplata.' },
  { q: '¿Cómo vendo un producto?',      a: 'Primero cómpralo en el marketplace, luego ve a "Vender".' },
  { q: '¿Puedo retirar mis créditos?',  a: 'No. Los créditos solo sirven para comprar en el marketplace.' },
]

export default function SupportPage() {
  const { user } = useUser()
  const [msgs,   setMsgs]   = useState([])
  const [input,  setInput]  = useState('')
  const [openFaq, setFaq]   = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Cargar mensajes al montar y polling cada 3 s
  useEffect(() => {
    loadMsgs()
    const iv = setInterval(loadMsgs, 3000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  async function loadMsgs() {
    const token = getToken(); if (!token) return
    try {
      const res  = await fetch(`${API}/api/support/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setMsgs(data.messages || [])
    // eslint-disable-next-line no-empty
    } catch {}
  }

  async function send(txt) {
    const text = (txt ?? input).trim(); if (!text) return
    if (txt === undefined) setInput('')
    setSending(true)
    try {
      const token = getToken()
      await fetch(`${API}/api/support/my`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text }),
      })
      await loadMsgs()
    // eslint-disable-next-line no-empty
    } catch {}
    setSending(false)
  }

  return (
    <div className="fade-in" style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '10px', overflow: 'hidden' }}>

      {/* ── CHAT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'rgba(0,230,118,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,230,118,0.2)' }}>
            <MdSupportAgent size={20} style={{ color: 'var(--green-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Soporte</h1>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00e676' }}>
              <MdCircle size={6} /> Chat en tiempo real con el administrador
            </span>
          </div>
        </div>

        {/* Sugerencias */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flexShrink: 0 }}>
          {['¿Cómo retiro?', '¿Cómo vendo?', 'Error en mi cuenta', 'Ayuda con recarga'].map(s => (
            <button key={s} onClick={() => send(s)}
              style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,230,118,0.15)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.08)'; e.currentTarget.style.color = 'var(--green-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Ventana mensajes */}
        <div className="glass-card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.4 }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Escribe tu mensaje al administrador</p>
              </div>
            )}
            {msgs.map(msg => {
              const isUser  = msg.from === 'user'
              const isAdmin = msg.from === 'admin'
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '7px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isAdmin ? 'rgba(206,147,216,0.18)' : 'rgba(100,181,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: isAdmin ? '14px' : '14px', border: `1px solid ${isAdmin ? 'rgba(206,147,216,0.3)' : 'rgba(100,181,246,0.2)'}` }}>
                      {isAdmin ? <MdSupportAgent size={14} style={{ color: '#ce93d8' }} /> : <span style={{ fontSize: '14px' }}>{user?.avatar || '👤'}</span>}
                    </div>
                    <div style={{ maxWidth: '75%', padding: '9px 14px', borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isUser ? 'rgba(0,230,118,0.14)' : 'rgba(206,147,216,0.12)', border: `1px solid ${isUser ? 'rgba(0,230,118,0.22)' : 'rgba(206,147,216,0.25)'}`, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                      {msg.text}
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', color: 'rgba(165,214,167,0.3)', marginTop: '3px', paddingLeft: isUser ? 0 : '35px', paddingRight: isUser ? '35px' : 0 }}>
                    {msg.time} · {isAdmin ? '👑 Admin' : user?.username}
                  </span>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,230,118,0.08)', display: 'flex', gap: '7px' }}>
            <input className="input-dark"
              style={{ flex: 1, padding: '9px 13px', fontSize: '13px' }}
              placeholder="Escribe tu mensaje al administrador..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              disabled={sending}
            />
            <button onClick={() => send()} className="btn-primary"
              style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', borderRadius: '9px', opacity: sending ? 0.7 : 1 }}
              disabled={sending}>
              <MdSend size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO: FAQs ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0, overflowY: 'auto' }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'transparent', margin: 0, userSelect: 'none' }}>S</h1>
          <p style={{ fontSize: '11px', color: 'transparent', userSelect: 'none' }}>x</p>
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', flexShrink: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,230,118,0.08)' }}>
            Preguntas frecuentes
          </p>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid rgba(0,230,118,0.06)' : 'none' }}>
              <button onClick={() => setFaq(openFaq === i ? null : i)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: openFaq === i ? 'var(--green-primary)' : 'var(--text-primary)', flex: 1 }}>{faq.q}</span>
                <span style={{ color: openFaq === i ? 'var(--green-primary)' : 'rgba(165,214,167,0.3)', flexShrink: 0, fontSize: '16px' }}>{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <p className="fade-in" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6', paddingBottom: '8px' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '14px 16px', flexShrink: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Tu sesión</p>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>👤 {user?.username}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--green-primary)' }}>{user?.code}</span>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
