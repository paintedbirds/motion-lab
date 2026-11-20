// Built-in example images: abstract art drawn here, so there is no text and no interface to crop wrongly.
// Each one is a full-bleed square with its subject in the middle, so any card shape (9:16 to 16:9) frames it well.
export const RECOMMENDED = 5

const SIZE = 1600
const palettes = [
  ['#ff6a2b', '#ffb36b', '#f2c6d9', '#1b2a49', '#0d0e10'],
  ['#c8f03c', '#2fbf9b', '#294a87', '#7c4dff', '#0d0e10'],
]
const rng = (seed: number) => { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280 }

function grain(g: CanvasRenderingContext2D, W: number, H: number, amount: number) {
  const n = document.createElement('canvas'); n.width = n.height = 256
  const x = n.getContext('2d')!, d = x.createImageData(256, 256), r = rng(7)
  for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 }
  x.putImageData(d, 0, 0)
  g.save(); g.globalAlpha = amount; g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(n, 'repeat')!; g.fillRect(0, 0, W, H); g.restore()
}
function blob(g: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha = 0.9) {
  const k = g.createRadialGradient(x, y, 0, x, y, radius)
  k.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0')); k.addColorStop(1, color + '00')
  g.fillStyle = k; g.fillRect(0, 0, SIZE, SIZE)
}

type Paint = (g: CanvasRenderingContext2D, p: string[], r: () => number) => void
const styles: Paint[] = [
  // Mesh gradient: soft blobs of colour.
  (g, p, r) => { g.fillStyle = p[4]; g.fillRect(0, 0, SIZE, SIZE); for (let i = 0; i < 5; i++) blob(g, SIZE * (0.15 + r() * 0.7), SIZE * (0.15 + r() * 0.7), SIZE * (0.45 + r() * 0.3), p[i % 4]) },
  // Waves: stacked bands of colour.
  (g, p, r) => {
    const k = g.createLinearGradient(0, 0, 0, SIZE); k.addColorStop(0, p[3]); k.addColorStop(1, p[4]); g.fillStyle = k; g.fillRect(0, 0, SIZE, SIZE)
    for (let b = 0; b < 6; b++) {
      const base = SIZE * (0.3 + b * 0.12), amp = SIZE * (0.05 + r() * 0.05), f = 1 + r() * 1.5, ph = r() * 6.28
      g.fillStyle = p[b % 3]; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(0, SIZE)
      for (let x = 0; x <= SIZE; x += 16) g.lineTo(x, base + Math.sin(x / SIZE * 6.28 * f + ph) * amp)
      g.lineTo(SIZE, SIZE); g.fill()
    }
    g.globalAlpha = 1
  },
  // Rings: concentric circles.
  (g, p, r) => {
    g.fillStyle = '#f3ead8'; g.fillRect(0, 0, SIZE, SIZE); const cx = SIZE * (0.45 + r() * 0.1), cy = SIZE * (0.45 + r() * 0.1)
    for (let i = 9; i >= 1; i--) { g.fillStyle = i % 2 ? p[i % 3] : '#f3ead8'; g.beginPath(); g.arc(cx, cy, i * SIZE * 0.065, 0, 7); g.fill() }
    g.fillStyle = p[4]; g.beginPath(); g.arc(cx, cy, SIZE * 0.05, 0, 7); g.fill()
  },
  // Aurora: glowing light on black.
  (g, p, r) => { g.fillStyle = '#07080a'; g.fillRect(0, 0, SIZE, SIZE); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) blob(g, SIZE * (0.2 + r() * 0.6), SIZE * (0.2 + r() * 0.6), SIZE * (0.4 + r() * 0.25), p[i], 0.7); g.globalCompositeOperation = 'source-over' },
  // Bauhaus: flat geometric shapes.
  (g, p, r) => {
    g.fillStyle = '#efe7da'; g.fillRect(0, 0, SIZE, SIZE); const u = SIZE / 8
    g.fillStyle = p[0]; g.beginPath(); g.arc(u * 3.4, u * 3.6, u * 1.9, 0, 7); g.fill()
    g.fillStyle = p[3]; g.fillRect(u * 3.6, u * 3.2, u * 2.4, u * 2.4)
    g.fillStyle = p[1]; g.beginPath(); g.arc(u * 5.8, u * 3.4, u * 1.3, Math.PI, 0); g.fill()
    g.fillStyle = p[4]; g.beginPath(); g.arc(u * 2.6, u * 5.6, u * 0.55, 0, 7); g.fill()
    g.strokeStyle = p[4]; g.lineWidth = u * 0.09; g.beginPath(); g.moveTo(u * 2, u * 2.2); g.lineTo(u * 6.2, u * 6.4); g.stroke()
    void r
  },
  // Halftone: a field of dots that swell towards the middle.
  (g, p, r) => {
    g.fillStyle = p[4]; g.fillRect(0, 0, SIZE, SIZE); g.fillStyle = p[0]; const step = SIZE / 28, ox = SIZE * (0.4 + r() * 0.2), oy = SIZE * (0.4 + r() * 0.2)
    for (let y = step / 2; y < SIZE; y += step) for (let x = step / 2; x < SIZE; x += step) { const d = Math.hypot(x - ox, y - oy) / (SIZE * 0.7); g.beginPath(); g.arc(x, y, Math.max(0, (1 - d) * step * 0.52), 0, 7); g.fill() }
  },
]

// The Motion Lab mark: a full dot and a ring, side by side, in the middle of the picture.
// It stays in the middle third so every card shape keeps it.
function mark(g: CanvasRenderingContext2D, color: string) {
  const dot = SIZE * 0.06, ring = SIZE * 0.05, gap = SIZE * 0.03, line = SIZE * 0.014, x0 = SIZE / 2 - (dot * 2 + gap + ring * 2) / 2
  g.fillStyle = color; g.beginPath(); g.arc(x0 + dot, SIZE / 2, dot, 0, 7); g.fill()
  g.strokeStyle = color; g.lineWidth = line; g.beginPath(); g.arc(x0 + dot * 2 + gap + ring, SIZE / 2, ring - line / 2, 0, 7); g.stroke()
}
// Variants that carry the mark, and the colour it takes on that background.
const marked: Record<number, string> = {0: '#f3ead8', 3: '#f3ead8', 7: '#f3ead8', 5: '#f3ead8', 10: '#0d0e10'}

// `variant` 0 to 11: six styles in two palettes.
export function abstractImage(variant: number): string {
  const c = document.createElement('canvas'); c.width = c.height = SIZE
  const g = c.getContext('2d')!
  styles[variant % 6](g, palettes[Math.floor(variant / 6) % 2], rng(variant + 3))
  if (marked[variant]) mark(g, marked[variant])
  grain(g, SIZE, SIZE, 0.18)
  return c.toDataURL('image/jpeg', 0.92)
}
// Used when empty slots are filled: a different one each time.
export const templateImage = (n: number) => abstractImage((n - 1) % 12)
