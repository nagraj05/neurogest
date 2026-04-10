import styles from './CameraStatus.module.css'

export default function CameraStatus({ status, loadingStep, message }) {
  if (status === 'ready') return null

  return (
    <div className={styles.overlay}>
      {status === 'loading' && (
        <>
          <div className={styles.spinner} />
          <p className={styles.text}>
            {loadingStep === 'model' ? 'Downloading hand tracking model…' : 'Starting camera…'}
          </p>
          {loadingStep === 'model' && (
            <p className={styles.sub}>First load may take a moment</p>
          )}
          <div className={styles.steps}>
            <span className={`${styles.step} ${styles.stepDone}`}>① Model</span>
            <span className={styles.stepArrow}>→</span>
            <span className={`${styles.step} ${loadingStep === 'camera' ? styles.stepDone : ''}`}>② Camera</span>
            <span className={styles.stepArrow}>→</span>
            <span className={styles.step}>③ Ready</span>
          </div>
        </>
      )}
      {status === 'error' && (
        <>
          <div className={styles.icon}>⚠️</div>
          <p className={styles.text}>{message}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>
            Reload page
          </button>
        </>
      )}
    </div>
  )
}
