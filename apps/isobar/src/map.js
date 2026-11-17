// A stylised world map for picking a location. Land is drawn as a dot matrix
// (lit where it is daytime); there are no city markers. Point anywhere to see
// where you are, click to choose it.

import { feature } from 'topojson-client'
import world from 'world-atlas/countries-110m.json'
import { sunElevation } from './weather.js'
import { CITIES } from './cities.js'

const LAT_TOP = 84
const LAT_BOTTOM = -58
const STEP = 2 // degrees between dots
const NEAR_KM = 250

const countries = feature(world, world.objects.countries).features.map((f) => ({
  name: f.properties.name,
  polygons: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((rings) => {
    // A few shapes (far-east Russia, Fiji) straddle the 180° line. Shift their
    // western half east so they stay in one piece instead of smearing across the map.
    const lons = rings[0].map((pt) => pt[0])
    if (Math.max(...lons) - Math.min(...lons) > 300) {
      rings = rings.map((ring) => ring.map(([x, y]) => [x < 0 ? x + 360 : x, y]))
    }
    let x0 = 540, x1 = -180, y0 = 90, y1 = -90
    for (const [x, y] of rings[0]) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
    return { rings, x0, x1, y0, y1 }
  }),
}))

function inRing(ring, x, y) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function countryAt(lon, lat) {
  for (const c of countries) {
    for (const p of c.polygons) {
      if (p.x1 > 180 && lon < 0) lon += 360
      else if (p.x1 <= 180 && lon > 180) lon -= 360
      if (lon < p.x0 || lon > p.x1 || lat < p.y0 || lat > p.y1) continue
      if (inRing(p.rings[0], lon, lat) && !p.rings.slice(1).some((hole) => inRing(hole, lon, lat))) return c.name
    }
  }
  return null
}

function nearestCity(lon, lat) {
  const rad = Math.PI / 180
  let best = null
  for (const [name, country, clat, clon] of CITIES) {
    const a = Math.sin(((clat - lat) * rad) / 2) ** 2
      + Math.cos(lat * rad) * Math.cos(clat * rad) * Math.sin(((clon - lon) * rad) / 2) ** 2
    const km = 12742 * Math.asin(Math.sqrt(a))
    if (!best || km < best.km) best = { name, country, km }
  }
  return best
}

const coords = (lon, lat) =>
  `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`

export function describe(lon, lat) {
  const city = nearestCity(lon, lat)
  if (city && city.km < NEAR_KM) return `Near ${city.name}, ${city.country}`
  return countryAt(lon, lat) ?? 'Open sea'
}

// Which grid points are land: paint the countries small, then read the pixels.
function landDots() {
  const scale = 2
  const c = document.createElement('canvas')
  c.width = 360 * scale
  c.height = (LAT_TOP - LAT_BOTTOM) * scale
  const g = c.getContext('2d', { willReadFrequently: true })
  for (const country of countries) {
    for (const p of country.polygons) {
      // Shapes that straddle 180° are painted twice, once at each edge
      for (const shift of p.x1 > 180 ? [0, -360] : [0]) {
        g.beginPath()
        for (const ring of p.rings) {
          ring.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo']((x + shift + 180) * scale, (LAT_TOP - y) * scale))
          g.closePath()
        }
        g.fill('evenodd')
      }
    }
  }
  const px = g.getImageData(0, 0, c.width, c.height).data
  const dots = []
  for (let lat = LAT_TOP - STEP / 2; lat > LAT_BOTTOM; lat -= STEP) {
    for (let lon = -180 + STEP / 2; lon < 180; lon += STEP) {
      const i = (Math.floor((LAT_TOP - lat) * scale) * c.width + Math.floor((lon + 180) * scale)) * 4
      if (px[i + 3] > 100) dots.push([lon, lat])
    }
  }
  return dots
}

export function createMap(el, { onPick }) {
  el.innerHTML = `
    <div class="map-frame">
      <canvas></canvas>
      <div class="map-marker" hidden></div>
      <div class="map-cursor" hidden></div>
      <div class="map-tip" hidden><strong></strong><span></span></div>
    </div>
    <p class="hint">Lit dots are in daylight right now. Point anywhere to see where it is, then click to play that place's weather.</p>`
  const frame = el.querySelector('.map-frame')
  const canvas = el.querySelector('canvas')
  const marker = el.querySelector('.map-marker')
  const cursor = el.querySelector('.map-cursor')
  const tip = el.querySelector('.map-tip')
  const g = canvas.getContext('2d')
  const dots = landDots()
  let place = null

  const toXY = (lon, lat, w, h) => [((lon + 180) / 360) * w, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * h]

  function draw() {
    const w = frame.clientWidth
    if (!w) return // hidden
    const h = Math.round((w * (LAT_TOP - LAT_BOTTOM)) / 360)
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.height = `${h}px`
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    const now = Date.now() / 1000
    const r = Math.max(0.9, (w / 180) * 0.34)
    for (const [lon, lat] of dots) {
      // 0 in full night, 1 in full day, with a soft band at twilight
      const day = Math.min(1, Math.max(0, (sunElevation(now, lat, lon) + 10) / 20))
      g.fillStyle = `rgb(${62 + day * 179}, ${78 + day * 107}, ${98 - day * 13})`
      const [x, y] = toXY(lon, lat, w, h)
      g.beginPath()
      g.arc(x, y, r, 0, 7)
      g.fill()
    }
    showMarker()
  }

  function showMarker() {
    const visible = place && place.lat < LAT_TOP && place.lat > LAT_BOTTOM
    marker.hidden = !visible
    if (!visible) return
    const [x, y] = toXY(place.lon, place.lat, frame.clientWidth, frame.clientHeight)
    marker.style.left = `${x}px`
    marker.style.top = `${y}px`
  }

  function locate(e) {
    const box = frame.getBoundingClientRect()
    const x = Math.min(box.width, Math.max(0, e.clientX - box.left))
    const y = Math.min(box.height, Math.max(0, e.clientY - box.top))
    const lon = Math.min(179.99, (x / box.width) * 360 - 180)
    const lat = LAT_TOP - (y / box.height) * (LAT_TOP - LAT_BOTTOM)
    return { x, y, lon, lat, width: box.width }
  }

  frame.addEventListener('pointermove', (e) => {
    const p = locate(e)
    cursor.hidden = tip.hidden = false
    cursor.style.left = `${p.x}px`
    cursor.style.top = `${p.y}px`
    tip.firstElementChild.textContent = describe(p.lon, p.lat)
    tip.lastElementChild.textContent = coords(p.lon, p.lat)
    // Keep the label on the map: flip it to the left near the right edge
    const flip = p.x > p.width - 190
    tip.style.left = `${p.x}px`
    tip.style.top = `${p.y}px`
    tip.classList.toggle('flip', flip)
    tip.classList.toggle('below', p.y < 60)
  })
  frame.addEventListener('pointerleave', () => (cursor.hidden = tip.hidden = true))
  frame.addEventListener('click', (e) => {
    const p = locate(e)
    const lat = Math.round(p.lat * 100) / 100, lon = Math.round(p.lon * 100) / 100
    onPick({ name: `${describe(lon, lat)} (${coords(lon, lat)})`, lat, lon })
  })

  new ResizeObserver(draw).observe(frame)
  setInterval(draw, 60000) // the daylight line moves
  return {
    setPlace(p) {
      place = p
      showMarker()
    },
  }
}
