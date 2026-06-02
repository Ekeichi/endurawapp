// Antoine Boubée
import { useState } from 'react'
import PastilleSelector from './PastilleSelector'
import TimeWheelPicker from './TimeWheelPicker'

const TOTAL_STEPS = 5

const screens = [
  {
    key: 'fatigue',
    title: 'Comment tu te sens physiquement ?',
    subtitle: 'Bien-être général',
    count: 7,
    labels: ['Très mal', 'Très bien'],
    autoAdvance: true,
  },
  {
    key: 'douleurs',
    title: 'Comment sont tes jambes ?',
    subtitle: 'Sensations musculaires',
    count: 7,
    labels: ['Très lourdes', 'Légères'],
    autoAdvance: true,
  },
  {
    key: 'sommeil',
    title: 'Comment as-tu dormi ?',
    subtitle: 'Qualité du sommeil',
    count: 7,
    labels: ['Très mal', 'Très bien'],
    autoAdvance: false,
    hasSleep: true,
  },
  {
    key: 'stress',
    title: 'Quel est ton niveau de stress ?',
    subtitle: 'Stress perçu',
    count: 7,
    labels: ['Très stressé', 'Serein'],
    autoAdvance: true,
  },
  {
    key: 'motivation',
    title: 'Comment est ta motivation ?',
    subtitle: 'Motivation',
    count: 5,
    labels: ['Aucune', 'Maximale'],
    autoAdvance: false,
    isFinal: true,
  },
]

export default function CheckIn({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    fatigue: null,
    douleurs: null,
    sommeil: null,
    stress: null,
    motivation: null,
    bedtime: '23:00',
    waketime: '06:30',
  })

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100

  function handleChange(key, val) {
    const updated = { ...answers, [key]: val }
    setAnswers(updated)

    const screen = screens[step]
    if (screen.autoAdvance) {
      setTimeout(() => {
        setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
      }, 400)
    }
  }

  function handleContinue() {
    if (screens[step].isFinal) {
      onComplete(answers)
    } else {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  const canContinue = () => {
    const screen = screens[step]
    if (screen.key === 'sommeil') {
      return answers.sommeil !== null
    }
    if (screen.isFinal) {
      return answers.motivation !== null
    }
    return true
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 4,
          backgroundColor: 'rgba(28,28,46,0.1)',
          width: '100%',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: '#F97316',
            width: `${progressPercent}%`,
            transition: 'width 0.35s ease',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleBack}
          aria-label="Retour"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: step === 0 ? 0 : 1,
            pointerEvents: step === 0 ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(28,28,46,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span
          style={{
            color: 'rgba(28,28,46,0.45)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {step + 1} / {TOTAL_STEPS}
        </span>

        <div style={{ width: 32 }} />
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {screens.map((screen, i) => (
          <div
            key={screen.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 24px 32px',
              transform: `translateX(${(i - step) * 100}%)`,
              transition: i === step
                ? 'transform 0.3s ease, visibility 0s 0s'
                : 'transform 0.3s ease, visibility 0s 0.35s',
              pointerEvents: i === step ? 'auto' : 'none',
              visibility: i === step ? 'visible' : 'hidden',
            }}
          >
            <div style={{ marginBottom: 40 }}>
              <h1
                style={{
                  color: '#1C1C2E',
                  fontSize: 28,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {screen.title}
              </h1>
              <p
                style={{
                  color: 'rgba(28,28,46,0.5)',
                  fontSize: 16,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {screen.subtitle}
              </p>
            </div>

            <PastilleSelector
              count={screen.count}
              value={answers[screen.key]}
              onChange={(val) => handleChange(screen.key, val)}
              labels={screen.labels}
            />

            {screen.hasSleep && (
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <div style={{ flex: 1 }}>
                  <TimeWheelPicker
                    label="Coucher"
                    value={answers.bedtime}
                    onChange={(v) => setAnswers((a) => ({ ...a, bedtime: v }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <TimeWheelPicker
                    label="Réveil"
                    value={answers.waketime}
                    onChange={(v) => setAnswers((a) => ({ ...a, waketime: v }))}
                  />
                </div>
              </div>
            )}

            {(screen.hasSleep || screen.isFinal) && (
              <button
                onClick={handleContinue}
                disabled={!canContinue()}
                style={{
                  marginTop: 40,
                  width: '100%',
                  height: 56,
                  backgroundColor: canContinue() ? '#F97316' : 'rgba(28,28,46,0.1)',
                  color: canContinue() ? '#FFFFFF' : 'rgba(28,28,46,0.3)',
                  border: 'none',
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  cursor: canContinue() ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (canContinue()) e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onTouchStart={(e) => {
                  if (canContinue()) e.currentTarget.style.transform = 'scale(0.98)'
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {screen.isFinal ? 'Voir mon score' : 'Continuer'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
