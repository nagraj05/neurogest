import styles from './GestureDebug.module.css'

const GESTURE_ICONS = {
  isDrawing:   { icon: '✍️', label: 'Draw' },
  isFist:      { icon: '✊', label: 'Fist' },
  isOpenHand:  { icon: '🖐️', label: 'Open' },
  isPinching:  { icon: '🤏', label: 'Pinch' },
  isPeaceSign: { icon: '✌️', label: 'Peace' },
}

function HandPanel({ side, gesture }) {
  if (!gesture) return null

  const activeGestures = Object.entries(GESTURE_ICONS).filter(
    ([key]) => gesture[key]
  )

  return (
    <div className={styles.hand}>
      <div className={styles.handLabel}>{side === 'left' ? '← L' : 'R →'}</div>

      <div className={styles.gestures}>
        {Object.entries(GESTURE_ICONS).map(([key, { icon, label }]) => (
          <div
            key={key}
            className={`${styles.gesture} ${gesture[key] ? styles.active : ''}`}
          >
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
          </div>
        ))}
      </div>

      {/* Peace sign hold progress bar */}
      {gesture.isPeaceSign && gesture.peaceSignProgress > 0 && (
        <div className={styles.peaceBar}>
          <div
            className={styles.peaceBarFill}
            style={{ width: `${gesture.peaceSignProgress * 100}%` }}
          />
          <span className={styles.peaceBarLabel}>
            {gesture.peaceSignProgress >= 1 ? 'Undo!' : 'Hold…'}
          </span>
        </div>
      )}

      {activeGestures.length === 0 && (
        <div className={styles.noGesture}>—</div>
      )}

      <div className={styles.coords}>
        tip ({gesture.indexTip.x.toFixed(2)}, {gesture.indexTip.y.toFixed(2)})
      </div>
    </div>
  )
}

export default function GestureDebug({ leftGesture, rightGesture, twoHandGesture }) {
  return (
    <div className={styles.panel}>
      <HandPanel side="left"  gesture={leftGesture} />
      <div className={styles.divider} />
      <HandPanel side="right" gesture={rightGesture} />
      {twoHandGesture?.isTwoHandPinch && (
        <div className={styles.twoHand}>
          🤏🤏 two-hand pinch · spread Δ {twoHandGesture.twoHandSpreadDelta.toFixed(4)}
        </div>
      )}
    </div>
  )
}
