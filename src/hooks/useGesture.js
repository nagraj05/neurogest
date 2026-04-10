import { useRef } from 'react'

// ── Landmark indices ──────────────────────────────────────────────────────────
const WRIST       = 0
const THUMB_CMC   = 2, THUMB_TIP  = 4
const INDEX_MCP   = 5, INDEX_TIP  = 8
const MIDDLE_MCP  = 9, MIDDLE_TIP = 12
const RING_MCP    = 13, RING_TIP  = 16
const PINKY_MCP   = 17, PINKY_TIP = 20

// ── Tuning constants ──────────────────────────────────────────────────────────
const ALPHA         = 0.35  // EMA smoothing (higher = more responsive, more jitter)
const ON_THRESH     = 0.55  // confidence to activate a gesture
const OFF_THRESH    = 0.22  // confidence to deactivate — wide gap prevents mid-hold flicker
const EXT_RATIO     = 0.55  // dist(MCP,TIP)/handSize to count as "extended"
const PINCH_RATIO   = 0.38  // dist(thumbTip,indexTip)/handSize to count as "pinching"
const PEACE_HOLD_MS = 500   // ms held before peace sign fires

// ── Helpers ───────────────────────────────────────────────────────────────────
function d(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// wrist → middle MCP as a stable hand-size reference
function handSize(lm) {
  return d(lm[WRIST], lm[MIDDLE_MCP])
}

// Update EMA confidence score for one gesture
function updateConf(conf, detected) {
  return conf + ALPHA * ((detected ? 1 : 0) - conf)
}

// Apply ON/OFF hysteresis to a confidence score
function hysteresis(prevActive, conf) {
  if (prevActive) return conf >= OFF_THRESH
  return conf >= ON_THRESH
}

// Classify raw per-frame finger states from landmarks
function rawClassify(lm) {
  const size = handSize(lm)
  if (size < 0.01) return null // degenerate detection

  const thumbEx  = d(lm[THUMB_CMC], lm[THUMB_TIP])  / size > EXT_RATIO
  const indexEx  = d(lm[INDEX_MCP], lm[INDEX_TIP])  / size > EXT_RATIO
  const middleEx = d(lm[MIDDLE_MCP], lm[MIDDLE_TIP]) / size > EXT_RATIO
  const ringEx   = d(lm[RING_MCP], lm[RING_TIP])    / size > EXT_RATIO
  const pinkyEx  = d(lm[PINKY_MCP], lm[PINKY_TIP])  / size > EXT_RATIO

  const pinchRatio = d(lm[THUMB_TIP], lm[INDEX_TIP]) / size

  return { thumbEx, indexEx, middleEx, ringEx, pinkyEx, pinchRatio, size }
}

// ── Default return value when no hand present ─────────────────────────────────
const DEFAULT_STATE = Object.freeze({
  isDrawing:         false,
  isFist:            false,
  isOpenHand:        false,
  isPinching:        false,
  isPeaceSign:       false,
  isThreeFingers:    false,
  peaceSignProgress: 0,
  indexTip:          { x: 0, y: 0 },
  pinchMidpoint:     { x: 0, y: 0 },
  pinchDelta:        { dx: 0, dy: 0 },
  pinchDistanceDelta: 0,
})

// ── Internal state shape ──────────────────────────────────────────────────────
function makeInternal() {
  return {
    conf: {
      isDrawing:      0,
      isFist:         0,
      isOpenHand:     0,
      isPinching:     0,
      isPeaceSign:    0,
      isThreeFingers: 0,
    },
    active: {
      isDrawing:      false,
      isFist:         false,
      isOpenHand:     false,
      isPinching:     false,
      isPeaceSign:    false,
      isThreeFingers: false,
    },
    peaceHoldStart:  null,  // performance.now() when peace sign first smoothed ON
    peaceSignFired:  false, // true after undo fires; cleared on gesture release
    prevPinchMid:    null,  // { x, y } previous frame pinch midpoint
    prevPinchDist:   null,  // previous frame dist(thumbTip, indexTip) / size
    _state:          DEFAULT_STATE, // always valid from first render
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGesture(landmarks) {
  const internalRef = useRef(makeInternal())
  const prevLandmarksRef = useRef(null)

  // Only recompute when landmarks reference changes (i.e. a new detection frame)
  if (landmarks !== prevLandmarksRef.current) {
    prevLandmarksRef.current = landmarks
    internalRef.current = compute(landmarks, internalRef.current, performance.now())
  }

  return internalRef.current._state
}

// ── Core computation (pure-ish, mutates `internal` in place) ─────────────────
function compute(landmarks, internal, now) {
  const { conf, active } = internal

  // ── Reset smoothly toward zero when hand absent ───────────────────────────
  if (!landmarks?.length) {
    for (const k of Object.keys(conf)) conf[k] = updateConf(conf[k], false)
    for (const k of Object.keys(active)) active[k] = hysteresis(active[k], conf[k])
    internal.peaceHoldStart = null
    internal.peaceSignFired = false
    internal.prevPinchMid = null
    internal.prevPinchDist = null
    internal._state = DEFAULT_STATE
    return internal
  }

  const raw = rawClassify(landmarks)
  if (!raw) {
    internal._state = DEFAULT_STATE
    return internal
  }

  const { indexEx, middleEx, ringEx, pinkyEx, pinchRatio } = raw

  // ── Update EMA confidence for each gesture ────────────────────────────────
  // isDrawing: only index extended (peace sign must NOT fire drawing)
  conf.isDrawing      = updateConf(conf.isDrawing,      indexEx && !middleEx && !ringEx && !pinkyEx)
  conf.isFist         = updateConf(conf.isFist,         !indexEx && !middleEx && !ringEx && !pinkyEx)
  // Thumb omitted: it extends sideways and its CMC→TIP ratio is unreliable with the shared threshold
  conf.isOpenHand     = updateConf(conf.isOpenHand,     indexEx && middleEx && ringEx && pinkyEx)
  conf.isPinching     = updateConf(conf.isPinching,     pinchRatio < PINCH_RATIO)
  conf.isPeaceSign    = updateConf(conf.isPeaceSign,    indexEx && middleEx && !ringEx && !pinkyEx)
  // Three fingers: index + middle + ring extended, pinky curled (panel toggle)
  conf.isThreeFingers = updateConf(conf.isThreeFingers, indexEx && middleEx && ringEx && !pinkyEx)

  // ── Apply hysteresis ──────────────────────────────────────────────────────
  for (const k of Object.keys(active)) {
    active[k] = hysteresis(active[k], conf[k])
  }

  // ── Mutual exclusion: fist and pinch cannot both be active ────────────────
  // In a fist the thumb tip ends up near the curled index tip, satisfying
  // the pinch distance check. Higher confidence takes priority.
  if (active.isFist && active.isPinching) {
    if (conf.isFist >= conf.isPinching) {
      active.isPinching = false
    } else {
      active.isFist = false
    }
  }

  // ── Peace sign hold timer ─────────────────────────────────────────────────
  let peaceSignProgress = 0
  if (active.isPeaceSign && !internal.peaceSignFired) {
    if (internal.peaceHoldStart === null) internal.peaceHoldStart = now
    peaceSignProgress = Math.min((now - internal.peaceHoldStart) / PEACE_HOLD_MS, 1)
    if (peaceSignProgress >= 1) internal.peaceSignFired = true
  } else if (!active.isPeaceSign) {
    internal.peaceHoldStart = null
    internal.peaceSignFired = false
  }

  // ── Mirrored screen-space coordinates ────────────────────────────────────
  // x is flipped (1 - x) to match the CSS-mirrored video display
  const lm = landmarks
  const indexTip = { x: 1 - lm[INDEX_TIP].x, y: lm[INDEX_TIP].y }

  const midRawX = (lm[THUMB_TIP].x + lm[INDEX_TIP].x) / 2
  const midRawY = (lm[THUMB_TIP].y + lm[INDEX_TIP].y) / 2
  const pinchMidpoint = { x: 1 - midRawX, y: midRawY }

  // ── Pinch deltas (frame-over-frame change while pinching) ─────────────────
  let pinchDelta = { dx: 0, dy: 0 }
  let pinchDistanceDelta = 0

  if (active.isPinching) {
    if (internal.prevPinchMid) {
      pinchDelta = {
        dx: pinchMidpoint.x - internal.prevPinchMid.x,
        dy: pinchMidpoint.y - internal.prevPinchMid.y,
      }
    }
    if (internal.prevPinchDist !== null) {
      pinchDistanceDelta = pinchRatio - internal.prevPinchDist
    }
    internal.prevPinchMid  = pinchMidpoint
    internal.prevPinchDist = pinchRatio
  } else {
    internal.prevPinchMid  = null
    internal.prevPinchDist = null
  }

  // ── Assemble output state ─────────────────────────────────────────────────
  internal._state = {
    isDrawing:         active.isDrawing,
    isFist:            active.isFist,
    isOpenHand:        active.isOpenHand,
    isPinching:        active.isPinching,
    isPeaceSign:       active.isPeaceSign,
    isThreeFingers:    active.isThreeFingers,
    peaceSignProgress,
    indexTip,
    pinchMidpoint,
    pinchDelta,
    pinchDistanceDelta,
  }

  return internal
}
