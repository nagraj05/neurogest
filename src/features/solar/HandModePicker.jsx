import styles from './HandModePicker.module.css'

export default function HandModePicker({ onPick }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2 className={styles.title}>How do you want to control the solar system?</h2>
        <p className={styles.sub}>
          Choose based on how many hands you want to use. You can change this any time.
        </p>
        <div className={styles.choices}>
          <button className={styles.choice} onClick={() => onPick('one')}>
            <span className={styles.hand}>✋</span>
            <span className={styles.choiceLabel}>One hand</span>
            <span className={styles.choiceDesc}>Whichever hand is detected controls everything</span>
          </button>
          <button className={styles.choice} onClick={() => onPick('two')}>
            <span className={styles.hand}>🤲</span>
            <span className={styles.choiceLabel}>Both hands</span>
            <span className={styles.choiceDesc}>Use both hands together for pinch-to-zoom</span>
          </button>
        </div>
        <p className={styles.hint}>You can switch this any time via the menu button.</p>
      </div>
    </div>
  )
}
