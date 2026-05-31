import { useState } from 'react'
import CheckIn from './components/CheckIn'
import DRSResult from './components/DRSResult'
import History from './components/History'
import BottomNav from './components/BottomNav'
import { historicalData } from './data/lucasData'
import { computeDRS, getStateInfo } from './utils/drs'

export default function App() {
  const [view, setView] = useState('checkin')
  const [drsData, setDrsData] = useState(null)

  const handleCheckInComplete = (answers) => {
    const result = computeDRS({
      fatigue: answers.fatigue,
      douleurs: answers.douleurs,
      sommeil: answers.sommeil,
      stress: answers.stress,
      motivation: answers.motivation,
    })
    setDrsData({ ...result, stateInfo: getStateInfo(result.state) })
    setView('result')
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* grain texture overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', opacity: 0.13 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <filter id="grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-filter)" />
        </svg>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: '100px', position: 'relative', zIndex: 1 }}>
        {view === 'checkin' && (
          <CheckIn onComplete={handleCheckInComplete} />
        )}
        {view === 'result' && drsData && (
          <DRSResult
            drsData={drsData}
            stateInfo={drsData.stateInfo}
            onRetake={() => setView('checkin')}
          />
        )}
        {view === 'result' && !drsData && (
          <CheckIn onComplete={handleCheckInComplete} />
        )}
        {view === 'history' && (
          <History data={historicalData} />
        )}
      </div>

      <BottomNav activeView={view} onNavigate={setView} />
    </div>
  )
}
