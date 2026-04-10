// ── Stroke rendering ──────────────────────────────────────────────────────────

export function drawStroke(ctx, stroke, w, h, isDragging = false) {
  const { points, color, size, style } = stroke
  if (points.length < 2) return

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 1

  if (isDragging) {
    ctx.shadowBlur = 18
    ctx.shadowColor = color
  }

  if (style === 'dashed') ctx.setLineDash([size * 3, size * 2])
  else if (style === 'dotted') ctx.setLineDash([2, size * 2])
  else ctx.setLineDash([])

  ctx.beginPath()

  if (points.length === 2) {
    ctx.moveTo(points[0].x * w, points[0].y * h)
    ctx.lineTo(points[1].x * w, points[1].y * h)
  } else {
    // Midpoint quadratic bezier for smooth curves
    ctx.moveTo(points[0].x * w, points[0].y * h)
    for (let i = 1; i < points.length - 1; i++) {
      const mx = ((points[i].x + points[i + 1].x) / 2) * w
      const my = ((points[i].y + points[i + 1].y) / 2) * h
      ctx.quadraticCurveTo(points[i].x * w, points[i].y * h, mx, my)
    }
    const last = points[points.length - 1]
    ctx.lineTo(last.x * w, last.y * h)
  }

  ctx.stroke()
  ctx.restore()
}

// ── Glitter particle system ───────────────────────────────────────────────────

const MAX_PARTICLES = 600

export function spawnGlitter(particlesRef, point, brushConfig) {
  const count = Math.round(2 + brushConfig.glitterIntensity * 6) // 2–8

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 0.003 + Math.random() * 0.006
    particlesRef.current.push({
      x:     point.x,
      y:     point.y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed - 0.002, // slight upward bias
      life:  1,
      decay: 0.025 + Math.random() * 0.03,
      size:  1.5 + Math.random() * 2.5,
      color: brushConfig.color,
    })
  }

  // Cap to avoid memory growth
  if (particlesRef.current.length > MAX_PARTICLES) {
    particlesRef.current = particlesRef.current.slice(-MAX_PARTICLES)
  }
}

export function updateParticles(particles) {
  let write = 0
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.0001  // gravity
    p.life -= p.decay
    if (p.life > 0) particles[write++] = p
  }
  particles.length = write
}

export function drawParticles(ctx, particles, w, h) {
  for (const p of particles) {
    ctx.save()
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    // 4-pointed star sparkle
    ctx.translate(p.x * w, p.y * h)
    ctx.rotate(p.life * Math.PI) // slow spin as it fades
    drawStar(ctx, p.size)
    ctx.restore()
  }
}

function drawStar(ctx, r) {
  const inner = r * 0.35
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const outerAngle = (i / 4) * Math.PI * 2
    const innerAngle = outerAngle + Math.PI / 4
    ctx.lineTo(Math.cos(outerAngle) * r, Math.sin(outerAngle) * r)
    ctx.lineTo(Math.cos(innerAngle) * inner, Math.sin(innerAngle) * inner)
  }
  ctx.closePath()
  ctx.fill()
}

// ── Clear-canvas progress overlay ────────────────────────────────────────────

export function drawClearProgress(ctx, progress, w, h) {
  if (progress <= 0) return

  // Dark vignette fade-in
  ctx.save()
  ctx.globalAlpha = progress * 0.45
  ctx.fillStyle = '#1a0a0a'
  ctx.fillRect(0, 0, w, h)

  // Arc countdown at center
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.06

  // Background circle
  ctx.globalAlpha = 0.6
  ctx.strokeStyle = '#ffffff22'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Progress arc
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#f87171'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
  ctx.stroke()

  // Label
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(r * 0.55)}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Clear', cx, cy)

  ctx.restore()
}

// ── Drag (pinch) cursor — shown at pinch midpoint while moving a stroke ───────

export function drawDragCursor(ctx, pinchMidpoint, w, h) {
  if (!pinchMidpoint) return
  const cx = pinchMidpoint.x * w
  const cy = pinchMidpoint.y * h
  const r = 14

  ctx.save()
  ctx.globalAlpha = 0.9

  // Outer circle
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  // Cross arrows
  const a = 6
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    ctx.beginPath()
    ctx.moveTo(cx + dx * (r + 4), cy + dy * (r + 4))
    ctx.lineTo(cx + dx * (r + 4 + a), cy + dy * (r + 4 + a))
    ctx.stroke()
  }

  ctx.restore()
}

// ── Pinch circle cursor — shown at index tip when hand is pinching ────────────

export function drawPinchCursor(ctx, indexTip, w, h) {
  if (!indexTip || (indexTip.x === 0 && indexTip.y === 0)) return
  const cx = indexTip.x * w
  const cy = indexTip.y * h
  const r = 13

  ctx.save()
  // Outer ring
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.85
  ctx.stroke()
  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.85
  ctx.fill()
  ctx.restore()
}

// ── Index finger cursor ───────────────────────────────────────────────────────

export function drawCursor(ctx, indexTip, isDrawing, color, w, h) {
  if (!indexTip || (indexTip.x === 0 && indexTip.y === 0)) return
  const cx = indexTip.x * w
  const cy = indexTip.y * h

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, isDrawing ? 6 : 10, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.85
  ctx.stroke()

  if (isDrawing) {
    ctx.fillStyle = color
    ctx.globalAlpha = 0.4
    ctx.fill()
  }
  ctx.restore()
}
