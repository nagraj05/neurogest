import styles from './HandPicker.module.css'

export default function HandPicker({ onPick }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>Which hand do you draw with?</h2>
        <p className={styles.sub}>
          Your drawing hand tracks the brush. The other hand controls undo &amp; clear.
        </p>
        <div className={styles.choices}>
          <button className={styles.choice} onClick={() => onPick('left')}>
            <span className={styles.hand}>🤚</span>
            <span className={styles.choiceLabel}>Left hand</span>
          </button>
          <button className={styles.choice} onClick={() => onPick('right')}>
            <span className={styles.hand}>✋</span>
            <span className={styles.choiceLabel}>Right hand</span>
          </button>
        </div>
        <p className={styles.hint}>You can change this any time via the side panel.</p>
      </div>
    </div>
  )
}
