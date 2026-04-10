import styles from './GestureHintBar.module.css'

function gestureInfo(gesture, hasHand) {
  if (!hasHand) return null
  if (gesture.isPinching)  return { icon: '🤏', label: 'Pinch' }
  if (gesture.isPeaceSign) return { icon: '✌️',  label: 'Peace' }
  if (gesture.isDrawing)   return { icon: '✍️',  label: 'Draw'  }
  if (gesture.isOpenHand)  return { icon: '🖐️',  label: 'Open'  }
  if (gesture.isFist)      return { icon: '✊',  label: 'Fist'  }
  return { icon: '🤚', label: 'Ready' }
}

function HandChip({ side, gesture, hasHand }) {
  const info = gestureInfo(gesture, hasHand)
  if (!info) return null

  return (
    <span className={`${styles.chip} ${styles[side]}`}>
      <span className={styles.chipIcon}>{info.icon}</span>
      <span className={styles.chipLabel}>{side === 'left' ? 'L' : 'R'}: {info.label}</span>
    </span>
  )
}

export default function GestureHintBar({ leftGesture, rightGesture, hands }) {
  const hasLeft  = !!hands?.left
  const hasRight = !!hands?.right

  if (!hasLeft && !hasRight) return null

  return (
    <div className={styles.bar}>
      <HandChip side="left"  gesture={leftGesture}  hasHand={hasLeft}  />
      <HandChip side="right" gesture={rightGesture} hasHand={hasRight} />
    </div>
  )
}
