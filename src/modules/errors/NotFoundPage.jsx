import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes float404{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}`}</style>

      {/* Glow */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 60% at 50% 40%,rgba(239,83,80,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      {/* Grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(239,83,80,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(239,83,80,0.04) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

      <div style={{ fontSize:'80px', animation:'float404 3s ease-in-out infinite', filter:'drop-shadow(0 0 30px rgba(239,83,80,0.4))' }}>🔍</div>

      <div>
        <h1 style={{ fontSize:'80px', fontWeight:900, color:'#ef5350', margin:0, letterSpacing:'-4px', lineHeight:1, textShadow:'0 0 40px rgba(239,83,80,0.4)' }}>404</h1>
        <h2 style={{ fontSize:'22px', fontWeight:700, color:'var(--text-primary)', marginTop:'8px', marginBottom:'8px' }}>Página no encontrada</h2>
        <p style={{ fontSize:'14px', color:'rgba(165,214,167,0.5)', maxWidth:'360px', lineHeight:1.7, margin:'0 auto' }}>
          La página que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
        </p>
      </div>

      <div style={{ display:'flex', gap:'12px', marginTop:'8px' }}>
        <button onClick={() => navigate(-1)}
          style={{ padding:'11px 22px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(0,230,118,0.2)', color:'var(--text-secondary)', cursor:'pointer', fontSize:'14px', fontWeight:600, transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,230,118,0.5)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='rgba(0,230,118,0.2)'}>
          ← Volver
        </button>
        <button onClick={() => navigate('/')} className="btn-primary"
          style={{ padding:'11px 22px', fontSize:'14px', fontWeight:700 }}>
          🏠 Ir al inicio
        </button>
      </div>

      <p style={{ fontSize:'11px', color:'rgba(165,214,167,0.2)', marginTop:'8px' }}>
        Bazar · marketplace colombiano
      </p>
    </div>
  )
}
