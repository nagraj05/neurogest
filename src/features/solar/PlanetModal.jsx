import { useEffect } from 'react'
import PlanetViewer from './PlanetViewer.jsx'
import styles from './PlanetModal.module.css'

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`

export default function PlanetModal({ planet, onClose }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        {/* Left: 3D viewer */}
        <div className={styles.viewer}>
          <PlanetViewer planet={planet} />
        </div>

        {/* Right: info */}
        <div className={styles.info}>
          <h2
            className={styles.name}
            style={{ color: hex(planet.color) }}
          >
            {planet.name}
          </h2>

          <div className={styles.stats}>
            <Stat label="Diameter"         value={planet.diameter} />
            <Stat label="Distance from Sun" value={planet.distanceFromSun} />
            <Stat label="Moons"            value={planet.moons} />
          </div>

          <div className={styles.block}>
            <h4 className={styles.blockTitle}>Atmosphere</h4>
            <p className={styles.blockText}>{planet.atmosphere}</p>
          </div>

          <div className={styles.block}>
            <h4 className={styles.blockTitle}>Fun fact</h4>
            <p className={styles.blockText}>{planet.funFact}</p>
          </div>

          <p className={styles.hint}>Drag the planet to rotate · Scroll to zoom</p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  )
}
