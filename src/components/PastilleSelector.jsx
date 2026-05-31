export default function PastilleSelector({ count, value, onChange, labels }) {
  return (
    <div className="w-full">
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        {Array.from({ length: count }, (_, i) => {
          const num = i + 1
          const isActive = value === num

          return (
            <button
              key={num}
              onClick={() => onChange(num)}
              style={{
                flex: '1 1 0',
                aspectRatio: '1',
                borderRadius: '50%',
                backgroundColor: isActive ? '#F97316' : 'rgba(255,255,255,0.5)',
                boxShadow: isActive ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 150ms ease, background-color 150ms ease',
                minWidth: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label={`Option ${num}`}
              aria-pressed={isActive}
            >
              {isActive ? (
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                  }}
                />
              ) : (
                <span
                  style={{
                    color: '#1C1C2E',
                    fontSize: 14,
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}
                >
                  {num}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {labels && labels.length >= 2 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <span
            style={{
              color: 'rgba(28,28,46,0.5)',
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {labels[0]}
          </span>
          <span
            style={{
              color: 'rgba(28,28,46,0.5)',
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {labels[labels.length - 1]}
          </span>
        </div>
      )}
    </div>
  )
}
