// Draws the regional weather chart: land as dots, isobars with labels, highs
// and lows, a route, and the listening point with its trail.

import { contours } from 'd3-contour'
import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { STEP, LAT_SPAN, LON_SPAN, LINE, pressureAt, extremes } from './field.js'

const UP = 4 // grid upsampling, for smooth lines
const land = feature(world, world.objects.countries).features

export function createChart(canvas, { onPointer }) {
  const g = canvas.getContext('2d')
  let region = null
  let grid = null
  let lines = [] // { level, path: Path2D, label: [x, y] }
  let marks = []
  let landLayer = null
  let W = 0, H = 0, dpr = 1
  let hover = null

  const x = (lon) => ((lon - region.lon0) / LON_SPAN) * W
  const y = (lat) => ((region.lat1 - lat) / LAT_SPAN) * H
  const toGeo = (px, py) => ({ lon: region.lon0 + (px / W) * LON_SPAN, lat: region.lat1 - (py / H) * LAT_SPAN })

  function resize() {
    if (!region) return
    W = canvas.parentElement.clientWidth
    const coslat = Math.cos((((region.lat0 + region.lat1) / 2) * Math.PI) / 180)
    H = Math.round(Math.min(W * (LAT_SPAN / (LON_SPAN * coslat)), window.innerHeight * 0.72))
    dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.height = `${H}px`
    buildLand()
    buildLines()
  }

  // Land as a dot matrix: paint the countries, then sample the paint
  function buildLand() {
    const mask = document.createElement('canvas')
    mask.width = W
    mask.height = H
    const m = mask.getContext('2d', { willReadFrequently: true })
    for (const f of land) {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
      for (const rings of polys) {
        for (const shift of [-360, 0, 360]) {
          m.beginPath()
          for (const ring of rings) {
            let prev = null
            ring.forEach(([lon, lat], i) => {
              let L = lon + shift
              if (prev != null && Math.abs(L - prev) > 180) L += L > prev ? -360 : 360 // shapes across 180°
              prev = L
              m[i ? 'lineTo' : 'moveTo'](x(L), y(lat))
            })
            m.closePath()
          }
          m.fill('evenodd')
        }
      }
    }
    const px = m.getImageData(0, 0, W, H).data
    landLayer = document.createElement('canvas')
    landLayer.width = W * dpr
    landLayer.height = H * dpr
    const l = landLayer.getContext('2d')
    l.scale(dpr, dpr)
    l.fillStyle = '#3b3f5c'
    const gap = Math.max(6, W / 120)
    for (let py = gap / 2; py < H; py += gap) {
      for (let pxx = gap / 2; pxx < W; pxx += gap) {
        if (px[(Math.floor(py) * W + Math.floor(pxx)) * 4 + 3] > 100) {
          l.beginPath()
          l.arc(pxx, py, gap * 0.22, 0, 7)
          l.fill()
        }
      }
    }
  }

  // Isobars every 4 hPa from the upsampled grid
  function buildLines() {
    if (!grid || !W) return
    const r = region
    const n = (r.nx - 1) * UP + 1, m = (r.ny - 1) * UP + 1
    const values = new Float64Array(n * m)
    for (let j = 0; j < m; j++) {
      const lat = r.lat1 - (j / UP) * STEP // row 0 is the top (north)
      for (let i = 0; i < n; i++) values[j * n + i] = pressureAt(grid, lat, r.lon0 + (i / UP) * STEP)
    }
    const lo = Math.ceil(grid.min / LINE) * LINE, hi = Math.floor(grid.max / LINE) * LINE
    const levels = []
    for (let v = lo; v <= hi; v += LINE) levels.push(v)
    const sx = W / (n - 1), sy = H / (m - 1)
    const onEdge = ([a, b]) => a <= 0.5001 || a >= n - 0.5001 || b <= 0.5001 || b >= m - 0.5001
    lines = contours().size([n, m]).thresholds(levels)(values).map((c) => {
      const path = new Path2D()
      let best = null, bestLen = 0
      for (const poly of c.coordinates) {
        for (const ring of poly) {
          let run = []
          const flush = () => {
            if (run.length > 1) {
              run.forEach(([a, b], k) => path[k ? 'lineTo' : 'moveTo']((a - 0.5) * sx, (b - 0.5) * sy))
              if (run.length > bestLen) {
                bestLen = run.length
                const [a, b] = run[Math.floor(run.length / 2)]
                best = [(a - 0.5) * sx, (b - 0.5) * sy]
              }
            }
            run = []
          }
          for (const pt of ring) {
            if (onEdge(pt)) flush()
            else run.push(pt)
          }
          flush()
        }
      }
      return { level: c.value, path, label: best }
    })
    marks = extremes(grid)
  }

  function setRegion(r) {
    region = r
    resize()
  }
  function setGrid(gr) {
    grid = gr
    buildLines()
  }

  function draw(st) {
    if (!region || !W) return
    const css = getComputedStyle(canvas)
    const accent = css.getPropertyValue('--accent').trim()
    const lineCol = css.getPropertyValue('--isobar').trim()
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.clearRect(0, 0, W, H)
    if (landLayer) g.drawImage(landLayer, 0, 0, W, H)
    if (!grid) return

    for (const L of lines) {
      const major = L.level % 20 === 0
      g.strokeStyle = lineCol
      g.globalAlpha = major ? 0.95 : 0.6
      g.lineWidth = major ? 1.8 : 1.1
      g.stroke(L.path)
    }
    g.globalAlpha = 1
    g.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const L of lines) {
      if (!L.label) continue
      const t = String(L.level)
      const w = g.measureText(t).width + 8
      g.fillStyle = '#0f1220d9'
      g.fillRect(L.label[0] - w / 2, L.label[1] - 7, w, 14)
      g.fillStyle = lineCol
      g.fillText(t, L.label[0], L.label[1])
    }
    g.font = 'bold 20px system-ui, sans-serif'
    for (const k of marks) {
      g.fillStyle = k.type === 'L' ? '#ff7b8a' : '#7cc6ff'
      g.fillText(k.type, x(k.lon), y(k.lat))
    }

    // Route
    if (st.route.length > 1) {
      g.strokeStyle = accent
      g.globalAlpha = 0.55
      g.setLineDash([5, 5])
      g.lineWidth = 1.5
      g.beginPath()
      st.route.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](x(p.lon), y(p.lat)))
      if (st.mode === 'route') g.closePath()
      g.stroke()
      g.setLineDash([])
      g.globalAlpha = 1
    }
    // Trail, fading out
    for (let i = 1; i < st.trail.length; i++) {
      const a = st.trail[i - 1], b = st.trail[i]
      if (Math.abs(a.lon - b.lon) > 10 || Math.abs(a.lat - b.lat) > 10) continue // wrapped
      g.strokeStyle = accent
      g.globalAlpha = (i / st.trail.length) * 0.7
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(x(a.lon), y(a.lat))
      g.lineTo(x(b.lon), y(b.lat))
      g.stroke()
    }
    g.globalAlpha = 1
    // The listening point, ringed briefly when it crosses a line
    const px = x(st.point.lon), py = y(st.point.lat)
    if (st.pulse > 0.02) {
      g.strokeStyle = accent
      g.globalAlpha = st.pulse
      g.lineWidth = 2
      g.beginPath()
      g.arc(px, py, 10 + (1 - st.pulse) * 26, 0, 7)
      g.stroke()
      g.globalAlpha = 1
    }
    g.fillStyle = accent
    g.shadowColor = accent
    g.shadowBlur = 14
    g.beginPath()
    g.arc(px, py, 6.5, 0, 7)
    g.fill()
    g.shadowBlur = 0
    g.strokeStyle = '#0f1220'
    g.lineWidth = 2
    g.stroke()

    if (hover) {
      const p = pressureAt(grid, hover.lat, hover.lon)
      const t = `${p.toFixed(1)} hPa`
      g.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace'
      const w = g.measureText(t).width + 12
      const hx = Math.min(W - w - 4, hover.px + 12), hy = Math.max(14, hover.py - 14)
      g.fillStyle = '#1a1e33ee'
      g.fillRect(hx, hy - 10, w, 20)
      g.fillStyle = '#e8e9f3'
      g.textAlign = 'left'
      g.fillText(t, hx + 6, hy)
    }
  }

  // Pointer: the main script decides what a press or drag means in each mode
  const at = (e) => {
    const b = canvas.getBoundingClientRect()
    const px = e.clientX - b.left, py = e.clientY - b.top
    return { ...toGeo(px, py), px, py }
  }
  let down = false
  canvas.addEventListener('pointerdown', (e) => {
    down = true
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {}
    onPointer('down', at(e))
  })
  canvas.addEventListener('pointermove', (e) => {
    hover = at(e)
    if (down) onPointer('move', hover)
  })
  const up = (e) => {
    if (!down) return
    down = false
    onPointer('up', at(e))
  }
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('pointerleave', () => (hover = null))
  new ResizeObserver(resize).observe(canvas.parentElement)

  return { setRegion, setGrid, draw }
}
