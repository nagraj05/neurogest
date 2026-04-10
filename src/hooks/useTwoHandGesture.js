import { useRef } from 'react'

// ── Default return value ──────────────────────────────────────────────────────
const DEFAULT_STATE = Object.freeze({
  isTwoHandPinch:    false,
  twoHandSpreadDelta: 0,
})

// ── Hook ──────────────────────────────────────────────────────────────────────
// Takes the output of two useGesture() calls (left and right hand).
// Returns combined cross-hand gesture state.
export function useTwoHandGesture(leftGesture, rightGesture) {
  const prevDistRef = useRef(null)

  const isTwoHandPinch = leftGesture.isPinching && rightGesture.isPinching

  if (!isTwoHandPinch) {
    prevDistRef.current = null
    return DEFAULT_STATE
  }

  // Distance between the two pinch midpoints
  const lm = leftGesture.pinchMidpoint
  const rm = rightGesture.pinchMidpoint
  const currentDist = Math.hypot(rm.x - lm.x, rm.y - lm.y)

  let twoHandSpreadDelta = 0
  if (prevDistRef.current !== null) {
    twoHandSpreadDelta = currentDist - prevDistRef.current
  }
  prevDistRef.current = currentDist

  return { isTwoHandPinch, twoHandSpreadDelta }
}
