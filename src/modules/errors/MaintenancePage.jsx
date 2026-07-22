export default function MaintenancePage() {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0f0d', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px', padding:'24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-maint { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>

      {/* Glow */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 60% at 50% 40%,rgba(255,167,38,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,167,38,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,167,38,0.04) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

      {/* Ícono girando */}
      <div style={{ fontSize:'72px', animation:'spin-slow 4s linear infinite', filter:'drop-shadow(0 0 30px rgba(255,167,38,0.5))' }}>⚙️</div>

      <div>
        <h1 style={{ fontSize:'36px', fontWeight:900, color:'#ffa726', margin:0, letterSpacing:'-1px', textShadow:'0 0 30px rgba(255,167,38,0.4)' }}>
          En mantenimiento
        </h1>
        <h2 style={{ fontSize:'18px', fontWeight:600, color:'rgba(165,214,167,0.8)', marginTop:'10px', marginBottom:'10px' }}>
          Estamos mejorando Bazar para ti
        </h2>
        <p style={{ fontSize:'14px', color:'rgba(165,214,167,0.45)', maxWidth:'400px', lineHeight:1.8, margin:'0 auto' }}>
          La plataforma está temporalmente fuera de servicio por mantenimiento programado. Volvemos pronto.
        </p>
      </div>

      {/* Barra de progreso animada */}
      <div style={{ width:'280px', height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'999px', overflow:'hidden', marginTop:'8px' }}>
        <div style={{ width:'60%', height:'100%', background:'linear-gradient(90deg,#ffa726,#ffcc02)', borderRadius:'999px', animation:'pulse-maint 2s ease-in-out infinite' }} />
      </div>

      <p style={{ fontSize:'12px', color:'rgba(255,167,38,0.5)', display:'flex', alignItems:'center', gap:'6px' }}>
        <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ffa726', display:'inline-block', animation:'pulse-maint 1.5s ease-in-out infinite' }} />
        Sistema en proceso de actualización
      </p>

      <div style={{ marginTop:'16px', padding:'14px 24px', borderRadius:'12px', background:'rgba(255,167,38,0.08)', border:'1px solid rgba(255,167,38,0.2)' }}>
        <p style={{ margin:0, fontSize:'12px', color:'rgba(165,214,167,0.5)', lineHeight:1.7 }}>
          Si eres administrador, el sistema volverá al restaurar el servidor.<br/>
          <strong style={{ color:'#ffa726' }}>bxzaradmin@gmail.com</strong>
        </p>
      </div>

      <p style={{ fontSize:'11px', color:'rgba(165,214,167,0.2)', marginTop:'8px' }}>
        Bazar · marketplace colombiano 🇨🇴
      </p>
    </div>
  )
}
