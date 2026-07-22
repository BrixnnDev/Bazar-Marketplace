import { useState, useRef, useEffect } from 'react'
import { MdSupportAgent, MdSend, MdCircle } from 'react-icons/md'

import API from '../../../config/api'
function getToken() { return localStorage.getItem('bazar_token') }

export default function AdminSupportPage() {
  const [sessions,  setSessions]  = useState([])
  const [activeId,  setActiveId]  = useState(null)
  const [msgs,      setMsgs]      = useState([])
  const [reply,     setReply]     = useState('')
  const [sending,   setSending]   = useState(false)
  const bottomRef  = useRef(null)
  const activeIdRef = useRef(null)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  /* ── Polling principal: sesiones cada 3 s, mensajes cada 2 s ── */
  useEffect(() => {
    let sessionIv, msgIv

    async function fetchSessions() {
      const token = getToken()
      if (!token) return
      try {
        const res  = await fetch(`${API}/api/support/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const list = data.sessions || []
        setSessions(list)
        // auto-seleccionar primera sesión
        if (!activeIdRef.current && list.length > 0) {
          setActiveId(list[0].session_id)
        }
      // eslint-disable-next-line no-empty
      } catch {}
    }

    async function fetchMsgs() {
      const id    = activeIdRef.current
      const token = getToken()
      if (!id || !token) return
      try {
        const res  = await fetch(`${API}/api/support/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setMsgs(data.messages || [])
      // eslint-disable-next-line no-empty
      } catch {}
    }

    // arrancar inmediatamente
    fetchSessions()
    fetchMsgs()

    sessionIv = setInterval(fetchSessions, 3000)
    msgIv     = setInterval(fetchMsgs,     2000)

    return () => {
      clearInterval(sessionIv)
      clearInterval(msgIv)
    }
  }, []) // un solo efecto que se monta una vez

  /* Resetear mensajes y cargar al cambiar sesión */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeId) { setMsgs([]); return }
    const token = getToken()
    if (!token) return
    fetch(`${API}/api/support/sessions/${activeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setMsgs(d?.messages || []))
      .catch(() => { setMsgs([]) })
  }, [activeId])

  /* Scroll al final al recibir mensajes nuevos */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  async function sendReply() {
    if (!reply.trim() || !activeId || sending) return
    setSending(true)
    try {
      const token = getToken()
      const res = await fetch(`${API}/api/support/sessions/${activeId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ text: reply.trim() }),
      })
      if (res.ok) {
        setReply('')
        // cargar mensajes actualizados
        const r2   = await fetch(`${API}/api/support/sessions/${activeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const d2 = await r2.json()
        setMsgs(d2.messages || [])
      }
    // eslint-disable-next-line no-empty
    } catch {}
    setSending(false)
  }

  const activeSession = sessions.find(s => s.session_id === activeId)
  const totalUnread   = sessions.reduce((n, s) => n + Number(s.unread || 0), 0)

  return (
    <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'rgba(206,147,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(206,147,216,0.25)' }}>
          <MdSupportAgent size={20} style={{ color: '#ce93d8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Soporte · Admin</h1>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Chat en tiempo real · actualiza cada 2 s
          </p>
        </div>
        {totalUnread > 0 && (
          <span style={{ background: '#ce93d8', color: '#0a0f0d', borderRadius: '999px', padding: '2px 12px', fontSize: '12px', fontWeight: 800 }}>
            {totalUnread} mensajes
          </span>
        )}
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>

        {/* ── LISTA DE SESIONES ── */}
        <div className="glass-card" style={{ width: '230px', flexShrink: 0, padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', flexShrink: 0 }}>
            Chats ({sessions.length})
          </p>

          {sessions.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.4, paddingTop: '20px' }}>
              <span style={{ fontSize: '32px' }}>💬</span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Sin mensajes aún
              </p>
            </div>
          ) : sessions.map(sess => {
            const isActive = activeId === sess.session_id
            const unread   = Number(sess.unread || 0)
            return (
              <button key={sess.session_id} onClick={() => setActiveId(sess.session_id)}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px', borderRadius: '10px', cursor: 'pointer', background: isActive ? 'rgba(206,147,216,0.15)' : 'rgba(0,0,0,0.2)', border: `1px solid ${isActive ? 'rgba(206,147,216,0.4)' : 'rgba(0,230,118,0.08)'}`, transition: 'all 0.15s', textAlign: 'left', width: '100%' }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{sess.user_avatar || '👤'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '12px', fontWeight: unread > 0 ? 700 : 500, color: isActive ? '#ce93d8' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {sess.username}
                    </p>
                    {unread > 0 && (
                      <span style={{ background: '#ce93d8', color: '#0a0f0d', borderRadius: '999px', padding: '1px 6px', fontSize: '9px', fontWeight: 800, flexShrink: 0, marginLeft: '4px' }}>
                        {unread}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '10px', color: 'rgba(165,214,167,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                    {sess.last_text ? (sess.last_text.length > 28 ? sess.last_text.slice(0, 28) + '…' : sess.last_text) : '—'}
                  </p>
                </div>
                {unread > 0 && <MdCircle size={7} style={{ color: '#ce93d8', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        {/* ── CHAT ── */}
        {!activeSession ? (
          <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', opacity: 0.4 }}>
            <span style={{ fontSize: '40px' }}>💬</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Selecciona un chat para responder</p>
          </div>
        ) : (
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Cabecera del chat */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,230,118,0.08)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '26px' }}>{activeSession.user_avatar || '👤'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {activeSession.username}
                </p>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#00e676' }}>
                  <MdCircle size={6} /> {activeSession.user_code}
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'rgba(165,214,167,0.3)', background: 'rgba(0,0,0,0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                {msgs.length} mensajes
              </span>
            </div>

            {/* Mensajes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.4 }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sin mensajes en esta sesión.</p>
                </div>
              )}
              {msgs.map(msg => {
                const isAdmin = msg.from === 'admin'
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '7px', flexDirection: isAdmin ? 'row-reverse' : 'row' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isAdmin ? 'rgba(206,147,216,0.18)' : 'rgba(100,181,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${isAdmin ? 'rgba(206,147,216,0.3)' : 'rgba(100,181,246,0.2)'}`, fontSize: '14px' }}>
                        {isAdmin ? <MdSupportAgent size={14} style={{ color: '#ce93d8' }} /> : <span>{activeSession.user_avatar || '👤'}</span>}
                      </div>
                      <div style={{ maxWidth: '75%', padding: '9px 14px', borderRadius: isAdmin ? '16px 4px 16px 16px' : '4px 16px 16px 16px', background: isAdmin ? 'rgba(206,147,216,0.14)' : 'rgba(100,181,246,0.1)', border: `1px solid ${isAdmin ? 'rgba(206,147,216,0.25)' : 'rgba(100,181,246,0.15)'}`, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.6', wordBreak: 'break-word' }}>
                        {msg.text}
                      </div>
                    </div>
                    <span style={{ fontSize: '9px', color: 'rgba(165,214,167,0.3)', marginTop: '3px', paddingLeft: isAdmin ? 0 : '35px', paddingRight: isAdmin ? '35px' : 0 }}>
                      {msg.time} · {isAdmin ? '👑 Admin' : activeSession.username}
                    </span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input respuesta */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,230,118,0.08)', display: 'flex', gap: '7px' }}>
              <input className="input-dark"
                style={{ flex: 1, padding: '9px 13px', fontSize: '13px' }}
                placeholder={`Responder a ${activeSession.username}...`}
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                disabled={sending}
              />
              <button onClick={sendReply} className="btn-primary"
                style={{ padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '9px', fontSize: '12px', opacity: sending ? 0.7 : 1 }}
                disabled={sending}>
                <MdSend size={14} /> Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
