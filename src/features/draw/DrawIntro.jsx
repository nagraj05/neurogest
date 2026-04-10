import { useState } from 'react'
import styles from './DrawIntro.module.css'

const HAND_PREF_KEY = 'gesture-draw-hand'

const GESTURES = {
  drawing: [
    { icon: '☝️', gesture: 'Index finger extended',     action: 'Pen down — draw stroke'  },
    { icon: '✊', gesture: 'Fist / lower index',         action: 'Pen up — stop drawing'   },
  ],
  control: [
    { icon: '🤏', gesture: 'Pinch near a stroke',        action: 'Grab & drag that stroke' },
    { icon: '✌️', gesture: 'Peace sign (hold 0.5 s)',   action: 'Undo last stroke'        },
    { icon: '🖐️', gesture: 'Open palm (hold 1.5 s)',    action: 'Clear all strokes'       },
    { icon: '🤟', gesture: '3 fingers (mid + ring up)', action: 'Toggle side panel'       },
  ],
}

export default function DrawIntro({ onStart }) {
  const [hand, setHand] = useState(
    () => localStorage.getItem(HAND_PREF_KEY) || 'right'
  )

  const drawingLabel = hand === 'left' ? 'Left hand' : 'Right hand'
  const controlLabel = hand === 'left' ? 'Right hand' : 'Left hand'

  function handleStart() {
    localStorage.setItem(HAND_PREF_KEY, hand)
    onStart(hand)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>✍️ Air Draw</h2>

        {/* Mirror note */}
        <div className={styles.mirrorBox}>
          <p className={styles.mirrorTitle}>📷 Camera is mirrored</p>
          <div className={styles.mirrorRow}>
            <span>Your <strong>left hand</strong> appears on the <strong>right</strong> side</span>
            <span>Your <strong>right hand</strong> appears on the <strong>left</strong> side</span>
          </div>
          <p className={styles.mirrorHint}>Just move naturally — it works like a mirror.</p>
        </div>

        {/* Hand picker */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Which hand do you draw with?</p>
          <div className={styles.choices}>
            <button
              className={`${styles.choice} ${hand === 'left' ? styles.choiceActive : ''}`}
              onClick={() => setHand('left')}
            >
              <span className={styles.choiceIcon}>🤚</span>
              <span className={styles.choiceLabel}>Left hand</span>
            </button>
            <button
              className={`${styles.choice} ${hand === 'right' ? styles.choiceActive : ''}`}
              onClick={() => setHand('right')}
            >
              <span className={styles.choiceIcon}>✋</span>
              <span className={styles.choiceLabel}>Right hand</span>
            </button>
          </div>
        </div>

        {/* Gesture reference */}
        <div className={styles.gestureGrid}>
          <div className={styles.gestureCol}>
            <p className={styles.colHeader}>{drawingLabel} — Drawing</p>
            {GESTURES.drawing.map(g => (
              <div key={g.gesture} className={styles.gestureRow}>
                <span className={styles.gestureIcon}>{g.icon}</span>
                <div>
                  <p className={styles.gestureName}>{g.gesture}</p>
                  <p className={styles.gestureAction}>{g.action}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.gestureCol}>
            <p className={styles.colHeader}>Either hand — Control</p>
            {GESTURES.control.map(g => (
              <div key={g.gesture} className={styles.gestureRow}>
                <span className={styles.gestureIcon}>{g.icon}</span>
                <div>
                  <p className={styles.gestureName}>{g.gesture}</p>
                  <p className={styles.gestureAction}>{g.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start Drawing →
        </button>
      </div>
    </div>
  )
}
