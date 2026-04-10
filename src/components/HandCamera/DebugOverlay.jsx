import { useRef, useEffect } from 'react'

// Hand skeleton connections (MediaPipe 21-point model)
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [0, 9], [9, 10], [10, 11], [11, 12],      // middle
  [0, 13], [13, 14], [14, 15], [15, 16],    // ring
  [0, 17], [17, 18], [18, 19], [19, 20],    // pinky
  [5, 9], [9, 13], [13, 17],                // palm knuckles
]

const COLORS = { left: '#a78bfa', right: '#fb923c' }
const DOT_RADIUS = 4

export default function DebugOverlay({ hands, width, height }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    Object.entries(hands).forEach(([side, landmarks]) => {
      if (!landmarks?.length) return
      const color = COLORS[side]

      // Flip x because the video element is mirrored via CSS (scaleX(-1))
      // but the canvas is not — so we mirror coordinates manually.
      const toX = (lm) => (1 - lm.x) * width
      const toY = (lm) => lm.y * height

      // Connections
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.7
      for (const [a, b] of CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(toX(landmarks[a]), toY(landmarks[a]))
        ctx.lineTo(toX(landmarks[b]), toY(landmarks[b]))
        ctx.stroke()
      }

      // Landmark dots
      ctx.fillStyle = color
      ctx.globalAlpha = 1
      for (const lm of landmarks) {
        ctx.beginPath()
        ctx.arc(toX(lm), toY(lm), DOT_RADIUS, 0, Math.PI * 2)
        ctx.fill()
      }

      // Hand label near wrist
      const wrist = landmarks[0]
      ctx.fillStyle = color
      ctx.font = 'bold 13px monospace'
      ctx.globalAlpha = 1
      ctx.fillText(side.toUpperCase(), toX(wrist) + 10, toY(wrist) - 8)
    })
  }, [hands, width, height])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
