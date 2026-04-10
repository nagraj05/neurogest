import { HexColorPicker } from 'react-colorful'
import styles from './SidePanel.module.css'

const STROKE_STYLES = [
  { value: 'solid',  label: '—' },
  { value: 'dashed', label: '- -' },
  { value: 'dotted', label: '···' },
]

const PRESET_COLORS = [
  '#a78bfa', '#fb923c', '#34d399', '#60a5fa',
  '#f472b6', '#facc15', '#ffffff', '#f87171',
]

export default function SidePanel({
  brushConfig,
  setBrushConfig,
  strokeCount,
  onUndo,
  onClear,
  onExport,
  drawingHand,
  onSwitchHand,
  panelOpen,
  onTogglePanel,
}) {

  function set(key, value) {
    setBrushConfig(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className={`${styles.wrapper} ${panelOpen ? styles.open : styles.closed}`}>
      {/* Toggle tab */}
      <button
        className={styles.toggle}
        onClick={onTogglePanel}
        title={panelOpen ? 'Collapse panel' : 'Expand panel'}
      >
        {panelOpen ? '›' : '‹'}
      </button>

      <div className={styles.panel}>
        {/* ── Color ───────────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.label}>Color</h3>
          <HexColorPicker
            color={brushConfig.color}
            onChange={v => set('color', v)}
            className={styles.colorPicker}
          />
          <div className={styles.presets}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                className={`${styles.preset} ${brushConfig.color === c ? styles.presetActive : ''}`}
                style={{ background: c }}
                onClick={() => set('color', c)}
                title={c}
              />
            ))}
          </div>
        </section>

        {/* ── Stroke style ─────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.label}>Stroke</h3>
          <div className={styles.styleButtons}>
            {STROKE_STYLES.map(({ value, label }) => (
              <button
                key={value}
                className={`${styles.styleBtn} ${brushConfig.style === value ? styles.styleBtnActive : ''}`}
                onClick={() => set('style', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Brush size ───────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.label}>Size <span>{brushConfig.size}px</span></h3>
          <input
            type="range"
            min={2}
            max={40}
            value={brushConfig.size}
            onChange={e => set('size', Number(e.target.value))}
            className={styles.slider}
            style={{ '--thumb-color': brushConfig.color }}
          />
        </section>

        {/* ── Glitter ──────────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.glitterHeader}>
            <h3 className={styles.label}>Glitter</h3>
            <button
              className={`${styles.toggle2} ${brushConfig.glitter ? styles.toggle2On : ''}`}
              onClick={() => set('glitter', !brushConfig.glitter)}
            >
              {brushConfig.glitter ? 'ON' : 'OFF'}
            </button>
          </div>
          {brushConfig.glitter && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={brushConfig.glitterIntensity}
              onChange={e => set('glitterIntensity', Number(e.target.value))}
              className={styles.slider}
              style={{ '--thumb-color': brushConfig.color }}
            />
          )}
        </section>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.label}>Actions</h3>
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={onUndo}
              disabled={strokeCount === 0}
              title="Undo last stroke (or ✌️ hold)"
            >
              ↩ Undo
            </button>
            <button
              className={`${styles.actionBtn} ${styles.danger}`}
              onClick={onClear}
              disabled={strokeCount === 0}
              title="Clear canvas (or 🖐️ hold)"
            >
              🗑 Clear
            </button>
            <button
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={onExport}
              title="Save as PNG"
            >
              ↓ Export
            </button>
          </div>
        </section>

        {/* ── Drawing hand ─────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.label}>Drawing hand</h3>
          <div className={styles.styleButtons}>
            {['left', 'right'].map(hand => (
              <button
                key={hand}
                className={`${styles.styleBtn} ${drawingHand === hand ? styles.styleBtnActive : ''}`}
                onClick={() => onSwitchHand(hand)}
              >
                {hand === 'left' ? '🤚 Left' : '✋ Right'}
              </button>
            ))}
          </div>
        </section>

        {/* ── Gesture hint ─────────────────────────────────────────────────── */}
        <section className={styles.section}>
          <h3 className={styles.label}>Gestures</h3>
          <ul className={styles.hints}>
            <li>☝️ Index up → draw</li>
            <li>✊ Fist → pen up</li>
            <li>🤏 Pinch near stroke → drag</li>
            <li>✌️ Hold 0.5s → undo (any hand)</li>
            <li>🖐️ Hold 1.5s → clear (any hand)</li>
            <li>🤟 3 fingers → panel (any hand)</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
