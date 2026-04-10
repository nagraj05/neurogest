import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { PLANETS } from './planetData.js'
import PlanetModal from './PlanetModal.jsx'
import styles from './SolarCanvas.module.css'

// ── Camera constants ──────────────────────────────────────────────────────────
const DEFAULT_CAM  = { theta: 0.4, phi: 1.1, radius: 55 }
const ROTATE_SPEED   = 1.5
const ZOOM_SPEED     = 25
const TWO_ZOOM_SPEED = 20
const MIN_RADIUS   = 10
const MAX_RADIUS   = 90

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

// ── Scene builder helpers ─────────────────────────────────────────────────────
function buildStars(scene) {
  const pos = []
  for (let i = 0; i < 2000; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r     = 300 + Math.random() * 200
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 })))
}

function buildOrbitLine(scene, orbitRadius) {
  const pts = []
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts)
  scene.add(new THREE.LineLoop(geo, new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.1,
  })))
}

function buildPlanet(scene, data) {
  const geo = new THREE.SphereGeometry(data.radius, 32, 32)
  const mat = new THREE.MeshPhongMaterial({
    color: data.color, shininess: 30, specular: new THREE.Color(0x222222),
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.userData.planet = data
  scene.add(mesh)

  if (data.hasRing) {
    const rGeo = new THREE.RingGeometry(
      data.radius * data.ringInnerRadius,
      data.radius * data.ringOuterRadius,
      64
    )
    const rMat = new THREE.MeshBasicMaterial({
      color: data.ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.75,
    })
    const ring = new THREE.Mesh(rGeo, rMat)
    ring.rotation.x = -Math.PI / 2   // lay flat in XZ plane
    mesh.add(ring)                    // child: follows planet position + spin
  }

  return { data, mesh, angle: Math.random() * Math.PI * 2 }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SolarCanvas({ primaryGesture, secondaryGesture, twoHandGesture }) {
  const containerRef = useRef(null)

  // Keep latest gesture state accessible inside the rAF loop via ref
  const gesturesRef = useRef({ primaryGesture, secondaryGesture, twoHandGesture })
  gesturesRef.current = { primaryGesture, secondaryGesture, twoHandGesture }

  const [selectedPlanet, setSelectedPlanet] = useState(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020208)

    const camera = new THREE.PerspectiveCamera(
      60, container.clientWidth / container.clientHeight, 0.1, 1000
    )
    const camState = { ...DEFAULT_CAM }
    camera.position.setFromSphericalCoords(camState.radius, camState.phi, camState.theta)
    camera.lookAt(0, 0, 0)

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.15))
    scene.add(new THREE.PointLight(0xffd080, 2.5, 300))

    // ── Sun ───────────────────────────────────────────────────────────────────
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd700 })
    )
    scene.add(sunMesh)
    // Outer glow
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.12, side: THREE.BackSide })
    ))

    // ── Stars + orbit lines ───────────────────────────────────────────────────
    buildStars(scene)
    for (const p of PLANETS) buildOrbitLine(scene, p.orbitRadius)

    // ── Planets ───────────────────────────────────────────────────────────────
    const planetObjects = PLANETS.map(data => buildPlanet(scene, data))
    const planetMeshes  = planetObjects.map(o => o.mesh)

    // ── Raycaster + tap state ─────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    let prevPinching = false
    let pinchTap = null  // { startTime, startPos }

    // ── Camera momentum (smooth coast after pinch release) ────────────────────
    const camVel = { theta: 0, phi: 0, radius: 0 }
    const FRICTION      = 0.88   // velocity multiplier each frame (lower = stops faster)
    const VEL_THRESHOLD = 0.00005 // zero out negligible velocity to avoid drift

    // ── Animation loop ────────────────────────────────────────────────────────
    let rafId
    let prevTime = performance.now()

    function animate(time) {
      rafId = requestAnimationFrame(animate)
      const delta = Math.min((time - prevTime) / 1000, 0.05)
      prevTime = time

      // Planet orbits
      for (const obj of planetObjects) {
        obj.angle += obj.data.orbitSpeed * delta
        obj.mesh.position.set(
          Math.cos(obj.angle) * obj.data.orbitRadius,
          0,
          Math.sin(obj.angle) * obj.data.orbitRadius
        )
        obj.mesh.rotation.y += obj.data.selfRotationSpeed * delta
      }

      // Gesture camera
      const { primaryGesture: pg, secondaryGesture: sg, twoHandGesture: thg } = gesturesRef.current

      if (pg.isPinching) {
        // Accumulate into velocity so motion carries on release
        camVel.theta  += -pg.pinchDelta.dx * ROTATE_SPEED
        camVel.phi    +=  pg.pinchDelta.dy * ROTATE_SPEED
        if (Math.abs(pg.pinchDistanceDelta) > 0.002) {
          camVel.radius += -pg.pinchDistanceDelta * ZOOM_SPEED
        }
      }

      if (thg?.isTwoHandPinch) {
        camVel.radius += -thg.twoHandSpreadDelta * TWO_ZOOM_SPEED
      }

      // Apply velocity + friction each frame
      camState.theta  += camVel.theta
      camState.phi     = clamp(camState.phi + camVel.phi, 0.15, Math.PI - 0.15)
      camState.radius  = clamp(camState.radius + camVel.radius, MIN_RADIUS, MAX_RADIUS)

      camVel.theta  *= FRICTION
      camVel.phi    *= FRICTION
      camVel.radius *= FRICTION

      if (Math.abs(camVel.theta)  < VEL_THRESHOLD) camVel.theta  = 0
      if (Math.abs(camVel.phi)    < VEL_THRESHOLD) camVel.phi    = 0
      if (Math.abs(camVel.radius) < VEL_THRESHOLD) camVel.radius = 0

      if (pg.isOpenHand || sg?.isOpenHand) {
        // Reset: lerp camera back + kill any momentum
        camVel.theta = camVel.phi = camVel.radius = 0
        camState.theta  += (DEFAULT_CAM.theta  - camState.theta)  * 0.06
        camState.phi    += (DEFAULT_CAM.phi    - camState.phi)    * 0.06
        camState.radius += (DEFAULT_CAM.radius - camState.radius) * 0.06
      }

      camera.position.setFromSphericalCoords(camState.radius, camState.phi, camState.theta)
      camera.lookAt(0, 0, 0)

      // Tap detection (quick pinch-release = planet click)
      const currPinching = pg.isPinching

      if (currPinching && !prevPinching) {
        pinchTap = { startTime: time, startPos: { ...pg.pinchMidpoint } }
      }
      if (!currPinching && prevPinching && pinchTap) {
        const elapsed = time - pinchTap.startTime
        const moved   = Math.hypot(
          pg.pinchMidpoint.x - pinchTap.startPos.x,
          pg.pinchMidpoint.y - pinchTap.startPos.y
        )
        if (elapsed < 400 && moved < 0.05) {
          const { x, y } = pinchTap.startPos
          raycaster.setFromCamera(new THREE.Vector2(x * 2 - 1, -(y * 2 - 1)), camera)
          const hits = raycaster.intersectObjects(planetMeshes)
          if (hits.length > 0) setSelectedPlanet(hits[0].object.userData.planet)
        }
        pinchTap = null
      }
      prevPinching = currPinching

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(animate)

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      scene.traverse(obj => {
        obj.geometry?.dispose()
        const mat = obj.material
        if (mat) Array.isArray(mat) ? mat.forEach(m => m.dispose()) : mat.dispose()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, []) // runs once; gestures read via gesturesRef

  return (
    <div ref={containerRef} className={styles.container}>
      {selectedPlanet && (
        <PlanetModal planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
      )}
    </div>
  )
}
