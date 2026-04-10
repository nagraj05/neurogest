import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHandTracking } from '../hooks/useHandTracking.js'
import { useGesture } from '../hooks/useGesture.js'
import { useTwoHandGesture } from '../hooks/useTwoHandGesture.js'
import SolarCanvas from '../features/solar/SolarCanvas.jsx'
import HandCamera from '../components/HandCamera/HandCamera.jsx'
import CameraStatus from '../components/HandCamera/CameraStatus.jsx'
import GestureDebug from '../components/GestureDebug/GestureDebug.jsx'
import HandModePicker from '../features/solar/HandModePicker.jsx'
import GestureHintBar from '../components/GestureHintBar/GestureHintBar.jsx'
import styles from './Solar.module.css'

const STORAGE_KEY = 'gesture-solar-hand-mode'

export default function Solar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const debugMode = searchParams.get('debug') === '1'

  const [showSkeleton, setShowSkeleton] = useState(false)
  const [handMode, setHandMode] = useState(() => localStorage.getItem(STORAGE_KEY) || null)

  const { videoRef, hands, status, loadingStep, errorMessage } = useHandTracking()
  const leftGesture    = useGesture(hands.left)
  const rightGesture   = useGesture(hands.right)
  const twoHandGesture = useTwoHandGesture(leftGesture, rightGesture)

  function pickMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode)
    setHandMode(mode)
  }

  // In one-hand mode, use whichever hand is currently detected (prefer right)
  const primaryGesture   = handMode === 'one'
    ? (hands.right ? rightGesture : leftGesture)
    : rightGesture
  const secondaryGesture = handMode === 'one'
    ? null
    : leftGesture

  return (
    <div className={styles.shell}>
      <HandCamera
        videoRef={videoRef}
        hands={hands}
        status={status}
        debugMode={debugMode}
        showSkeleton={showSkeleton}
      />

      <CameraStatus status={status} loadingStep={loadingStep} message={errorMessage} />

      {/* Hand mode picker — shown until user picks */}
      {status === 'ready' && !handMode && (
        <HandModePicker onPick={pickMode} />
      )}

      {status === 'ready' && handMode && (
        <>
          <SolarCanvas
            primaryGesture={primaryGesture}
            secondaryGesture={secondaryGesture}
            twoHandGesture={handMode === 'two' ? twoHandGesture : null}
          />

          <GestureHintBar leftGesture={leftGesture} rightGesture={rightGesture} hands={hands} />

          {/* Skeleton toggle */}
          <button
            className={`${styles.skeletonBtn} ${showSkeleton ? styles.skeletonBtnOn : ''}`}
            onClick={() => setShowSkeleton(v => !v)}
            title="Toggle hand outline"
          >
            ✋ {showSkeleton ? 'Hide' : 'Show'} hands
          </button>

          {/* Hand mode switcher */}
          <button
            className={styles.modeBtn}
            onClick={() => pickMode(handMode === 'one' ? 'two' : 'one')}
            title="Switch hand mode"
          >
            {handMode === 'one' ? '✋ One hand' : '🤲 Both hands'}
          </button>

          {/* Gesture hint strip */}
          <div className={styles.hints}>
            {handMode === 'one' ? (
              <>
                <span title="Pinch (touch thumb + index), then move hand">🤏 Pinch + drag — rotate</span>
                <span title="While pinching, slowly spread or close thumb and index">🤏 Spread fingers — zoom</span>
                <span title="Hold open palm toward camera for 1 second">🖐️ Open hand — reset view</span>
                <span title="Touch thumb to index fingertip briefly on a planet">👆 Quick pinch ON a planet — open details</span>
              </>
            ) : (
              <>
                <span title="Pinch right hand, then move">🤏 Right pinch + drag — rotate</span>
                <span title="Pinch both hands and spread them apart">🤲 Both pinch + spread — zoom</span>
                <span title="Hold open palm toward camera for 1 second">🖐️ Open hand — reset view</span>
                <span title="Quick pinch on a planet to open details">👆 Quick pinch ON planet — details</span>
              </>
            )}
          </div>

          {debugMode && (
            <GestureDebug
              leftGesture={leftGesture}
              rightGesture={rightGesture}
              twoHandGesture={twoHandGesture}
            />
          )}
        </>
      )}

      <button className={styles.back} onClick={() => navigate('/')}>← Back</button>
    </div>
  )
}
