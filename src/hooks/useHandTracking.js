import { useEffect, useRef, useState, useCallback } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// Cap inference at 30 fps — video is typically 30fps anyway so this
// avoids running detectForVideo twice per unique frame on 60fps displays.
const MIN_FRAME_MS = 1000 / 30

// MediaPipe reports handedness assuming a mirrored (selfie) feed.
// We feed raw video and mirror it via CSS, so we flip the label
// to match the user's actual left/right perspective.
function toUserSide(mpLabel) {
  return mpLabel === 'Left' ? 'right' : 'left'
}

export function useHandTracking() {
  const videoRef            = useRef(null)
  const landmarkerRef       = useRef(null)
  const rafRef              = useRef(null)
  const lastVideoTimeRef    = useRef(-1)
  const lastInferenceTimeRef = useRef(0)
  const isRunningRef        = useRef(false)

  const [hands, setHands]             = useState({ left: null, right: null })
  const [status, setStatus]           = useState('loading') // 'loading' | 'ready' | 'error'
  const [loadingStep, setLoadingStep] = useState('model')   // 'model' | 'camera'
  const [errorMessage, setErrorMessage] = useState(null)

  // Detection loop — called every animation frame
  const loop = useCallback(() => {
    if (!isRunningRef.current) return

    // Pause inference while the tab is hidden to save CPU/GPU
    if (!document.hidden) {
      const now     = performance.now()
      const video   = videoRef.current
      const landmarker = landmarkerRef.current

      if (
        video && landmarker &&
        video.readyState >= 2 && !video.paused && !video.ended &&
        video.currentTime !== lastVideoTimeRef.current &&
        now - lastInferenceTimeRef.current >= MIN_FRAME_MS
      ) {
        lastVideoTimeRef.current     = video.currentTime
        lastInferenceTimeRef.current = now

        const result = landmarker.detectForVideo(video, now)

        const parsed = { left: null, right: null }
        result.handednesses.forEach((handedness, i) => {
          const side = toUserSide(handedness[0].categoryName)
          parsed[side] = result.landmarks[i]
        })
        setHands(parsed)
      }
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      // ── 1. Load MediaPipe model (GPU → CPU fallback) ──────────────────────
      setLoadingStep('model')
      let landmarker
      const options = {
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }

      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          ...options,
        })
      } catch {
        try {
          const vision = await FilesetResolver.forVisionTasks(WASM_URL)
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
            ...options,
          })
        } catch (err) {
          if (!cancelled) {
            setStatus('error')
            setErrorMessage('Failed to load hand tracking model. Check your connection and reload.')
          }
          return
        }
      }

      if (cancelled) { landmarker.close(); return }
      landmarkerRef.current = landmarker

      // ── 2. Start webcam ───────────────────────────────────────────────────
      setLoadingStep('camera')
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false,
        })
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(
            err.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow access and reload.'
              : 'Webcam not found. Connect a camera and reload.'
          )
        }
        return
      }

      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

      const video = videoRef.current
      if (!video) return
      video.srcObject = stream

      try {
        await video.play()
      } catch {
        return
      }

      if (cancelled) return

      // ── 3. Start detection loop ───────────────────────────────────────────
      isRunningRef.current = true
      setStatus('ready')
      rafRef.current = requestAnimationFrame(loop)
    }

    init()

    return () => {
      cancelled = true
      isRunningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      landmarkerRef.current?.close()
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop())
    }
  }, [loop])

  return { videoRef, hands, status, loadingStep, errorMessage }
}
