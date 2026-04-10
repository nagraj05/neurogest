import { useRef, useState, useEffect } from 'react'
import DebugOverlay from './DebugOverlay.jsx'
import styles from './HandCamera.module.css'

// Compute video element opacity from props — handled in JS so inline style
// takes priority over any CSS cascade.
function videoOpacity({ debugMode, cameraMode }) {
  if (debugMode || cameraMode === 'on')  return 1
  if (cameraMode === 'dim') return 0.4
  return 0 // 'off'
}

export default function HandCamera({ videoRef, hands, status, debugMode, showSkeleton, cameraMode = 'off' }) {
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ width: 1280, height: 720 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDims({ width: el.offsetWidth, height: el.offsetHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showOverlay    = debugMode || showSkeleton
  const containerVisible = debugMode || showSkeleton || cameraMode !== 'off'
  const opacity        = videoOpacity({ debugMode, cameraMode })

  return (
    <div
      ref={containerRef}
      className={[
        styles.container,
        containerVisible ? styles.visible : '',
        showSkeleton && !debugMode ? styles.skeletonOnly : '',
      ].join(' ')}
    >
      {/* Video always rendered for inference; opacity controls visibility */}
      <video
        ref={videoRef}
        className={styles.video}
        style={{ opacity }}
        playsInline
        muted
      />

      {showOverlay && status === 'ready' && (
        <DebugOverlay hands={hands} width={dims.width} height={dims.height} />
      )}
    </div>
  )
}
