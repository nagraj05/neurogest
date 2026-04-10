import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import styles from './PlanetViewer.module.css'

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

export default function PlanetViewer({ planet }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // ── Scene ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      45, container.clientWidth / container.clientHeight, 0.1, 100
    )
    let camDist = planet.radius * 5
    camera.position.set(0, 0, camDist)
    camera.lookAt(0, 0, 0)

    // Lighting: soft key + fill
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const key = new THREE.DirectionalLight(0xfff5e0, 1.8)
    key.position.set(4, 3, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x8090ff, 0.3)
    fill.position.set(-4, -2, -3)
    scene.add(fill)

    // ── Planet mesh ───────────────────────────────────────────────────────────
    const geo = new THREE.SphereGeometry(planet.radius, 64, 64)
    const mat = new THREE.MeshPhongMaterial({
      color: planet.color, shininess: 50, specular: new THREE.Color(0x555555),
    })
    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    // Ring (Saturn)
    if (planet.hasRing) {
      const rGeo = new THREE.RingGeometry(
        planet.radius * planet.ringInnerRadius,
        planet.radius * planet.ringOuterRadius,
        64
      )
      const rMat = new THREE.MeshBasicMaterial({
        color: planet.ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.8,
      })
      const ring = new THREE.Mesh(rGeo, rMat)
      ring.rotation.x = -Math.PI / 2
      mesh.add(ring) // child → follows planet rotation
    }

    // ── Interaction state ─────────────────────────────────────────────────────
    let autoRotate = true
    let isDragging = false
    let prev = { x: 0, y: 0 }
    let rotX = 0, rotY = 0

    const canvas = renderer.domElement

    function onPointerDown(e) {
      isDragging = true
      autoRotate = false
      prev = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
    }
    function onPointerMove(e) {
      if (!isDragging) return
      rotY += (e.clientX - prev.x) * 0.012
      rotX += (e.clientY - prev.y) * 0.012
      rotX = clamp(rotX, -Math.PI / 2, Math.PI / 2)
      prev = { x: e.clientX, y: e.clientY }
    }
    function onPointerUp() { isDragging = false }
    function onWheel(e) {
      camDist = clamp(camDist + e.deltaY * 0.01, planet.radius * 2.5, planet.radius * 10)
      camera.position.z = camDist
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: true })

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId
    function animate() {
      rafId = requestAnimationFrame(animate)
      if (autoRotate) rotY += 0.006
      mesh.rotation.set(rotX, rotY, 0)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [planet])

  return <div ref={containerRef} className={styles.viewer} />
}
