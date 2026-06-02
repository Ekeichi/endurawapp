// Antoine Boubée
import { useState, useEffect } from 'react'
import { historicalData, athleteProfile } from '../data/lucasData'
import { getStateInfo } from '../utils/drs'

const GREEN = '#22C55E'
const ORANGE = '#F97316'
const RED = '#EF4444'
const GRAY = '#9CA3AF'
const CTL_MAX = 53.7

const TODAY = '2026-06-08'

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

const WEEKDAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']
const MONTHS_SHORT = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'aoû.', 'sep.', 'oct.', 'nov.', 'déc.']

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function shortDate(dateStr) {
  const d = parseDate(dateStr)
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

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

function gaugeColor(v) {
  if (v < 40) return '#EF4444'
  if (v < 65) return '#F97316'
  if (v < 80) return '#86EFAC'
  return '#22C55E'
}

function ArcGauge({ value, dimmed }) {
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
      {!dimmed && (
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
      )}
    </svg>
  )
}

function Chevron({ dir }) {
  const points = dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1C1C2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points} />
    </svg>
  )
}

function buildLectureRows({ fatigueRatio, fitness, s_subj }) {
  const chargeFilled = clamp(Math.round(fatigueRatio * 5), 0, 5)
  const formeFilled = clamp(Math.round((fitness / CTL_MAX) * 5), 0, 5)
  const bienFilled = clamp(Math.round(s_subj * 5), 0, 5)
  return [
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
}

const PENDING_ROWS = [
  { name: 'Charge', filled: 0, stateLabel: '—', color: GRAY },
  { name: 'Forme', filled: 0, stateLabel: '—', color: GRAY },
  { name: 'Bien-être', filled: 0, stateLabel: '—', color: GRAY },
]

export default function DRSResult({ drsData }) {
  const dates = [...historicalData.map((d) => d.date), TODAY]
  const [selectedDate, setSelectedDate] = useState(TODAY)

  const idx = dates.indexOf(selectedDate)
  const isToday = selectedDate === TODAY
  const isFirst = idx <= 0
  const histIndex = historicalData.findIndex((d) => d.date === selectedDate)

  const pending = isToday && !drsData

  let model = null
  if (isToday && drsData) {
    model = {
      score: drsData.score,
      state: drsData.state,
      fitness: drsData.fitness,
      fatigueRatio: drsData.fatigueRatio,
      s_subj: drsData.s_subj,
      prevScore: historicalData[historicalData.length - 1].rrs_daily,
      trend: [...historicalData.slice(-4).map((d) => d.rrs_daily), drsData.score],
    }
  } else if (!isToday) {
    const e = historicalData[histIndex]
    model = {
      score: e.rrs_daily,
      state: e.etat,
      fitness: e.ctl,
      fatigueRatio: e.atl_ctl_ratio,
      s_subj: e.s_subjectif,
      prevScore: histIndex > 0 ? historicalData[histIndex - 1].rrs_daily : null,
      trend: historicalData.slice(Math.max(0, histIndex - 4), histIndex + 1).map((d) => d.rrs_daily),
    }
  }

  const stateInfo = pending ? null : getStateInfo(model.state)
  const scoreNum = pending ? null : Math.round(model.score)
  const label = pending ? 'Check-in non complété' : stateInfo.label
  const comment = pending
    ? 'Complète ton check-in pour découvrir ton état du jour.'
    : stateInfo.comment
  const dotColor = pending ? GRAY : stateInfo.color

  const delta = !pending && model.prevScore != null ? scoreNum - Math.round(model.prevScore) : null

  const personalAvg = Math.round(
    historicalData.reduce((sum, d) => sum + d.rrs_daily, 0) / historicalData.length
  )
  const aboveAvg = !pending && scoreNum >= personalAvg

  const lectureRows = pending ? PENDING_ROWS : buildLectureRows(model)

  const trendData = pending ? historicalData.slice(-5).map((d) => d.rrs_daily) : model.trend
  const trendBig = Math.round(trendData[trendData.length - 1])

  const glass = {
    background: 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 24,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  }

  const navBtn = (disabled) => ({
    background: 'none',
    border: 'none',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.22 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
  })

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button
              onClick={() => setSelectedDate(dates[idx - 1])}
              disabled={isFirst}
              aria-label="Jour précédent"
              style={navBtn(isFirst)}
            >
              <Chevron dir="left" />
            </button>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1C1C2E',
                minWidth: 96,
                textAlign: 'center',
              }}
            >
              {isToday ? "Aujourd'hui" : shortDate(selectedDate)}
            </span>
            <button
              onClick={() => setSelectedDate(dates[idx + 1])}
              disabled={isToday}
              aria-label="Jour suivant"
              style={navBtn(isToday)}
            >
              <Chevron dir="right" />
            </button>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C2E' }}>
            Bonjour {athleteProfile.name}
          </div>
        </div>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          ...glass,
          padding: '16px 16px 18px',
          marginBottom: 12,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', width: 220, maxWidth: '100%', margin: '0 auto' }}>
          <ArcGauge value={pending ? 0 : scoreNum} dimmed={pending} />
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
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  color: pending ? GRAY : '#1C1C2E',
                  lineHeight: 1,
                }}
              >
                {pending ? '—' : scoreNum}
              </div>
              {delta != null && (
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
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: pending ? GRAY : '#1C1C2E',
            marginTop: 4,
          }}
        >
          {label}
        </div>

        {!pending && (
          <div style={{ fontSize: 12, color: 'rgba(28,28,46,0.5)', marginTop: 8 }}>
            Moyenne : {personalAvg}{' '}
            <span style={{ color: aboveAvg ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
              {aboveAvg ? '↑' : '↓'}
            </span>
          </div>
        )}
      </div>

      <div style={{ ...glass, padding: 16, marginBottom: 12 }}>
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
            color: pending ? 'rgba(28,28,46,0.5)' : '#1C1C2E',
            lineHeight: 1.4,
            marginTop: 8,
          }}
        >
          {comment}
        </div>
      </div>

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

      <div style={{ ...glass, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(28,28,46,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            Tendance 5 jours
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1C1C2E', marginTop: 6 }}>
            {trendBig}
          </div>
        </div>
        <Sparkline data={trendData} color={ORANGE} width={120} height={70} highlightLast />
      </div>
    </div>
  )
}
