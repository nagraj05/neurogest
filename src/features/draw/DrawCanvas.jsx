import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import {
  drawStroke,
  updateParticles,
  drawParticles,
  drawClearProgress,
  drawCursor,
  drawDragCursor,
  drawPinchCursor,
} from './drawUtils.js'
import styles from './DrawCanvas.module.css'

const DrawCanvas = forwardRef(function DrawCanvas(
  { strokesRef, currentStrokeRef, particlesRef, clearProgressRef, dragStrokeIndexRef, drawingGesture, controlGesture },
  ref
) {
  const canvasRef = useRef(null)
  const drawingGestureRef = useRef(drawingGesture)
  drawingGestureRef.current = drawingGesture
  const controlGestureRef = useRef(controlGesture)
  controlGestureRef.current = controlGesture

  const [size, setSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  })

  useImperativeHandle(ref, () => canvasRef.current)

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      setSize({ w: window.innerWidth, h: window.innerHeight })
    })
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let rafId
    let running = true

    function frame() {
      if (!running) return
      const canvas = canvasRef.current
      if (!canvas) { rafId = requestAnimationFrame(frame); return }

      const ctx = canvas.getContext('2d')
      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Committed strokes — highlight the one being dragged
      const dragIdx = dragStrokeIndexRef.current
      for (let i = 0; i < strokesRef.current.length; i++) {
        drawStroke(ctx, strokesRef.current[i], w, h, i === dragIdx)
      }

      // Stroke in progress
      if (currentStrokeRef.current) {
        drawStroke(ctx, currentStrokeRef.current, w, h)
      }

      // Glitter particles
      updateParticles(particlesRef.current)
      drawParticles(ctx, particlesRef.current, w, h)

      // Clear-canvas progress overlay
      drawClearProgress(ctx, clearProgressRef.current, w, h)

      // ── Cursors ───────────────────────────────────────────────────────────
      const dg = drawingGestureRef.current
      const cg = controlGestureRef.current

      // Drawing hand: hollow ring = repositioning, filled dot = drawing
      if (dg) {
        const color = currentStrokeRef.current?.color ?? '#a78bfa'
        drawCursor(ctx, dg.indexTip, dg.isDrawing, color, w, h)
      }

      // Pinch cursor for either hand
      // When drag is active show the drag crosshair; otherwise show pinch circle
      if (dg?.isPinching) {
        if (dragIdx !== null) {
          drawDragCursor(ctx, dg.pinchMidpoint, w, h)
        } else {
          drawPinchCursor(ctx, dg.indexTip, w, h)
        }
      }
      if (cg?.isPinching) {
        if (dragIdx !== null) {
          drawDragCursor(ctx, cg.pinchMidpoint, w, h)
        } else {
          drawPinchCursor(ctx, cg.indexTip, w, h)
        }
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => {
      running = false
      cancelAnimationFrame(rafId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={size.w}
      height={size.h}
    />
  )
})

export default DrawCanvas
