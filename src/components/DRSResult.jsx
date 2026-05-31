import { useState, useEffect } from 'react'
import { historicalData, athleteProfile } from '../data/lucasData'

const GREEN = '#22C55E'
const ORANGE = '#F97316'
const RED = '#EF4444'
const CTL_MAX = 53.7 // historical max fitness, mirrors drs.js

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

function Sparkline({ data, color, width = 110, height = 34, highlightLast = false }) {
  const W = width, H = height, pad = 4
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * (W - pad * 2) + pad,
    H - ((v - min) / range) * (H - pad * 2) - pad,
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width={W} height={H} style={{ overflow: 'visible', display: 'block' }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {highlightLast && (
        <>
          <circle cx={last[0]} cy={last[1]} r={6} fill={color} opacity={0.18} />
          <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} stroke="white" strokeWidth={1.5} />
        </>
      )}
    </svg>
  )
}

// Read-only pastille row (same dot system as the check-in): filled dots use
// the state colour, empty dots are neutral grey.
function ReadOnlyPastilles({ filled, total = 5, color }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: i < filled ? color : '#E5E7EB',
          }}
        />
      ))}
    </div>
  )
}

// Background gauge fill colour by DRS level.
function gaugeColor(v) {
  if (v < 40) return '#EF4444'
  if (v < 65) return '#F97316'
  if (v < 80) return '#86EFAC'
  return '#22C55E'
}

// Semicircular arc gauge that sits behind the score number. Animates the fill
// from 0 to the DRS value on mount via stroke-dashoffset.
function ArcGauge({ value }) {
  const R = 92, SW = 8, CX = 110, CY = 102
  const len = Math.PI * R
  const target = len * (1 - clamp(value, 0, 100) / 100)
  const [offset, setOffset] = useState(len)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOffset(target)))
    return () => cancelAnimationFrame(id)
  }, [target])
  const d = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  return (
    <svg viewBox="0 0 220 112" width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={SW} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={gaugeColor(value)}
        strokeWidth={SW}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 800ms ease-out' }}
      />
    </svg>
  )
}

function formatDateFr(date) {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`
}

export default function DRSResult({ drsData, stateInfo, onRetake }) {
  const previousScore = historicalData[historicalData.length - 1].rrs_daily
  const delta = Math.round(drsData.score) - Math.round(previousScore)

  const today = new Date()
  const dateLabel = formatDateFr(today)

  const { score, fitness, fatigueRatio, s_subj } = drsData
  const { label, comment, color } = stateInfo

  // Personal average DRS across history, for the "Moyenne" readout.
  const personalAvg = Math.round(
    historicalData.reduce((sum, d) => sum + d.rrs_daily, 0) / historicalData.length
  )
  const aboveAvg = Math.round(score) >= personalAvg

  const glass = {
    background: 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 24,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  }

  // --- Lecture du jour: three read-only pastille rows ---
  const chargeFilled = clamp(Math.round(fatigueRatio * 5), 0, 5)
  const formeFilled = clamp(Math.round((fitness / CTL_MAX) * 5), 0, 5)
  const bienFilled = clamp(Math.round(s_subj * 5), 0, 5)

  const lectureRows = [
    {
      name: 'Charge',
      filled: chargeFilled,
      ...(chargeFilled >= 4
        ? { stateLabel: 'Élevée', color: RED }
        : chargeFilled === 3
        ? { stateLabel: 'Modérée', color: ORANGE }
        : { stateLabel: 'Légère', color: GREEN }),
    },
    {
      name: 'Forme',
      filled: formeFilled,
      ...(formeFilled >= 4
        ? { stateLabel: 'Solide', color: GREEN }
        : formeFilled === 3
        ? { stateLabel: 'Correcte', color: ORANGE }
        : { stateLabel: 'Faible', color: RED }),
    },
    {
      name: 'Bien-être',
      filled: bienFilled,
      ...(bienFilled >= 4
        ? { stateLabel: 'Bon', color: GREEN }
        : bienFilled === 3
        ? { stateLabel: 'Moyen', color: ORANGE }
        : { stateLabel: 'Bas', color: RED }),
    },
  ]

  // --- 5-day DRS trend (4 historical days + today) ---
  const trendData = [...historicalData.slice(-4).map((d) => d.rrs_daily), score]

  return (
    <div
      style={{
        height: '100%',
        overflow: 'hidden',
        padding: '16px 20px 12px',
        fontFamily: 'Inter, sans-serif',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(28,28,46,0.45)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {dateLabel}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#1C1C2E',
            }}
          >
            Bonjour {athleteProfile.name}
          </div>
        </div>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
      </div>

      {/* 2. Hero score card */}
      <div
        style={{
          ...glass,
          padding: '16px 16px 18px',
          marginBottom: 12,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Arc gauge with the score number centered inside it */}
        <div style={{ position: 'relative', width: 220, maxWidth: '100%', margin: '0 auto' }}>
          <ArcGauge value={Math.round(score)} />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              top: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ fontSize: 64, fontWeight: 800, color: '#1C1C2E', lineHeight: 1 }}>
                {Math.round(score)}
              </div>
              {/* Delta pill */}
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  right: -42,
                  background: delta >= 0 ? '#22C55E' : '#EF4444',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}
              >
                {delta >= 0 ? `+${delta}` : delta}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1C1C2E',
            marginTop: 4,
          }}
        >
          {label}
        </div>

        {/* Personal average */}
        <div style={{ fontSize: 12, color: 'rgba(28,28,46,0.5)', marginTop: 8 }}>
          Moyenne : {personalAvg}{' '}
          <span style={{ color: aboveAvg ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
            {aboveAvg ? '↑' : '↓'}
          </span>
        </div>
      </div>



      {/* 4. Insight card */}
      <div
        style={{
          ...glass,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: 'rgba(28,28,46,0.45)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Analyse
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#1C1C2E',
            lineHeight: 1.4,
            marginTop: 8,
          }}
        >
          {comment}
        </div>
      </div>

      {/* 5. Lecture du jour */}
      <div style={{ ...glass, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: 'rgba(28,28,46,0.45)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
          Lecture du jour
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lectureRows.map((row) => (
            <div key={row.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C2E', width: 72 }}>{row.name}</span>
              <ReadOnlyPastilles filled={row.filled} color={row.color} />
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color, width: 72, textAlign: 'right' }}>
                {row.stateLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. 5-day mini sparkline */}
      <div style={{ ...glass, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(28,28,46,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            Tendance 5 jours
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1C1C2E', marginTop: 6 }}>
            {Math.round(score)}
          </div>
        </div>
        <Sparkline data={trendData} color={ORANGE} width={120} height={70} highlightLast />
      </div>
    </div>
  )
}
