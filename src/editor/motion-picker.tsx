import {useEffect, useRef, useState} from 'react'
import {ChevronDown} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {ScrollArea} from '@/components/ui/scroll-area'
import {cn} from '@/lib/utils'
import {draw, duration, presets} from './use-editor'

const families = ['Protagonista', 'Murales y grillas', 'Anillos y carruseles', 'Profundidad y revelados', 'Escenas encadenadas', 'Primeras pruebas']
const smalls = new WeakMap<object, HTMLCanvasElement>()

// Small copy of an image so the stills of the picker stay cheap to draw.
function small(a: any) {
  let copy = smalls.get(a.img)
  if (!copy) {
    const k = Math.min(1, 320 / Math.max(a.img.width, a.img.height))
    copy = document.createElement('canvas')
    copy.width = Math.max(1, Math.round(a.img.width * k)); copy.height = Math.max(1, Math.round(a.img.height * k))
    copy.getContext('2d')!.drawImage(a.img, 0, 0, copy.width, copy.height); smalls.set(a.img, copy)
  }
  return {img: copy, selected: a.selected, crop: a.crop}
}

function Still({id, config, images, stamp, active, onPick}: {id: string; config: any; images: any[]; stamp: string; active: boolean; onPick: () => void}) {
  const box = useRef<HTMLButtonElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), {rootMargin: '120px'})
    if (box.current) io.observe(box.current)
    return () => io.disconnect()
  }, [])
  // Each button shows a still of its own scene, made with the current images, format and colours.
  useEffect(() => {
    if (!seen || !canvas.current || !images.length) return
    const preview = {...config, preset: id}
    draw(canvas.current, preview, images.map(small), presets[id].still * duration(preview), {long: 240})
  }, [seen, stamp, id])
  return (
    <button ref={box} type="button" aria-pressed={active} onClick={onPick}
      className={cn('group rounded-xl border border-border bg-card p-1.5 text-left outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground')}>
      <canvas ref={canvas} width={16} height={10} aria-hidden="true" className="aspect-[16/10] w-full rounded-md bg-stage object-contain" />
      <strong className="mt-2 block px-1 pb-1 text-xs font-medium">{presets[id].name}</strong>
    </button>
  )
}

export function MotionPicker({config, images, version, choose}: {config: any; images: any[]; version: number; choose: (k: string, v: any) => void}) {
  // Wait a moment after a change so dragging a slider does not redraw every still on each step.
  const look = [version, config.format, config.ratio, config.scale, config.intensity, config.effect, config.frame, config.top, config.bottom, config.bgMode, config.bgMotion, config.bgFromImages, config.bgBlur, config.bgDim, config.bgImage?.length].join('|')
  const [stamp, setStamp] = useState(look)
  useEffect(() => { const t = setTimeout(() => setStamp(look), 160); return () => clearTimeout(t) }, [look])

  const entries = Object.entries(presets) as [string, any][]
  const groups = new Map<string, string[]>([['Favoritos', entries.filter(([, p]) => p.main).map(([k]) => k)]])
  for (const [k, p] of entries) if (!p.main) groups.set(p.group || 'Otros', [...(groups.get(p.group || 'Otros') || []), k])
  const order = ['Favoritos', ...families, ...[...groups.keys()].filter(g => g !== 'Favoritos' && !families.includes(g))]

  const current = order.find(g => groups.get(g)?.includes(config.preset))
  const [open, setOpen] = useState<string[]>(() => ['Favoritos', ...(current && current !== 'Favoritos' ? [current] : [])])
  const toggle = (g: string) => setOpen(o => (o.includes(g) ? o.filter(x => x !== g) : [...o, g]))
  const all = order.filter(g => groups.has(g))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-medium">Movimientos <span className="font-normal tabular-nums text-muted-foreground">{entries.length}</span></h2>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setOpen(open.length ? [] : all)}>{open.length ? 'Colapsar todo' : 'Expandir todo'}</Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 lg:h-0">
        <div className="grid gap-1 p-2">
          {all.map(g => {
            const isOpen = open.includes(g)
            return (
              <section key={g}>
                <button type="button" aria-expanded={isOpen} onClick={() => toggle(g)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="truncate">{g}</span><span className="tabular-nums opacity-70">{groups.get(g)!.length}</span>
                  <ChevronDown className={cn('ml-auto size-4 shrink-0 transition-transform', !isOpen && '-rotate-90')} />
                </button>
                {isOpen && (
                  <div className="grid grid-cols-2 gap-2 px-1 pb-3 pt-1">
                    {groups.get(g)!.map(id => <Still key={id} id={id} config={config} images={images} stamp={stamp} active={config.preset === id} onPick={() => choose('preset', id)} />)}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
