import {useEffect, useRef, useState} from 'react'
import {demoConfig, loadDemo} from './demo'
import {useFit} from '@/editor/use-fit'
import {cn} from '@/lib/utils'

const ratioOf: Record<string, number> = {vertical: 9 / 16, feed: 4 / 5, square: 1, wide: 16 / 9}

// One live canvas. It plays only while it is on screen, and shows a single still with reduced motion.
export function LiveStage({preset, format, long = 960, fill = false, className, bg}: {preset: string; format: string; long?: number; fill?: boolean; className?: string; bg?: Record<string, any>}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [demo, setDemo] = useState<any>(null)
  const fit = useFit(ratioOf[format])
  useEffect(() => { loadDemo().then(setDemo) }, [])
  useEffect(() => {
    if (!demo || !canvas.current) return
    const cfg = demoConfig({preset, format, ...bg}), total = demo.duration(cfg)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const paint = (t: number) => demo.draw(canvas.current, cfg, demo.images, t, {long})
    if (reduced) { paint(total * (demo.presets[preset]?.still ?? 0.3)); return }
    let raf = 0, visible = true, last = 0
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(canvas.current)
    const tick = (now: number) => { if (visible && now - last > 33) { paint((now / 1000 + total * (demo.presets[preset]?.still ?? 0.3)) % total); last = now } raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [demo, preset, format, long, bg])
  // `fill` sizes the stage to the room its parent leaves, like the editor preview; otherwise it takes its parent's width.
  const body = <canvas ref={canvas} aria-hidden="true" className="block size-full" />
  if (!fill) return <div className={cn('overflow-hidden bg-muted', className)} style={{aspectRatio: String(ratioOf[format])}}>{body}</div>
  return (
    <div ref={fit.ref} className={cn('grid place-items-center', className)}>
      <div className="overflow-hidden rounded-[12px] bg-muted" style={{width: fit.w || undefined, height: fit.h || undefined}}>{body}</div>
    </div>
  )
}

// A small still of a motion, drawn once.
export function Still({preset}: {preset: string}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let alive = true
    loadDemo().then(demo => { if (alive && canvas.current) { const cfg = demoConfig({preset, format: 'wide'}); demo.draw(canvas.current, cfg, demo.images, demo.presets[preset].still * demo.duration(cfg), {long: 260}) } })
    return () => { alive = false }
  }, [preset])
  return <canvas ref={canvas} width={16} height={9} aria-hidden="true" className="block aspect-video w-full bg-muted" />
}
