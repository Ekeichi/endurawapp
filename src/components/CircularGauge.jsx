import { useEffect, useRef, useState } from 'react'

export default function CircularGauge({ score, color = '#F97316', size = 200, label }) {
  const radius = (size - 24) / 2
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75
  const targetOffset = arcLength - (score / 100) * arcLength

  const [animatedOffset, setAnimatedOffset] = useState(arcLength)
  const [displayScore, setDisplayScore] = useState(0)
  const rafRef = useRef(null)
  const startTimeRef = useRef(null)
  const duration = 1000

  useEffect(() => {
    startTimeRef.current = null
    const startOffset = arcLength
    const startScore = 0

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      setAnimatedOffset(startOffset + (targetOffset - startOffset) * eased)
      setDisplayScore(Math.round(startScore + (score - startScore) * eased))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [score])

  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-225deg)' }}
      >
        {/* Background arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={12}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {displayScore}
        </span>
        {label && (
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: color,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
