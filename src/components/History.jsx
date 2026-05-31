import { useState, useRef, useEffect } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts'

// Three-tier state colouring:
//   green  → pic_de_forme, forme_montante, surcompensation, recuperation
//   orange → accumulation, forme_stable
//   red    → surmenage, fatigue_latente
const etatColors = {
  pic_de_forme: '#22C55E',
  forme_montante: '#22C55E',
  surcompensation: '#22C55E',
  recuperation: '#22C55E',
  accumulation: '#F97316',
  forme_stable: '#F97316',
  surmenage: '#EF4444',
  fatigue_latente: '#EF4444',
}

const etatLabels = {
  forme_stable: 'Forme stable',
  forme_montante: 'Forme montante',
  accumulation: 'Accumulation',
  fatigue_latente: 'Fatigue latente',
  surmenage: 'Surmenage',
  recuperation: 'Récupération',
  surcompensation: 'Surcompensation',
  pic_de_forme: 'Pic de forme',
}

// Subjective signals, weighted as in the DRS engine. `good` maps each raw
// daily value to a 0..1 score (1 = best). A signal's "drag" is weight*(1-good).
// `arrow` shows the direction the metric moved in the unfavourable sense:
//   ↓ = quality dropped (sleep, motivation), ↑ = load rose (fatigue, pain, stress).
const SIGNALS = [
  { key: 'sommeil',    label: 'Sommeil',    arrow: '↓', weight: 0.30, good: (d) => (7 - d.qualite_sommeil) / 6 },
  { key: 'fatigue',    label: 'Fatigue',    arrow: '↑', weight: 0.25, good: (d) => (7 - d.fatigue_generale) / 6 },
  { key: 'douleurs',   label: 'Douleurs',   arrow: '↑', weight: 0.20, good: (d) => (7 - d.douleurs_musculaires) / 6 },
  { key: 'motivation', label: 'Motivation', arrow: '↓', weight: 0.15, good: (d) => (d.motivation - 1) / 4 },
  { key: 'stress',     label: 'Stress',     arrow: '↑', weight: 0.10, good: (d) => (7 - d.stress_percu) / 6 },
]

const SIGNAL_PHRASE = {
  sommeil: 'le sommeil',
  fatigue: 'la fatigue',
  douleurs: 'les douleurs',
  motivation: 'la motivation',
  stress: 'le stress',
}

const MONTHS_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
const DAY_MS = 86400000

function fmtDate(d) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function topDragging(d, n = 2) {
  return SIGNALS
    .map((s) => ({ key: s.key, label: s.label, arrow: s.arrow, drag: s.weight * (1 - s.good(d)) }))
    .sort((a, b) => b.drag - a.drag)
    .slice(0, n)
}

const glass = {
  background: 'rgba(255,255,255,0.35)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 24,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
}

// Floating glass card shown on tap, positioned above (or below) the point.
function FloatingTip({ sel }) {
  const { d, cardX, py } = sel
  const below = py < 96 // flip under the point when too close to the top
  const translate = below ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))'
  const color = etatColors[d.etat] || '#F97316'

  return (
    <div
      className="curve-tip"
      style={{
        position: 'absolute',
        left: cardX,
        top: py,
        transform: translate,
        transformOrigin: below ? 'top center' : 'bottom center',
        ['--tip-translate']: translate,
        ...glass,
        borderRadius: 16,
        padding: '12px 16px',
        fontFamily: 'Inter, sans-serif',
        minWidth: 150,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <p style={{ color: 'rgba(28,28,46,0.5)', fontSize: 12, margin: '0 0 4px' }}>{d.label}</p>
      <p style={{ color: '#1C1C2E', fontSize: 28, fontWeight: 800, margin: '0 0 4px', lineHeight: 1 }}>
        {d.score.toFixed(0)}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: d.top2?.length ? 10 : 0 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{etatLabels[d.etat] || d.etat}</span>
      </div>
      {d.top2 && d.top2.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {d.top2.map((s) => (
            <span
              key={s.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(28,28,46,0.06)',
                color: '#1C1C2E',
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: 8,
              }}
            >
              {s.label}
              <span style={{ color: '#EF4444', fontWeight: 700 }}>{s.arrow}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function History({ data }) {
  const [sel, setSel] = useState(null)
  const chartRef = useRef(null)

  // Dismiss the floating tooltip when tapping anywhere outside the chart.
  useEffect(() => {
    if (!sel) return
    const onDocClick = (ev) => {
      if (chartRef.current && !chartRef.current.contains(ev.target)) setSel(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [sel])

  // Tap on a curve point → select it (ignore empty space / missing days).
  const handleChartClick = (e) => {
    if (e && e.activePayload && e.activePayload.length && e.activeCoordinate) {
      const d = e.activePayload.map((p) => p.payload).find((p) => p && !p.missing && p.score != null)
      if (d) {
        const width = chartRef.current?.clientWidth ?? 320
        const cardX = Math.min(Math.max(e.activeCoordinate.x, 92), width - 92)
        setSel({ d, cardX, px: e.activeCoordinate.x, py: e.activeCoordinate.y })
        return
      }
    }
    setSel(null)
  }

  // --- Build a continuous daily timeline so missing days create real gaps ---
  const present = data.map((d) => {
    const dateObj = new Date(d.date)
    return {
      ...d,
      dateObj,
      score: d.rrs_daily,
      top2: topDragging(d),
    }
  })

  const firstMs = present[0].dateObj.getTime()
  present.forEach((p) => {
    p.t = Math.round((p.dateObj.getTime() - firstMs) / DAY_MS)
  })

  const lastT = present[present.length - 1].t
  const byT = new Map(present.map((p) => [p.t, p]))
  const tToWeek = new Map(present.map((p) => [p.t, p.semaine]))

  // Full series including null-score placeholders for missing calendar days.
  const fullData = []
  for (let t = 0; t <= lastT; t++) {
    const p = byT.get(t)
    if (p) {
      fullData.push({
        t,
        date: p.date,
        label: fmtDate(p.dateObj),
        score: p.score,
        etat: p.etat,
        tss: p.tss,
        top2: p.top2,
        missing: false,
      })
    } else {
      const dateObj = new Date(firstMs + t * DAY_MS)
      fullData.push({ t, label: fmtDate(dateObj), score: null, tss: null, missing: true })
    }
  }

  const lastPresentT = present[present.length - 1].t

  // --- Gaps: dashed bridge + hollow placeholder dots (not interpolated values) ---
  const bridges = []
  const missingDots = []
  for (let i = 0; i < present.length - 1; i++) {
    const a = present[i]
    const b = present[i + 1]
    if (b.t - a.t > 1) {
      bridges.push({ a, b })
      for (let t = a.t + 1; t < b.t; t++) {
        const y = a.score + (b.score - a.score) * ((t - a.t) / (b.t - a.t))
        missingDots.push({ t, y })
      }
    }
  }

  // --- Badge anchors: first day of each contiguous run of a key state ---
  // --- Week tick positions on the shared time axis ---
  const weekTicks = []
  const seenWeeks = new Set()
  for (const p of present) {
    if (!seenWeeks.has(p.semaine)) {
      seenWeeks.add(p.semaine)
      weekTicks.push(p.t)
    }
  }

  // --- Weekly delta (avg DRS this week vs last) ---
  const weekOrder = []
  const seen2 = new Set()
  for (const p of present) {
    if (!seen2.has(p.semaine)) { seen2.add(p.semaine); weekOrder.push(p.semaine) }
  }
  const avgFor = (w) => {
    const xs = present.filter((p) => p.semaine === w).map((p) => p.score)
    return xs.reduce((a, b) => a + b, 0) / xs.length
  }
  const lastWeek = weekOrder[weekOrder.length - 1]
  const prevWeek = weekOrder[weekOrder.length - 2]
  const weekDelta = prevWeek ? Math.round(avgFor(lastWeek) - avgFor(prevWeek)) : 0

  // --- Weekly insight: which signal dragged most across the current week ---
  const lastWeekDays = present.filter((p) => p.semaine === lastWeek)
  const dragTotals = {}
  for (const d of lastWeekDays) {
    for (const s of SIGNALS) {
      dragTotals[s.key] = (dragTotals[s.key] || 0) + s.weight * (1 - s.good(d))
    }
  }
  const worstSignal = Object.entries(dragTotals).sort((a, b) => b[1] - a[1])[0]?.[0]
  const weeklyInsight = worstSignal
    ? `Cette semaine, ${SIGNAL_PHRASE[worstSignal]} a le plus pesé.`
    : null

  // Y-domain bounds (shared by area + reference layers).
  const scores = present.map((p) => p.score)
  const yMin = Math.floor(Math.min(...scores) - 8)
  const maxTss = Math.max(...present.map((p) => p.tss), 1)

  // --- Key points (lowest / highest / today) ---
  const sorted = [...fullData.filter((d) => !d.missing)].sort((a, b) => a.score - b.score)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]
  const current = fullData.filter((d) => !d.missing).slice(-1)[0]
  const keyPoints = [
    { ...lowest, role: 'Point le plus bas' },
    { ...highest, role: 'Point le plus haut' },
    { ...current, role: "Aujourd'hui" },
  ].filter((v, i, arr) => arr.findIndex((x) => x.date === v.date) === i)

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        overflowY: 'auto',
        padding: '24px 16px 16px',
      }}
    >
      {/* Header with weekly delta pill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#1C1C2E', fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
            Historique
          </h1>
          <p style={{ color: 'rgba(28,28,46,0.5)', fontSize: 14, fontWeight: 400, margin: '4px 0 0' }}>
            5 dernières semaines
          </p>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: weekDelta >= 0 ? '#16A34A' : '#DC2626',
            fontSize: 13,
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            marginTop: 4,
          }}
        >
          {weekDelta >= 0 ? `+${weekDelta}` : weekDelta} cette semaine
        </div>
      </div>

      {/* Chart card: DRS curve + TSS bars on a shared time axis */}
      <div style={{ ...glass, marginBottom: 12, padding: '16px 8px 8px' }}>
        <div ref={chartRef} style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart
            data={fullData}
            margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
            onClick={handleChartClick}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.20} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="t" type="number" domain={[0, lastT]} hide />
            <YAxis hide domain={[yMin, 100]} />
            <Tooltip content={() => null} cursor={{ stroke: 'rgba(249,115,22,0.25)', strokeWidth: 1 }} />

            {/* Dashed bridges across missing days */}
            {bridges.map((g, i) => (
              <ReferenceLine
                key={`bridge-${i}`}
                segment={[
                  { x: g.a.t, y: g.a.score },
                  { x: g.b.t, y: g.b.score },
                ]}
                stroke="#F97316"
                strokeOpacity={0.5}
                strokeDasharray="4 4"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            ))}

            <Area
              type="monotone"
              dataKey="score"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              connectNulls={false}
              dot={(props) => {
                const { cx, cy, payload, index } = props
                if (cy == null || payload?.score == null) return <g key={`d-${index}`} />
                if (payload.t !== lastPresentT) return <g key={`d-${index}`} />
                return (
                  <g key={`d-${index}`}>
                    <circle cx={cx} cy={cy} r={14} fill="rgba(249,115,22,0.10)" />
                    <circle cx={cx} cy={cy} r={9} fill="rgba(249,115,22,0.20)" />
                    <circle cx={cx} cy={cy} r={5} fill="#F97316" stroke="white" strokeWidth={2.5} />
                  </g>
                )
              }}
              activeDot={false}
            />

            {/* Hollow placeholder dots for missing days (not real values) */}
            {missingDots.map((m, i) => (
              <ReferenceDot
                key={`miss-${i}`}
                x={m.t}
                y={m.y}
                r={4}
                fill="white"
                stroke="#F97316"
                strokeOpacity={0.6}
                strokeWidth={1.5}
                ifOverflow="extendDomain"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>

        {/* Selected-point highlight ring + floating glass card */}
        {sel && (
          <>
            <div
              style={{
                position: 'absolute',
                left: sel.px,
                top: sel.py,
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid #F97316',
                background: 'white',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 4px rgba(249,115,22,0.15)',
                pointerEvents: 'none',
                zIndex: 19,
              }}
            />
            <FloatingTip sel={sel} />
          </>
        )}
        </div>

        {/* TSS bars — same time axis, subdued */}
        <ResponsiveContainer width="100%" height={70}>
          <BarChart data={fullData} margin={{ top: 0, right: 12, left: 12, bottom: 0 }}>
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, lastT]}
              ticks={weekTicks}
              tickFormatter={(t) => tToWeek.get(t) ?? ''}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(28,28,46,0.40)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
            />
            <YAxis hide domain={[0, maxTss]} />
            <Bar dataKey="tss" fill="#64748B" fillOpacity={0.4} radius={[2, 2, 0, 0]} maxBarSize={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly insight line */}
      {weeklyInsight && (
        <p style={{ color: 'rgba(28,28,46,0.6)', fontSize: 14, fontWeight: 500, margin: '0 0 24px', paddingLeft: 4 }}>
          {weeklyInsight}
        </p>
      )}

      {/* Key points section */}
      <div>
        <h2 style={{ color: '#1C1C2E', fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>
          Points clés
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {keyPoints.map((point) => (
            <div
              key={point.date + point.role}
              style={{
                ...glass,
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: etatColors[point.etat] || '#F97316',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ color: '#1C1C2E', fontSize: 14, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
                    {etatLabels[point.etat] || point.etat}
                  </p>
                  <p style={{ color: 'rgba(28,28,46,0.5)', fontSize: 12, margin: '2px 0 0' }}>
                    {point.role}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#1C1C2E', fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                  {point.score.toFixed(1)}
                </p>
                <p style={{ color: 'rgba(28,28,46,0.5)', fontSize: 12, margin: '2px 0 0' }}>
                  {point.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
