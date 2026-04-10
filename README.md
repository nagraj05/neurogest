<div align="center">

```
███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗  ██████╗ ███████╗███████╗████████╗
████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗██╔════╝ ██╔════╝██╔════╝╚══██╔══╝
██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██║  ███╗█████╗  ███████╗   ██║   
██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██║   ██║██╔══╝  ╚════██║   ██║   
██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝╚██████╔╝███████╗███████║   ██║   
╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝   
```

**Control everything with your hands. No mouse. No touch. Just gestures.**  
Draw in mid-air. Explore the solar system. Powered by your webcam.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.183-black?style=flat-square&logo=threedotjs&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-0097A7?style=flat-square&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## ✦ What is NeuroGest?

NeuroGest is a browser-based gesture playground that tracks your hands through your webcam and turns them into meaningful input — no hardware, no plugins, no setup beyond pointing a camera at yourself.

Two experiences live inside it:

- **✍️ Air Drawing** — paint strokes in the air with your index finger, drag them around with a pinch, undo with a peace sign
- **🪐 Solar System** — navigate a live 3D orrery, rotate planets with your hand, zoom in, and tap to inspect every world

Everything runs locally in your browser. Nothing is recorded or sent anywhere.

---

## ✦ Features

| | |
|---|---|
| 🖐️ **Two-hand tracking** | MediaPipe tracks both hands at 30 fps — drawing hand and control hand work independently |
| ✍️ **Air Drawing** | Paint strokes with your index finger; solid, dashed, or dotted; 8 brush colors; glitter mode |
| 🤏 **Pinch-to-drag** | Pinch near any stroke to grab and reposition it |
| ↩️ **Gesture undo & clear** | Peace sign to undo; open palm held 1.5 s to wipe the canvas |
| 🪐 **3D Solar System** | Real orbital speeds and sizes; Saturn's rings; smooth camera momentum |
| 🔭 **Planet detail modals** | Click any planet to open a mini 3D viewer with real facts |
| 🤟 **Panel toggle** | Three-finger gesture opens/closes the side panel from either hand |
| 📷 **Camera overlay modes** | Show your feed fully, dimmed, or hidden while still tracking |
| 💾 **Stroke persistence** | Your drawing survives page refreshes (cleared on tab close) |
| ↓ **PNG export** | Save your artwork as a full-resolution PNG in one click |

---

## ✦ Requirements

- **Modern desktop browser** (Chrome or Edge recommended — requires WebAssembly + MediaPipe WASM)
- **Webcam** — laptop built-in or external USB, any resolution
- **Good lighting** on your hands

> Mobile and touch screens are not supported.

---

## ✦ Getting Started

```bash
# 1. Clone
git clone https://github.com/nagraj05/neurogest.git
cd neurogest

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser, allow webcam access, and you're in.

```bash
npm run build      # production build → dist/
npm run preview    # preview the production build locally
npm run lint       # ESLint check
```

---

## ✦ Gesture Reference

### ✍️ Air Drawing

| Gesture | Action |
|---|---|
| ☝️ Index finger extended | **Pen down** — draw a stroke |
| ✊ Fist / lower index | **Pen up** — stop drawing |
| 🤏 Pinch near a stroke | **Grab & drag** that stroke |
| ✌️ Peace sign (hold 0.5 s) | **Undo** last stroke — either hand |
| 🖐️ Open palm (hold 1.5 s) | **Clear** all strokes — either hand |
| 🤟 3 fingers (mid + ring up) | **Toggle** side panel — either hand |

### 🪐 Solar System

| Gesture | Action |
|---|---|
| 🤏 Pinch + move | **Rotate** the scene |
| 🤏 Pinch + spread/close | **Zoom** in and out |
| 🤏 Tap a planet (quick pinch-release) | **Open** planet detail |
| 🖐️ Open palm | **Reset** camera to default view |
| 🤏+🤏 Both hands pinch + spread | **Two-hand zoom** |

> **Mirror note:** the camera feed is flipped like a mirror. Your left hand appears on the right side of the screen — just move naturally.

---

## ✦ Project Structure

```
neurogest/
├── src/
│   ├── pages/
│   │   ├── Home.jsx              ← Landing page / feature picker
│   │   ├── Draw.jsx              ← Air Drawing page
│   │   └── Solar.jsx             ← Solar System page
│   ├── features/
│   │   ├── draw/
│   │   │   ├── useDrawing.js     ← Stroke state, drag, undo, clear logic
│   │   │   ├── DrawCanvas.jsx    ← rAF render loop (Canvas 2D)
│   │   │   ├── DrawIntro.jsx     ← First-run intro with gesture guide
│   │   │   ├── SidePanel.jsx     ← Color picker, brush, glitter controls
│   │   │   └── drawUtils.js      ← Stroke/particle/cursor rendering helpers
│   │   └── solar/
│   │       ├── SolarCanvas.jsx   ← Three.js scene, camera, raycaster
│   │       ├── PlanetModal.jsx   ← Detail overlay with mini 3D viewer
│   │       ├── PlanetViewer.jsx  ← Isolated planet Three.js canvas
│   │       └── planetData.js     ← Facts for all 8 planets
│   ├── hooks/
│   │   ├── useHandTracking.js    ← Webcam + MediaPipe inference (30 fps)
│   │   ├── useGesture.js         ← Per-hand classifier (EMA + hysteresis)
│   │   └── useTwoHandGesture.js  ← Cross-hand state (two-hand pinch/zoom)
│   └── components/
│       ├── HandCamera/           ← Video feed + skeleton debug overlay
│       └── GestureHintBar/       ← Live gesture indicator at top of screen
├── vercel.json                   ← SPA rewrite rule
└── vite.config.js
```

---

## ✦ How It Works

```
Webcam
  └─► MediaPipe Tasks Vision (WASM, off main thread, 30 fps)
        └─► useHandTracking  →  { left: Landmark[21], right: Landmark[21] }
                └─► useGesture(hand)          per-hand: pinch, peace, index, fist…
                └─► useTwoHandGesture(l, r)   cross-hand: two-hand pinch/zoom
                        ├─► /draw  →  Canvas 2D — strokes, particles, cursors
                        └─► /solar →  Three.js — rotation, zoom, raycaster
```

Gesture classification uses **exponential moving average (EMA) smoothing** with **hysteresis** (separate ON / OFF thresholds) to prevent rapid flicker between states. Hold-based gestures (peace sign, open palm) use a timer that resets if the gesture breaks, so accidental frames don't trigger them.

---

## ✦ Deployment

The app is configured for **Vercel** with a SPA rewrite rule so `/draw` and `/solar` deep-links work correctly.

```bash
# Deploy via Vercel CLI
npx vercel

# Or connect your GitHub repo at vercel.com for automatic deploys
```

`vercel.json` already contains:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## ✦ Debug Mode

Append `?debug=1` to any URL to see:
- Live hand skeleton overlaid on the camera feed
- Gesture state panel (confidence scores for each gesture per hand)

```
http://localhost:5173/draw?debug=1
http://localhost:5173/solar?debug=1
```

---

## ✦ Tech Stack

| Library | Version | Used for |
|---|---|---|
| [React](https://react.dev) | 19 | UI, state, component tree |
| [Vite](https://vitejs.dev) | 8 | Dev server, bundler |
| [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) | 0.10 | Hand landmark detection |
| [Three.js](https://threejs.org) | 0.183 | 3D solar system rendering |
| [react-colorful](https://github.com/omgovich/react-colorful) | 5.6 | Color picker in side panel |
| [React Router](https://reactrouter.com) | 7 | Client-side routing |

---

<div align="center">

Made with ♥ — because mice are overrated.

</div>
