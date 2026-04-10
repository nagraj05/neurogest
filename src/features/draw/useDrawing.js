import { useRef, useState, useEffect } from 'react'
import { spawnGlitter } from './drawUtils.js'

const STORAGE_KEY   = 'gesture-canvas-strokes'
const CLEAR_HOLD_MS = 1500
const DRAG_RADIUS   = 0.07  // normalized distance to grab a stroke

function saveToStorage(strokes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(strokes)) } catch {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function findNearestStroke(strokes, point) {
  let nearest = -1, nearestDist = Infinity
  for (let i = 0; i < strokes.length; i++) {
    for (const p of strokes[i].points) {
      const dist = Math.hypot(p.x - point.x, p.y - point.y)
      if (dist < DRAG_RADIUS && dist < nearestDist) { nearest = i; nearestDist = dist }
    }
  }
  return nearest
}

export const DEFAULT_BRUSH = {
  color: '#a78bfa',
  size: 8,
  style: 'solid',
  glitter: false,
  glitterIntensity: 0.5,
}

export function useDrawing(drawingGesture, controlGesture) {
  const [brushConfig, setBrushConfig] = useState(DEFAULT_BRUSH)
  const [strokeCount, setStrokeCount] = useState(0)

  const strokesRef         = useRef([])
  const currentStrokeRef   = useRef(null)
  const particlesRef       = useRef([])
  const clearProgressRef   = useRef(0)
  const dragStrokeIndexRef = useRef(null)   // index of stroke being dragged (either hand)

  const brushConfigRef = useRef(brushConfig)
  brushConfigRef.current = brushConfig

  // Peace sign: track prev progress per hand to detect leading edge
  const prevDrawPeaceRef = useRef(0)
  const prevCtrlPeaceRef = useRef(0)

  const openHandTimerRef = useRef(null)

  // Track prev pinch per hand to detect release for save
  const prevDrawPinchRef = useRef(false)
  const prevCtrlPinchRef = useRef(false)

  useEffect(() => {
    const saved = loadFromStorage()
    if (saved.length) { strokesRef.current = saved; setStrokeCount(saved.length) }
  }, [])

  useEffect(() => {
    const {
      isDrawing, indexTip,
      isPinching: drawPinch, pinchMidpoint: drawMid, pinchDelta: drawDelta,
      peaceSignProgress: drawPeace,
      isOpenHand: drawOpen,
    } = drawingGesture
    const {
      isPinching: ctrlPinch, pinchMidpoint: ctrlMid, pinchDelta: ctrlDelta,
      peaceSignProgress: ctrlPeace,
      isOpenHand: ctrlOpen,
      isThreeFingers: ctrlThree,
    } = controlGesture

    const isOpenHand = drawOpen || ctrlOpen
    const bc = brushConfigRef.current
    const now = performance.now()

    // ── Drawing hand: index extended = pen down ───────────────────────────
    if (isDrawing) {
      if (!currentStrokeRef.current) {
        currentStrokeRef.current = {
          id: `${now}`,
          points: [{ x: indexTip.x, y: indexTip.y }],
          color: bc.color, size: bc.size, style: bc.style,
          glitter: bc.glitter, glitterIntensity: bc.glitterIntensity,
        }
      } else {
        currentStrokeRef.current.points.push({ x: indexTip.x, y: indexTip.y })
        if (bc.glitter) spawnGlitter(particlesRef, indexTip, bc)
      }
    } else if (currentStrokeRef.current) {
      // Pen up (fist, peace, open palm, or any non-drawing gesture) — commit stroke
      const stroke = currentStrokeRef.current
      currentStrokeRef.current = null
      if (stroke.points.length > 1) {
        strokesRef.current = [...strokesRef.current, stroke]
        saveToStorage(strokesRef.current)
        setStrokeCount(strokesRef.current.length)
      }
    }

    // ── Drag: pinch on either hand (not while actively drawing) ──────────
    // Prefer control hand; fall back to drawing hand
    const activePinch = ctrlPinch
      ? { mid: ctrlMid, delta: ctrlDelta }
      : drawPinch
      ? { mid: drawMid, delta: drawDelta }
      : null
    const nowPinching = !!(ctrlPinch || drawPinch)
    const wasPinching = prevDrawPinchRef.current || prevCtrlPinchRef.current

    if (activePinch && !currentStrokeRef.current) {
      if (dragStrokeIndexRef.current === null) {
        const idx = findNearestStroke(strokesRef.current, activePinch.mid)
        if (idx !== -1) dragStrokeIndexRef.current = idx
      } else {
        const stroke = strokesRef.current[dragStrokeIndexRef.current]
        if (stroke && (activePinch.delta.dx !== 0 || activePinch.delta.dy !== 0)) {
          stroke.points = stroke.points.map(p => ({
            x: Math.max(0, Math.min(1, p.x + activePinch.delta.dx)),
            y: Math.max(0, Math.min(1, p.y + activePinch.delta.dy)),
          }))
        }
      }
    } else if (!nowPinching) {
      if (wasPinching && dragStrokeIndexRef.current !== null) {
        saveToStorage(strokesRef.current)
      }
      dragStrokeIndexRef.current = null
    }

    prevDrawPinchRef.current = drawPinch
    prevCtrlPinchRef.current = ctrlPinch

    // ── Undo: peace sign on either hand (leading edge at progress = 1) ───
    const prevDraw = prevDrawPeaceRef.current
    const prevCtrl = prevCtrlPeaceRef.current
    if ((prevDraw < 1 && drawPeace >= 1) || (prevCtrl < 1 && ctrlPeace >= 1)) {
      if (strokesRef.current.length > 0) {
        strokesRef.current = strokesRef.current.slice(0, -1)
        saveToStorage(strokesRef.current)
        setStrokeCount(strokesRef.current.length)
      }
    }
    prevDrawPeaceRef.current = drawPeace
    prevCtrlPeaceRef.current = ctrlPeace

    // ── Clear: open palm either hand, hold 1.5 s ─────────────────────────
    if (isOpenHand) {
      if (!openHandTimerRef.current) openHandTimerRef.current = now
      const progress = Math.min((now - openHandTimerRef.current) / CLEAR_HOLD_MS, 1)
      clearProgressRef.current = progress
      if (progress >= 1) {
        strokesRef.current = []
        currentStrokeRef.current = null
        particlesRef.current = []
        dragStrokeIndexRef.current = null
        saveToStorage([])
        setStrokeCount(0)
        openHandTimerRef.current = null
        clearProgressRef.current = 0
      }
    } else {
      openHandTimerRef.current = null
      clearProgressRef.current = 0
    }
  }, [drawingGesture, controlGesture])

  function exportPNG(canvasEl) {
    if (!canvasEl) return
    const link = document.createElement('a')
    link.download = `gesture-art-${Date.now()}.png`
    link.href = canvasEl.toDataURL('image/png')
    link.click()
  }

  function undo() {
    if (!strokesRef.current.length) return
    strokesRef.current = strokesRef.current.slice(0, -1)
    saveToStorage(strokesRef.current)
    setStrokeCount(strokesRef.current.length)
  }

  function clearCanvas() {
    strokesRef.current = []
    currentStrokeRef.current = null
    particlesRef.current = []
    dragStrokeIndexRef.current = null
    saveToStorage([])
    setStrokeCount(0)
  }

  return {
    strokesRef, currentStrokeRef, particlesRef, clearProgressRef, dragStrokeIndexRef,
    brushConfig, setBrushConfig, strokeCount,
    exportPNG, undo, clearCanvas,
  }
}
