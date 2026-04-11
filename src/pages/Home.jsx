import { useNavigate } from 'react-router-dom'
import styles from './Home.module.css'

const features = [
  {
    route: '/draw',
    accent: 'draw',
    emoji: '✍️',
    title: 'Air Drawing',
    description: 'Draw in mid-air with your index finger. Use gestures to change colors, undo strokes, and export your artwork.',
    gestures: ['✍️ Index — draw', '✊ Fist — lift pen', '✌️ Peace — undo', '🖐️ Open — clear'],
  },
  {
    route: '/solar',
    accent: 'solar',
    emoji: '🪐',
    title: 'Solar System',
    description: 'Explore all 8 planets with hand gestures. Pinch to rotate, spread to zoom, and tap to inspect each planet.',
    gestures: ['🤏 Pinch+move — rotate', '🤏 Spread — zoom', '🖐️ Open — reset', '👆 Tap planet — details'],
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.mobileWarning}>
        <div className={styles.mobileIcon}>🖥️</div>
        <h2 className={styles.mobileTitle}>Made for the big screen</h2>
        <p className={styles.mobileText}>
          NeuroGest uses your webcam and hand gestures to control interactive experiences.
          Open it on a desktop or laptop for the full experience.
        </p>
      </div>
      <header className={styles.header}>
        <div className={styles.logo}>NeuroGest</div>
        <p className={styles.tagline}>Control with your hands. No mouse required.</p>
      </header>

      <main className={styles.cards}>
        {features.map(({ route, accent, emoji, title, description, gestures }) => (
          <button
            key={route}
            className={`${styles.card} ${styles[`card--${accent}`]}`}
            onClick={() => navigate(route)}
          >
            <div className={styles.cardEmoji}>{emoji}</div>
            <h2 className={styles.cardTitle}>{title}</h2>
            <p className={styles.cardDesc}>{description}</p>
            <ul className={styles.gestures}>
              {gestures.map(g => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <span className={styles.cardCta}>Launch →</span>
          </button>
        ))}
      </main>

      <footer className={styles.footer}>
        <span>Requires webcam · Desktop only</span>
      </footer>
    </div>
  )
}
