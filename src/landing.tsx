import {useState} from 'react'
import {Link} from 'react-router-dom'
import {ArrowRight} from 'lucide-react'
import {Logo} from '@/components/logo'
import {LangSwitch} from '@/components/lang-switch'
import {cn} from '@/lib/utils'
import {LiveStage, Still} from '@/landing/live-stage'

const wrap = 'mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,48px)]'
const h2 = 'text-balance text-[clamp(2rem,4.6vw,3.8rem)] font-medium leading-[1.02] tracking-[-0.03em]'
const body = 'max-w-[52ch] text-pretty text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-muted-foreground'
const button = 'inline-flex h-12 items-center gap-2 rounded-[10px] bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-[transform,background-color] hover:bg-primary/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

const picks = [['showcase', 'Vitrina'], ['ticker', 'Ticker diagonal'], ['orbit', 'Órbita'], ['tunnel', 'Túnel'], ['globe', 'Planeta'], ['spotlight', 'Foco']]
const formats = [['wide', '16:9'], ['square', '1:1'], ['feed', '4:5'], ['vertical', '9:16']]
const four = [['vertical', '9:16', 'Reel y Story'], ['feed', '4:5', 'Feed retrato'], ['square', '1:1', 'Cuadrado'], ['wide', '16:9', 'Web y presentaciones']]
const steps = [
  ['Subís', 'Arrastrá tus capturas o pegalas con Ctrl+V. Hasta 20, del tamaño que tengan.'],
  ['Elegís', '53 movimientos y fondos lisos, degradés o tu propia imagen. Todo se ve en vivo.'],
  ['Bajás', 'Un video que se repite sin corte, en el formato y el archivo que necesites.'],
]
const files = [['MP4 H.264', 'Funciona en todos lados.'], ['WebM AV1', 'El más liviano para web.'], ['GIF', 'Para cuando no podés poner video.'], ['MOV ProRes', 'Master sin pérdida para seguir editando.']]

export function Landing() {
  const [preset, setPreset] = useState('showcase')
  const [format, setFormat] = useState('wide')
  return (
    <div className="overflow-x-clip">
      <div className={wrap}>
        <header className="flex h-16 items-center justify-between">
          <Link to="/" aria-label="Motion Lab, inicio"><Logo className="text-xl" /></Link>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#como" className="hidden text-muted-foreground hover:text-foreground sm:block">Cómo funciona</a>
            <a href="#formatos" className="hidden text-muted-foreground hover:text-foreground sm:block">Formatos</a>
            <LangSwitch />
            <Link to="/editor" className="rounded-[8px] border border-foreground px-4 py-2 font-medium hover:bg-foreground hover:text-background">Abrir el editor</Link>
          </nav>
        </header>

        <main>
          {/* The product is the hero: the real engine, running, with the same motions and formats the editor has. */}
          <section className="grid gap-x-[clamp(24px,4vw,64px)] gap-y-10 pb-[clamp(56px,8vw,112px)] pt-[clamp(32px,6vw,80px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-end">
            <div className="grid content-end gap-6">
              <h1 className="text-balance text-[clamp(2.4rem,4.7vw,4.5rem)] font-medium leading-[0.96] tracking-[-0.035em]"><span className="block">Tus pantallas,</span><span className="block">en movimiento<span className="text-primary">.</span></span></h1>
              <p className={body}>Subí capturas de tu app y bajá un video listo para el lanzamiento, la web o las redes.</p>
              <div><Link to="/editor" className={button}>Abrir el editor <ArrowRight className="size-4" /></Link></div>
            </div>

            <div className="grid gap-4">
              <LiveStage preset={preset} format={format} fill className={cn(format === 'wide' ? 'aspect-video' : 'h-[min(56vh,540px)] min-h-[260px]')} />
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="Movimiento de la demostración">
                  {picks.map(([id, name]) => (
                    <div key={id} className="grid content-start gap-1">
                    <button type="button" onClick={() => setPreset(id)} aria-pressed={preset === id} className="group grid gap-1.5 text-left text-xs text-muted-foreground outline-none aria-pressed:text-foreground">
                      <span className="block overflow-hidden rounded-[6px] outline outline-2 -outline-offset-2 outline-transparent group-aria-pressed:outline-foreground group-focus-visible:outline-foreground"><Still preset={id} /></span>{name}
                    </button>
                    <Link to={`/editor/${id}?format=${format}`} className="w-fit text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">Abrir en el editor</Link>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 text-sm" role="group" aria-label="Formato de la demostración">
                  {formats.map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setFormat(id)} aria-pressed={format === id} className="rounded-[6px] px-2.5 py-1 tabular-nums text-muted-foreground hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background">{label}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="formatos" className="border-t border-border py-[clamp(56px,9vw,128px)]">
            <h2 className={h2}>Una carga. Cuatro formatos.</h2>
            <p className={cn(body, 'mt-4')}>Reel, feed, cuadrado y horizontal salen de las mismas imágenes, sin rearmar nada.</p>
            <ul className="m-0 mt-[clamp(32px,5vw,64px)] grid list-none grid-cols-2 items-end gap-x-4 gap-y-8 p-0 md:grid-cols-[repeat(4,auto)] md:justify-between">
              {four.map(([f, ratio, name]) => (
                <li key={f} className="grid gap-3">
                  <LiveStage preset="drift" format={f} long={520} className={cn('rounded-[10px]', f === 'wide' ? 'w-full md:w-[min(34vw,460px)]' : f === 'square' ? 'w-full md:w-[min(20vw,270px)]' : f === 'feed' ? 'w-full md:w-[min(17vw,230px)]' : 'w-full md:w-[min(14vw,190px)]')} />
                  <span className="text-sm"><span className="font-medium tabular-nums">{ratio}</span> <span className="text-muted-foreground">{name}</span></span>
                </li>
              ))}
            </ul>
          </section>

          <section id="como" className="border-t border-border py-[clamp(56px,9vw,128px)]">
            <h2 className={h2}>Subís, elegís, bajás.</h2>
            <ol className="m-0 mt-[clamp(32px,5vw,64px)] grid list-none gap-x-[clamp(24px,4vw,64px)] gap-y-10 p-0 md:grid-cols-3">
              {steps.map(([title, text]) => (
                <li key={title} className="border-t border-foreground pt-5">
                  <h3 className="text-2xl font-medium tracking-[-0.02em]">{title}</h3>
                  <p className={cn(body, 'mt-3')}>{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-border py-[clamp(56px,9vw,128px)]">
            <h2 className={h2}>En el archivo que pida tu sitio.</h2>
            <dl className="m-0 mt-[clamp(32px,5vw,64px)] grid gap-x-[clamp(24px,4vw,64px)] gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {files.map(([name, text]) => (
                <div key={name}><dt className="text-2xl font-medium tracking-[-0.02em]">{name}</dt><dd className={cn(body, 'mt-2')}>{text}</dd></div>
              ))}
            </dl>
          </section>

          <section className="mb-[clamp(32px,6vw,80px)] grid justify-items-start gap-7 rounded-[12px] bg-primary p-[clamp(28px,6vw,88px)] text-primary-foreground">
            <h2 className={cn(h2, 'max-w-[14ch]')}>Probalo con tus pantallas.</h2>
            <Link to="/editor" className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-foreground px-6 text-[15px] font-medium text-background transition-transform hover:opacity-90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Abrir el editor <ArrowRight className="size-4" /></Link>
          </section>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-8 text-sm text-muted-foreground">
          <Logo className="text-base text-foreground" />
          <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacy" className="hover:text-foreground">Privacidad</Link>
            <Link to="/terms" className="hover:text-foreground">Términos</Link>
            <span>Hecho por <a href="https://paintedbirds.xyz/?utm_source=motion-lab&utm_medium=referral&utm_campaign=footer-credit" target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-foreground">Painted Birds</a></span>
          </span>
        </footer>
      </div>
    </div>
  )
}
