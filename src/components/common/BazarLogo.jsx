/**
 * Logo de Bazar — letra B puntiaguda con bolsa de tienda integrada.
 * Usar con size (ancho en px). Por defecto 40.
 */
export default function BazarLogo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bazar-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00e676" />
          <stop offset="100%" stopColor="#00c853" />
        </linearGradient>
        <filter id="bazar-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Fondo hexagonal ── */}
      <path
        d="M50 4 L92 26 L92 74 L50 96 L8 74 L8 26 Z"
        fill="rgba(0,230,118,0.08)"
        stroke="rgba(0,230,118,0.35)"
        strokeWidth="1.5"
      />

      {/* ── Letra B puntiaguda ── */}
      {/*
        La B clásica tiene dos curvas pero aquí hacemos una B
        con vértice superior central puntiagudo (like a diamond top)
        y dos salientes redondeadas a la derecha.
      */}
      <g filter="url(#bazar-glow)">
        {/* Trazo vertical izquierdo de la B */}
        <path
          d="M28 20 L28 80"
          stroke="url(#bazar-grad)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Bump superior — vértice puntiagudo arriba */}
        <path
          d="M28 20 L53 12 L63 32 L28 50"
          fill="url(#bazar-grad)"
        />

        {/* Bump inferior — ligeramente más grande */}
        <path
          d="M28 50 L65 44 L72 62 L50 80 L28 80"
          fill="url(#bazar-grad)"
        />

        {/* Punto de vértice superior que sobresale */}
        <circle cx="53" cy="12" r="3.5" fill="var(--accent-primary)" />
      </g>

      {/* ── Mini bolsa de tienda en la esquina inferior derecha ── */}
      <g transform="translate(60, 60)">
        {/* Cuerpo de la bolsa */}
        <rect x="2" y="12" width="24" height="18" rx="3"
          fill="rgba(0,230,118,0.9)" />
        {/* Asa de la bolsa */}
        <path
          d="M8 12 C8 6 20 6 20 12"
          stroke="#00c853"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Línea decorativa en la bolsa */}
        <line x1="14" y1="17" x2="14" y2="24"
          stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}
