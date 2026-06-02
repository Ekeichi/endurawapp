// Antoine Boubée
import { useRef, useState } from 'react'

const RADIUS = 110
const ITEM_H = 36
const ANGLE_STEP = (ITEM_H / RADIUS) * (180 / Math.PI)
const VIEWPORT_H = 200

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function WheelColumn({ items, selectedIndex, onChange }) {
  const [dragOffset, setDragOffset] = useState(0)
  const [snapping, setSnapping] = useState(false)
  const startY  = useRef(null)
  const startOff = useRef(0)

  const getY = (e) => (e.touches ? e.touches[0].clientY : e.clientY)

  function onStart(e) {
    e.preventDefault()
    startY.current  = getY(e)
    startOff.current = dragOffset
    setSnapping(false)
  }
  function onMove(e) {
    if (startY.current === null) return
    const dy = getY(e) - startY.current
    setDragOffset(startOff.current - dy / ITEM_H)
  }
  function onEnd() {
    if (startY.current === null) return
    startY.current = null
    const newIdx = clamp(Math.round(selectedIndex + dragOffset), 0, items.length - 1)
    onChange(newIdx)
    setDragOffset(0)
    setSnapping(true)
  }

  const effIdx    = selectedIndex + dragOffset
  const drumAngle = effIdx * ANGLE_STEP

  return (
    <div
      style={{
        height: VIEWPORT_H,
        overflow: 'hidden',
        position: 'relative',
        perspective: `${RADIUS * 3.5}px`,
        perspectiveOrigin: '50% 50%',
        cursor: 'ns-resize',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={onStart}
      onMouseMove={onMove}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0, right: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${drumAngle}deg)`,
          transition: snapping
            ? 'transform 0.28s cubic-bezier(0.23, 1, 0.32, 1)'
            : 'none',
          willChange: 'transform',
        }}
        onTransitionEnd={() => setSnapping(false)}
      >
        {items.map((label, i) => {
          const itemAngle = -i * ANGLE_STEP
          const faceAngle = (effIdx - i) * ANGLE_STEP
          const abs = Math.abs(faceAngle)
          if (abs > 85) return null

          const brightness = Math.max(0, 1 - abs / 65)
          const fontSize   = abs < 10 ? 22 : abs < 25 ? 18 : 14

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: -ITEM_H / 2,
                left: 0, right: 0,
                height: ITEM_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotateX(${itemAngle}deg) translateZ(${RADIUS}px)`,
                backfaceVisibility: 'hidden',
                fontFamily: 'Inter, sans-serif',
                fontSize,
                fontWeight: abs < 10 ? 700 : 400,
                color: `rgba(28,28,46,${brightness.toFixed(2)})`,
                pointerEvents: 'none',
              }}
            >
              {label}
            </div>
          )
        })}
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, transparent 38%, transparent 62%, rgba(255,255,255,0.35) 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />

      <div style={{
        position: 'absolute',
        top: '50%', left: 0, right: 0,
        height: ITEM_H,
        marginTop: -ITEM_H / 2,
        borderTop: '1px solid rgba(28,28,46,0.12)',
        borderBottom: '1px solid rgba(28,28,46,0.12)',
        pointerEvents: 'none', zIndex: 3,
      }} />
    </div>
  )
}

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

export default function TimeWheelPicker({ value = '23:00', onChange, label }) {
  const [hStr, mStr] = value.split(':')
  const hIdx = parseInt(hStr, 10)
  const mIdx = parseInt(mStr, 10)

  return (
    <div>
      {label && (
        <p style={{
          color: 'rgba(28,28,46,0.5)', fontSize: 11, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          margin: '0 0 8px', fontFamily: 'Inter, sans-serif',
        }}>
          {label}
        </p>
      )}
      <div style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(255,255,255,0.35)',
        borderRadius: 20,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
      }}>
        <div style={{ flex: 1 }}>
          <WheelColumn
            items={HOURS}
            selectedIndex={hIdx}
            onChange={(i) => onChange(`${String(i).padStart(2,'0')}:${mStr}`)}
          />
        </div>
        <span style={{
          color: 'rgba(28,28,46,0.5)',
          fontSize: 26, fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          paddingBottom: 3, flexShrink: 0,
          userSelect: 'none',
        }}>:</span>
        <div style={{ flex: 1 }}>
          <WheelColumn
            items={MINUTES}
            selectedIndex={mIdx}
            onChange={(i) => onChange(`${hStr}:${String(i).padStart(2,'0')}`)}
          />
        </div>
      </div>
    </div>
  )
}
