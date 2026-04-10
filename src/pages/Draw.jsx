import { useRef, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHandTracking } from '../hooks/useHandTracking.js'
import { useGesture } from '../hooks/useGesture.js'
import { useTwoHandGesture } from '../hooks/useTwoHandGesture.js'
import { useDrawing } from '../features/draw/useDrawing.js'
import DrawCanvas from '../features/draw/DrawCanvas.jsx'
import DrawIntro from '../features/draw/DrawIntro.jsx'
import SidePanel from '../features/draw/SidePanel.jsx'
import HandCamera from '../components/HandCamera/HandCamera.jsx'
import CameraStatus from '../components/HandCamera/CameraStatus.jsx'
import GestureDebug from '../components/GestureDebug/GestureDebug.jsx'
import GestureHintBar from '../components/GestureHintBar/GestureHintBar.jsx'
import styles from './Draw.module.css'

const STROKES_KEY    = 'gesture-canvas-strokes'
const HAND_PREF_KEY  = 'gesture-draw-hand'

export default function Draw() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const debugMode = searchParams.get('debug') === '1'

  const canvasRef = useRef(null)

  const [showSkeleton, setShowSkeleton]   = useState(false)
  const [cameraMode, setCameraMode]       = useState('off')
  const [panelOpen, setPanelOpen]         = useState(true)

  function cycleCameraMode() {
    setCameraMode(m => m === 'off' ? 'on' : m === 'on' ? 'dim' : 'off')
  }

  // Always null on mount — DrawIntro shows every time
  const [drawingHand, setDrawingHand] = useState(null)

  function startDrawing(hand) {
    localStorage.setItem(HAND_PREF_KEY, hand)
    setDrawingHand(hand)
  }

  function switchHand(hand) {
    localStorage.setItem(HAND_PREF_KEY, hand)
    setDrawingHand(hand)
  }

  // Clear saved strokes when navigating away or closing the tab
  useEffect(() => {
    const clearStrokes = () => localStorage.removeItem(STROKES_KEY)
    window.addEventListener('beforeunload', clearStrokes)
    return () => {
      clearStrokes()
      window.removeEventListener('beforeunload', clearStrokes)
    }
  }, [])

  // Hand tracking
  const { videoRef, hands, status, loadingStep, errorMessage } = useHandTracking()
  const leftGesture    = useGesture(hands.left)
  const rightGesture   = useGesture(hands.right)
  const twoHandGesture = useTwoHandGesture(leftGesture, rightGesture)

  // Route gestures to drawing vs control roles based on user preference
  const drawingGesture = drawingHand === 'left' ? leftGesture : rightGesture
  const controlGesture = drawingHand === 'left' ? rightGesture : leftGesture

  // Three fingers on EITHER hand = toggle side panel (leading-edge detection)
  const prevThreeFingersRef = useRef({ draw: false, ctrl: false })
  useEffect(() => {
    if (!drawingHand) return
    const currDraw = drawingGesture.isThreeFingers
    const currCtrl = controlGesture.isThreeFingers
    const prev = prevThreeFingersRef.current
    if ((currDraw && !prev.draw) || (currCtrl && !prev.ctrl)) {
      setPanelOpen(v => !v)
    }
    prevThreeFingersRef.current = { draw: currDraw, ctrl: currCtrl }
  }, [drawingGesture, controlGesture, drawingHand])

  // Drawing state
  const {
    strokesRef,
    currentStrokeRef,
    particlesRef,
    clearProgressRef,
    dragStrokeIndexRef,
    brushConfig,
    setBrushConfig,
    strokeCount,
    exportPNG,
    undo,
    clearCanvas,
  } = useDrawing(drawingGesture, controlGesture)

  return (
    <div className={styles.shell}>
      <HandCamera
        videoRef={videoRef}
        hands={hands}
        status={status}
        debugMode={debugMode}
        showSkeleton={showSkeleton}
        cameraMode={cameraMode}
      />

      <CameraStatus status={status} loadingStep={loadingStep} message={errorMessage} />

      {/* Intro — shown every time until user clicks Start */}
      {status === 'ready' && !drawingHand && (
        <DrawIntro onStart={startDrawing} />
      )}

      {status === 'ready' && drawingHand && (
        <>
          <GestureHintBar leftGesture={leftGesture} rightGesture={rightGesture} hands={hands} />

          {/* Camera + skeleton controls */}
          <div className={styles.bottomLeft}>
            <button
              className={`${styles.topBtn} ${cameraMode !== 'off' ? styles.topBtnOn : ''}`}
              onClick={cycleCameraMode}
              title="Camera: off → on → dim"
            >
              📷 {cameraMode === 'off' ? 'Camera off' : cameraMode === 'on' ? 'Camera on' : 'Camera dim'}
            </button>
            <button
              className={`${styles.topBtn} ${showSkeleton ? styles.topBtnOn : ''}`}
              onClick={() => setShowSkeleton(v => !v)}
              title="Toggle hand outline"
            >
              ✋ {showSkeleton ? 'Hide' : 'Show'} hands
            </button>
          </div>

          <DrawCanvas
            ref={canvasRef}
            strokesRef={strokesRef}
            currentStrokeRef={currentStrokeRef}
            particlesRef={particlesRef}
            clearProgressRef={clearProgressRef}
            dragStrokeIndexRef={dragStrokeIndexRef}
            drawingGesture={drawingGesture}
            controlGesture={controlGesture}
          />

          <SidePanel
            brushConfig={brushConfig}
            setBrushConfig={setBrushConfig}
            strokeCount={strokeCount}
            onUndo={undo}
            onClear={clearCanvas}
            onExport={() => exportPNG(canvasRef.current)}
            drawingHand={drawingHand}
            onSwitchHand={switchHand}
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen(v => !v)}
          />

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
