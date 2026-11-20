import {useEffect, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogTitle} from '@/components/ui/dialog'
import {Slider} from '@/components/ui/slider'
import {Label} from '@/components/ui/label'
// @ts-ignore the engine is plain JavaScript
import {frame, CROP} from '@engine/motion.js'

// The image inside a card of the shape in use, with a grid of thirds. Dragging moves the image,
// the slider zooms, and nothing changes in the video until "Aplicar".
export function CropDialog({index, ed, onClose}: {index: number | null; ed: any; onClose: () => void}) {
  const open = index !== null
  const view = useRef<HTMLCanvasElement>(null)
  const grip = useRef<[number, number] | null>(null)
  const [draft, setDraft] = useState({...CROP})
  const [min, setMin] = useState(1)
  const [help, setHelp] = useState('')
  const [title, setTitle] = useState('')
  const [shape, setShape] = useState(1)
  const item = index !== null ? ed.images.current[index] : null

  // Size the canvas to the card shape and start from the saved framing.
  useEffect(() => {
    if (index === null || !item) return
    const {img, name} = item, cell = ed.cell.current || img.width / img.height, k = Math.min(720 / cell, 480)
    setShape(cell); setTitle('Encuadrar · ' + name); setDraft({...(ed.config.assets[index].crop || CROP)})
    // The slider starts where the whole image fits; 100% is where the image fills the card.
    const w = Math.round(k * cell), h = Math.round(k)
    const whole = Math.min(w / img.width, h / img.height) / Math.max(w / img.width, h / img.height)
    setMin(whole > 0.99 ? 1 : Math.floor(whole * 100) / 100)
    setHelp(`Así se ve en una tarjeta${ed.config.ratio === 'auto' ? '' : ' ' + ed.config.ratio}. Arrastrá la imagen para moverla.${whole > 0.99 ? '' : ' Con menos de 100% entra completa y el resto toma su color.'}`)
  }, [index])

  const size = () => { const k = Math.min(720 / shape, 480); return [Math.round(k * shape), Math.round(k)] as const }
  useEffect(() => {
    const c = view.current
    if (!c || !item) return
    const [w, h] = size(); c.width = w; c.height = h
    const g = c.getContext('2d')!
    g.clearRect(0, 0, w, h); frame(g, item.img, draft, 0, 0, w, h)
    for (const [color, shift] of [['#0000004d', 1], ['#ffffffb3', 0]] as const) {
      g.fillStyle = color
      for (const t of [1, 2]) { g.fillRect(Math.round(w * t / 3) + shift, 0, 1, h); g.fillRect(0, Math.round(h * t / 3) + shift, w, 1) }
    }
  }, [draft, shape, item, open])

  // How far the image overflows the card on each axis at the current zoom, in canvas pixels.
  const slack = () => {
    const [w, h] = size(), {img} = item
    const s = Math.max(Math.min(w / img.width, h / img.height), Math.max(w / img.width, h / img.height) * draft.zoom)
    return [img.width * s - w, img.height * s - h]
  }
  const nudge = (dx: number, dy: number) => {
    const [sx, sy] = slack(), lim = (v: number) => Math.max(0, Math.min(1, v))
    setDraft(d => ({...d, ...(sx > 1 ? {x: lim(d.x - dx / sx)} : {}), ...(sy > 1 ? {y: lim(d.y - dy / sy)} : {})}))
  }
  const apply = () => {
    const same = (Object.keys(CROP) as (keyof typeof CROP)[]).every(k => Math.abs(draft[k] - CROP[k]) < 0.005)
    // The default framing is not stored, so an untouched image stays as it was uploaded.
    ed.setCrop(index, same ? null : {...draft}); onClose()
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <div className="grid gap-1 pr-6"><DialogTitle>{title}</DialogTitle><DialogDescription>{help}</DialogDescription></div>
        <canvas ref={view} width={560} height={315} tabIndex={0} aria-label="Encuadre de la imagen. Arrastrá o usá las flechas para moverla dentro de la tarjeta."
          className="mx-auto block max-h-[min(480px,calc(100dvh-300px))] max-w-full cursor-grab touch-none rounded-lg bg-stage outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          onPointerDown={e => { grip.current = [e.clientX, e.clientY]; e.currentTarget.setPointerCapture(e.pointerId) }}
          onPointerMove={e => { if (!grip.current) return; const k = e.currentTarget.width / e.currentTarget.clientWidth; nudge((e.clientX - grip.current[0]) * k, (e.clientY - grip.current[1]) * k); grip.current = [e.clientX, e.clientY] }}
          onPointerUp={() => { grip.current = null }} onPointerCancel={() => { grip.current = null }}
          onKeyDown={e => { const s = ({ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12]} as any)[e.key]; if (s) { e.preventDefault(); nudge(s[0], s[1]) } }} />
        <div className="grid gap-1.5">
          <div className="flex justify-between"><Label htmlFor="crop-zoom">Zoom</Label><output className="text-xs tabular-nums">{Math.round(draft.zoom * 100)}%</output></div>
          <Slider id="crop-zoom" min={min} max={3} step={0.01} value={[draft.zoom]} onValueChange={([z]) => setDraft(d => ({...d, zoom: z}))} aria-label="Zoom" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="mr-auto" onClick={() => setDraft({...CROP})}>Restablecer</Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={apply}>Aplicar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
