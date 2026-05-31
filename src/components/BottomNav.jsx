const tabs = [
  {
    key: 'checkin',
    label: 'Check-in',
    // Pencil on a page — "saisir des données"
    Icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    key: 'result',
    label: 'Score',
    // Pulse / activité — "état du jour"
    Icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    key: 'history',
    label: 'Historique',
    // Axes + courbe — "données dans le temps"
    Icon: ({ color }) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 3 3 21 21 21" />
        <polyline points="7 15 11 9 15 12 19 6" />
      </svg>
    ),
  },
]

export default function BottomNav({ activeView, onNavigate }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: 360,
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 50,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        display: 'flex',
        alignItems: 'stretch',
        padding: '6px 8px',
        zIndex: 100,
      }}
    >
      {tabs.map(({ key, label, Icon }) => {
        const isActive = activeView === key
        const color = isActive ? '#F97316' : 'rgba(28,28,46,0.35)'
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: isActive ? 'rgba(249,115,22,0.12)' : 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              borderRadius: 40,
              transition: 'background 0.15s',
            }}
          >
            <Icon color={color} />
            <span
              style={{
                color,
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
