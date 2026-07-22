import { useNavigate } from 'react-router-dom'
import {
  MdArrowForward, MdSell, MdAccountBalanceWallet,
  MdVerified, MdNotifications, MdSupportAgent, MdTrendingUp, MdShoppingCart,
} from 'react-icons/md'

const FEATURES = [
  { icon: MdShoppingCart,         color: '#00e676', bg: 'rgba(0,230,118,0.1)',   title: 'Compra fácil',          desc: 'Encuentra objetos a los mejores precios.' },
  { icon: MdSell,                 color: '#64b5f6', bg: 'rgba(100,181,246,0.1)', title: 'Vende rápido',          desc: 'El dinero llega directo a tu Nequi.' },
  { icon: MdAccountBalanceWallet, color: '#ffa726', bg: 'rgba(255,167,38,0.1)',  title: 'Recargas al instante',  desc: 'Nequi, Bancolombia, Daviplata.' },
  { icon: MdTrendingUp,           color: '#ce93d8', bg: 'rgba(206,147,216,0.1)', title: 'Gana revendiendo',      desc: 'Compra barato, vende más caro.' },
  { icon: MdNotifications,        color: '#69f0ae', bg: 'rgba(105,240,174,0.1)', title: 'Alertas en tiempo real',desc: 'Notificaciones de ventas y recargas.' },
  { icon: MdSupportAgent,         color: '#f48fb1', bg: 'rgba(244,143,177,0.1)', title: 'Soporte 24/7',          desc: 'Chat directo con el administrador.' },
]

const STATS = [
  { value: '12k+',  label: 'Usuarios activos',   color: '#00e676' },
  { value: '48k+',  label: 'Objetos vendidos',    color: '#64b5f6' },
  { value: '$2.4B', label: 'COP transaccionados', color: '#ffa726' },
  { value: '99%',   label: 'Pagos exitosos',      color: '#ce93d8' },
]

/* Tarjetas flotantes en círculo — se alejan del texto */
const ORBIT_CARDS = [
  { emoji: '📱', cat: 'Electrónica',  price: '$320k',   color: '#00e676', angle: 0   },
  { emoji: '💻', cat: 'Computadores', price: '$1.2M',   color: '#64b5f6', angle: 60  },
  { emoji: '🎮', cat: 'Gaming',       price: '$450k',   color: '#ce93d8', angle: 120 },
  { emoji: '⌚', cat: 'Accesorios',   price: '$180k',   color: '#ffa726', angle: 180 },
  { emoji: '📷', cat: 'Fotografía',   price: '$890k',   color: '#f48fb1', angle: 240 },
  { emoji: '🎧', cat: 'Audio',        price: '$210k',   color: '#69f0ae', angle: 300 },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden', overflowY: 'auto' }}>
      <style>{`
        @keyframes orbit {
          from { transform: rotate(var(--start)) translateX(var(--r)) rotate(calc(-1 * var(--start))); }
          to   { transform: rotate(calc(var(--start) + 360deg)) translateX(var(--r)) rotate(calc(-1 * (var(--start) + 360deg))); }
        }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes glow-dot { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .orbit-card { animation: orbit 20s linear infinite; }
        .orbit-card:nth-child(2)  { animation-delay:-3.3s; }
        .orbit-card:nth-child(3)  { animation-delay:-6.6s; }
        .orbit-card:nth-child(4)  { animation-delay:-10s; }
        .orbit-card:nth-child(5)  { animation-delay:-13.3s; }
        .orbit-card:nth-child(6)  { animation-delay:-16.6s; }
        .hero-btn:hover { transform: translateY(-2px) !important; }
      `}</style>

      {/* ══ NAVBAR ══ */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(10,15,13,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,230,118,0.1)', padding:'0 6%', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'20px', fontWeight:900, background:'linear-gradient(135deg,#00e676,#00c853)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.5px' }}>Bazar</span>
          <span style={{ fontSize:'9px', color:'rgba(0,230,118,0.5)', letterSpacing:'2px', textTransform:'uppercase', fontWeight:600, alignSelf:'flex-end', marginBottom:'3px' }}>marketplace</span>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={() => navigate('/auth')}
            style={{ padding:'8px 18px', borderRadius:'10px', background:'transparent', border:'1px solid rgba(0,230,118,0.25)', color:'var(--green-primary)', cursor:'pointer', fontSize:'13px', fontWeight:600, transition:'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,230,118,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            Iniciar sesión
          </button>
          <button onClick={() => navigate('/auth')} className="btn-primary"
            style={{ padding:'8px 18px', fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', gap:'6px' }}>
            Crear cuenta <MdArrowForward size={14}/>
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section style={{ position:'relative', minHeight:'92vh', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'40px', padding:'60px 6%', overflow:'hidden' }}>

        {/* Fondos */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 70% at 50% 40%,rgba(0,230,118,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'-120px', left:'-120px', width:'500px', height:'500px', background:'radial-gradient(circle,rgba(0,230,118,0.04) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-100px', right:'-100px', width:'400px', height:'400px', background:'radial-gradient(circle,rgba(100,181,246,0.04) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

        {/* Texto izquierda */}
        <div style={{ flex:'0 0 auto', maxWidth:'520px', zIndex:2 }}>
          {/* Badge animado */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'6px 14px', borderRadius:'999px', background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.3)', marginBottom:'28px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', animation:'glow-dot 2s ease-in-out infinite', display:'inline-block' }} />
            <span style={{ fontSize:'12px', color:'#00e676', fontWeight:600 }}>🇨🇴 Colombia · Marketplace #1</span>
          </div>

          <h1 style={{ fontSize:'clamp(36px,5vw,68px)', fontWeight:900, lineHeight:1.08, letterSpacing:'-2px', color:'var(--text-primary)', marginBottom:'18px' }}>
            Compra, vende<br/>
            <span style={{ background:'linear-gradient(135deg,#00e676 0%,#00c853 50%,#69f0ae 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>y gana dinero</span>
          </h1>
          
          <p style={{ fontSize:'17px', color:'rgba(165,214,167,0.6)', lineHeight:1.75, marginBottom:'36px', maxWidth:'480px' }}>
            El marketplace colombiano donde puedes comprar y vender objetos de segunda mano, recibir pagos instantáneos y gestionar tu dinero desde un solo lugar.
          </p>

          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            <button onClick={() => navigate('/auth')} className="btn-primary hero-btn"
              style={{ padding:'14px 28px', fontSize:'16px', fontWeight:700, display:'flex', alignItems:'center', gap:'8px', borderRadius:'12px', transition:'all 0.2s' }}>
              Empezar gratis <MdArrowForward size={18}/>
            </button>
            <button onClick={() => navigate('/auth')} className="hero-btn"
              style={{ padding:'14px 28px', fontSize:'16px', fontWeight:600, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(0,230,118,0.2)', borderRadius:'12px', color:'var(--text-primary)', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(0,230,118,0.08)'; e.currentTarget.style.borderColor='rgba(0,230,118,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor='rgba(0,230,118,0.2)' }}>
              Ver marketplace
            </button>
          </div>

          {/* Trust */}
          <div style={{ display:'flex', gap:'18px', marginTop:'36px', flexWrap:'wrap' }}>
            {[{ icon: MdVerified, t:'Pagos seguros' }, { icon: MdSupportAgent, t:'Soporte 24/7' }].map((b,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <b.icon size={15} style={{ color:'#00e676' }}/>
                <span style={{ fontSize:'12px', color:'rgba(165,214,167,0.45)', fontWeight:500 }}>{b.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjetas en órbita circular — lado derecho, sin tapar texto */}
        <div style={{ flex:'0 0 360px', height:'360px', position:'relative', zIndex:2 }}>
          {/* Círculo decorativo */}
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px dashed rgba(0,230,118,0.12)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'320px', height:'320px' }} />
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'60px', height:'60px', borderRadius:'50%', background:'rgba(0,230,118,0.08)', border:'1px solid rgba(0,230,118,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>
            🛒
          </div>

          {/* Centro */}
          <div style={{ position:'absolute', top:'50%', left:'50%', width:'0', height:'0' }}>
            {ORBIT_CARDS.map((c, i) => {
              const rad    = (c.angle * Math.PI) / 180
              const radius = 150
              const x      = Math.cos(rad) * radius
              const y      = Math.sin(rad) * radius
              return (
                <div key={i} style={{
                  position:'absolute',
                  left: x - 48,
                  top:  y - 36,
                  width:'96px', height:'72px',
                  borderRadius:'14px',
                  background:`${c.color}12`,
                  border:`1px solid ${c.color}35`,
                  backdropFilter:'blur(10px)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px',
                  animation:`floatY ${5 + i * 0.5}s ease-in-out infinite`,
                  animationDelay:`${i * 0.6}s`,
                  cursor:'default',
                  transition:'transform 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
                  <span style={{ fontSize:'20px', filter:`drop-shadow(0 2px 6px ${c.color}60)` }}>{c.emoji}</span>
                  <span style={{ fontSize:'8px', color:c.color, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase' }}>{c.cat}</span>
                  <span style={{ fontSize:'10px', fontWeight:800, color:'var(--text-primary)' }}>{c.price}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ padding:'50px 6%', borderTop:'1px solid rgba(0,230,118,0.08)', borderBottom:'1px solid rgba(0,230,118,0.08)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px', maxWidth:'900px', margin:'0 auto' }}>
          {STATS.map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <p style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color:s.color, margin:0, letterSpacing:'-1px' }}>{s.value}</p>
              <p style={{ fontSize:'12px', color:'rgba(165,214,167,0.4)', marginTop:'4px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section style={{ padding:'80px 6%' }}>
        <div style={{ textAlign:'center', marginBottom:'50px' }}>
          <h2 style={{ fontSize:'clamp(22px,4vw,38px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-1px', marginBottom:'12px' }}>
            Todo lo que necesitas en <span style={{ color:'var(--green-primary)' }}>un solo lugar</span>
          </h2>
          <p style={{ fontSize:'15px', color:'rgba(165,214,167,0.45)', maxWidth:'460px', margin:'0 auto', lineHeight:1.7 }}>
            Diseñado para colombianos que quieren mover su dinero rápido y seguro.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'18px', maxWidth:'980px', margin:'0 auto' }}>
          {FEATURES.map((f,i) => (
            <div key={i}
              style={{ padding:'26px 22px', borderRadius:'18px', background:'rgba(15,26,20,0.6)', border:`1px solid ${f.color}18`, backdropFilter:'blur(10px)', transition:'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=f.color+'40'; e.currentTarget.style.boxShadow=`0 16px 48px ${f.color}10` }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=f.color+'18'; e.currentTarget.style.boxShadow='none' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'14px', border:`1px solid ${f.color}30` }}>
                <f.icon size={20} style={{ color:f.color }}/>
              </div>
              <h3 style={{ fontSize:'15px', fontWeight:700, color:'var(--text-primary)', marginBottom:'7px' }}>{f.title}</h3>
              <p style={{ fontSize:'13px', color:'rgba(165,214,167,0.45)', lineHeight:1.7, margin:0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ padding:'80px 6%', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 80% at 50% 50%,rgba(0,230,118,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', maxWidth:'540px', margin:'0 auto' }}>
          <div style={{ fontSize:'48px', marginBottom:'18px', animation:'floatY 3s ease-in-out infinite' }}>🚀</div>
          <h2 style={{ fontSize:'clamp(22px,4vw,36px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-1px', marginBottom:'12px' }}>
            ¿Listo para empezar?
          </h2>
          <p style={{ fontSize:'15px', color:'rgba(165,214,167,0.45)', marginBottom:'30px', lineHeight:1.7 }}>
            Únete a miles de colombianos que ya compran y venden en Bazar. Es gratis.
          </p>
          <button onClick={() => navigate('/auth')} className="btn-primary"
            style={{ padding:'15px 34px', fontSize:'17px', fontWeight:800, borderRadius:'13px', display:'inline-flex', alignItems:'center', gap:'10px' }}>
            Crear cuenta gratis <MdArrowForward size={20}/>
          </button>
        </div>
      </section>

      {/* ══ PERFIL ADMIN + ABOUT ══ */}
      <section style={{ padding:'0 6% 70px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', maxWidth:'900px', margin:'0 auto' }}>

          {/* Card perfil admin */}
          <div style={{ padding:'28px 26px', borderRadius:'20px', background:'rgba(15,26,20,0.65)', border:'1px solid rgba(0,230,118,0.12)', backdropFilter:'blur(12px)', display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Avatar + nombre */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0 }}>
                👑
              </div>
              <div>
                <p style={{ margin:0, fontSize:'16px', fontWeight:800, color:'var(--text-primary)' }}>Admin</p>
                <p style={{ margin:'2px 0 0', fontSize:'11px', color:'rgba(0,230,118,0.5)', fontWeight:600, letterSpacing:'0.5px' }}>@admin · Administrador</p>
              </div>
              <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'999px', background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.2)' }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', display:'inline-block' }} />
                <span style={{ fontSize:'10px', color:'#00e676', fontWeight:700 }}>En línea</span>
              </div>
            </div>

            {/* Descripción */}
            <p style={{ margin:0, fontSize:'13px', color:'rgba(165,214,167,0.55)', lineHeight:1.75 }}>
              Gestor y fundador de Bazar. Responsable de aprobar recargas, gestionar el inventario y garantizar una experiencia de compra y venta segura para todos los usuarios.
            </p>

            {/* Stats rápidas */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              {[
                { label:'Usuarios', value:'12k+', color:'#00e676' },
                { label:'Productos', value:'48k+', color:'#64b5f6' },
                { label:'Soporte', value:'24/7',   color:'#ffa726' },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:'center', padding:'10px 6px', borderRadius:'12px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(0,230,118,0.07)' }}>
                  <p style={{ margin:0, fontSize:'16px', fontWeight:900, color:s.color }}>{s.value}</p>
                  <p style={{ margin:'2px 0 0', fontSize:'9px', color:'rgba(165,214,167,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card About Bazar */}
          <div style={{ padding:'28px 26px', borderRadius:'20px', background:'rgba(15,26,20,0.65)', border:'1px solid rgba(0,230,118,0.12)', backdropFilter:'blur(12px)', display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'rgba(0,230,118,0.1)', border:'1px solid rgba(0,230,118,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', flexShrink:0 }}>
                🛒
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <p style={{ margin:0, fontSize:'16px', fontWeight:900, background:'linear-gradient(135deg,#00e676,#00c853)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Bazar</p>
                  <span style={{ fontSize:'8px', color:'rgba(0,230,118,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontWeight:700 }}>marketplace</span>
                </div>
                <p style={{ margin:'2px 0 0', fontSize:'11px', color:'rgba(165,214,167,0.45)' }}>Colombia 🇨🇴 · Desde 2026</p>
              </div>
            </div>

            {/* Sobre nosotros */}
            <div>
              <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:700, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.8px' }}>¿A qué nos dedicamos?</p>
              <p style={{ margin:0, fontSize:'13px', color:'rgba(165,214,167,0.55)', lineHeight:1.75 }}>
                Bazar es una plataforma colombiana de compra y venta de objetos de segunda mano. Conectamos compradores y vendedores, facilitamos pagos digitales y ofrecemos herramientas para gestionar tu dinero de forma rápida y segura.
              </p>
            </div>

            {/* Valores */}
            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
              {[
                { icon:'⚡', label:'Transacciones instantáneas vía Nequi, Bancolombia y Daviplata' },
                { icon:'🔒', label:'Plataforma segura con verificación de cuentas' },
                { icon:'💬', label:'Soporte directo con el administrador en tiempo real' },
              ].map((v,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                  <span style={{ fontSize:'14px', flexShrink:0, marginTop:'1px' }}>{v.icon}</span>
                  <span style={{ fontSize:'12px', color:'rgba(165,214,167,0.5)', lineHeight:1.6 }}>{v.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop:'1px solid rgba(0,230,118,0.08)', padding:'28px 6%' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px', marginBottom:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ fontSize:'18px', fontWeight:900, background:'linear-gradient(135deg,#00e676,#00c853)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Bazar</span>
            <span style={{ fontSize:'9px', color:'rgba(0,230,118,0.4)', letterSpacing:'2px', textTransform:'uppercase', fontWeight:600 }}>marketplace</span>
          </div>
          <div style={{ display:'flex', gap:'20px' }}>
            {['Términos','Privacidad','Soporte'].map(t => (
              <span key={t} style={{ fontSize:'12px', color:'rgba(165,214,167,0.3)', cursor:'pointer', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color='#00e676'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(165,214,167,0.3)'}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
          <p style={{ fontSize:'11px', color:'rgba(165,214,167,0.2)', margin:0 }}>© 2026 Bazar · Colombia 🇨🇴 · Todos los derechos reservados</p>
          <p style={{ fontSize:'11px', color:'rgba(165,214,167,0.2)', margin:0, fontWeight:700, letterSpacing:'0.5px' }}>CREADO POR BRIXNN338</p>
        </div>
      </footer>
    </div>
  )
}
