import {useEffect, useRef, useState, useSyncExternalStore} from 'react'
import {Link} from 'react-router-dom'
import {ChevronDown, Download, FolderOpen, ImagePlus, Layers, Palette, Pause, Play, RotateCcw, Sparkles, SquareStack, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {InfoTip, LabelWithInfo} from '@/components/info-tip'
import {Logo} from '@/components/logo'
import {LangSwitch} from '@/components/lang-switch'
import {Progress} from '@/components/ui/progress'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Slider} from '@/components/ui/slider'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'
import {cn} from '@/lib/utils'
import {BackgroundPanel} from './background-panel'
import {clock} from './clock'
import {CropDialog} from './crop-dialog'
import {ImagesPanel} from './images-panel'
import {MotionPicker} from './motion-picker'
import {codecs, exportPresets, grades} from './outputs'
import {useFit} from './use-fit'
import {useUrlState, useUrlSync} from './url-state'
import {t} from '@/i18n'
import {dimensions, formats, number, presets, useEditor} from './use-editor'

const shapeBox: Record<string, string> = {vertical: 'h-6 w-3.5', feed: 'h-[22px] w-[18px]', square: 'h-5 w-5', portrait: 'h-6 w-[18px]', wide: 'h-[17px] w-[30px]', landscape: 'h-[17px] w-8'}

function Field({label, value, info, children}: {label: string; value?: string; info?: string; children: React.ReactNode}) {
  return <div className="grid gap-2"><div className="flex items-center justify-between"><LabelWithInfo label={label} info={info} />{value && <output className="text-xs tabular-nums">{value}</output>}</div>{children}</div>
}
function Group({title, info, children}: {title: string; info?: string; children: React.ReactNode}) {
  return <section className="grid gap-4 border-b border-border pb-6 last:border-b-0 last:pb-0"><h3 className="flex items-center gap-1.5 text-sm font-medium">{title}{info && <InfoTip text={info} label={title} />}</h3>{children}</section>
}

function Transport({ed}: {ed: ReturnType<typeof useEditor>}) {
  const time = useSyncExternalStore(clock.subscribe, clock.get)
  const total = ed.total, chapters: string[] = presets[ed.config.preset].chapters
  return (
    <div className="flex items-center gap-2.5">
      <Button variant="outline" size="icon" aria-label={ed.playing ? 'Pausar' : 'Reproducir'} onClick={() => ed.setPlaying(!ed.playing)}>{ed.playing ? <Pause /> : <Play />}</Button>
      <Button variant="ghost" size="icon" aria-label="Volver al inicio" onClick={() => clock.set(0)}><RotateCcw /></Button>
      <Slider min={0} max={total} step={0.01} value={[Math.min(time, total)]} onValueChange={([t]) => { ed.setPlaying(false); clock.set(t) }} aria-label="Posición del video" className="min-w-24" />
      <output className="w-20 whitespace-nowrap text-right text-xs tabular-nums text-muted-foreground">{time.toFixed(1).padStart(4, '0')} / {total.toFixed(1)}</output>
      <div className="hidden items-center gap-1 md:flex" role="group" aria-label="Ir a un momento del video">
        {[0.08, 0.48, 0.9].map((at, i) => <Button key={at} variant="outline" size="sm" className="h-7 text-xs" onClick={() => { ed.setPlaying(false); clock.set(at * total) }}>{chapters[i]}</Button>)}
      </div>
    </div>
  )
}

export default function Editor() {
  const urlInit = useUrlState()
  const ed = useEditor(urlInit)
  const copyLink = useUrlSync(ed, urlInit)
  const {config, choose} = ed
  const [cropping, setCropping] = useState<number | null>(null)
  const [drag, setDrag] = useState(false)
  const [tab, setTab] = useState('images')
  const fileInput = useRef<HTMLInputElement>(null)
  const [w, h] = dimensions(config)
  const fit = useFit(w / h)
  const codec = codecs[config.codec as keyof typeof codecs]
  // If the saved or linked file type cannot be made here, switch to one that can.
  const exportable = ed.canExport(config.codec)
  useEffect(() => { if (!exportable) for (const k of ['h264', 'vp9', 'gif']) if (ed.canExport(k)) { choose('codec', k); break } }, [exportable])
  const files = (e: {dataTransfer?: DataTransfer | null}) => [...(e.dataTransfer?.types || [])].includes('Files')
  const speedText = number(config.speed) + '×'

  // Paste an image anywhere, and never let a dropped file replace the editor with that file.
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const list = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'))
      if (list.length && !(e.target as HTMLElement)?.closest('input,textarea')) { e.preventDefault(); ed.addFiles(list) }
    }
    const stop = (e: DragEvent) => { if (files(e)) e.preventDefault() }
    window.addEventListener('paste', paste); window.addEventListener('dragover', stop); window.addEventListener('drop', stop)
    return () => { window.removeEventListener('paste', paste); window.removeEventListener('dragover', stop); window.removeEventListener('drop', stop) }
  }, [ed.addFiles])

  const message = ed.status.text || (!ed.canExport('h264') && !ed.canExport('vp9') && !ed.canExport('av1') ? 'Este navegador no puede crear MP4 ni WebM. Probá con Chrome, Edge o Safari, o exportá un GIF.' : '') || (!ed.count ? (config.assets.length ? 'Marcá al menos una imagen para generar el video.' : 'Agregá imágenes para generar el video.') : ed.heavy ? `Las imágenes pesan ${Math.round(ed.megabytes)} MB y el máximo para exportar es 80 MB. Quitá alguna.` : ed.hint || '')

  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <Link to="/" aria-label="Motion Lab, inicio"><Logo className="text-lg" /></Link>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={async e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) await ed.openFile(f) }} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" disabled={ed.exporting}><FolderOpen />Proyecto<ChevronDown className="opacity-60" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="normal-case tracking-normal">{ed.saveState === 'saving' ? 'Guardando…' : ed.saveState === 'saved' ? 'Guardado en este navegador' : ed.saveState === 'error' ? 'No se pudo guardar acá. Guardalo en un archivo.' : 'Proyecto'}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={copyLink}><span className="font-medium">Copiar enlace</span><span className="text-xs text-muted-foreground">Link a este movimiento con tus ajustes.</span></DropdownMenuItem>
                <DropdownMenuItem onSelect={ed.saveFile}><span className="font-medium">Guardar en un archivo</span><span className="text-xs text-muted-foreground">Baja un .json con tus imágenes y ajustes.</span></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => fileInput.current?.click()}><span className="font-medium">Abrir un archivo</span><span className="text-xs text-muted-foreground">Retoma un proyecto guardado.</span></DropdownMenuItem>
                <DropdownMenuItem onSelect={ed.poster} disabled={!ed.count}><span className="font-medium">Guardar fotograma PNG</span><span className="text-xs text-muted-foreground">Guarda el cuadro que ves ahora.</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => window.open('/privacy', '_blank')}><span className="font-medium">Privacidad y términos</span></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { if (confirm(t('Esto borra tus imágenes y ajustes de este navegador. ¿Empezar de cero?'))) ed.reset() }}><span className="font-medium">Empezar de cero</span><span className="text-xs text-muted-foreground">Vuelve al ejemplo inicial.</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {ed.exporting && <Button variant="outline" size="sm" onClick={ed.cancel}><X />Cancelar</Button>}
            <div className="flex">
              <Button size="sm" onClick={() => ed.exportVideo()} disabled={ed.exporting || !ed.count || ed.heavy || !ed.canExport(config.codec)} className="min-w-40 rounded-r-none tabular-nums">
                <Download />{ed.exporting ? (ed.percent == null ? 'Generando…' : `Generando ${ed.percent}%`) : `Exportar ${codec.label}`}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" aria-label="Más opciones de exportación" disabled={ed.exporting || !ed.count || ed.heavy} className="ml-px rounded-l-none px-2"><ChevronDown /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="normal-case tracking-normal tabular-nums">{formats[config.format].ratio} · {w} × {h} · {number(ed.total)} s · {config.fps} fps</DropdownMenuLabel>
                  {['Para publicar en web', 'Más calidad', 'Otros'].map((group, i) => (
                    <div key={group}>
                      {i > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel>{group}</DropdownMenuLabel>
                      {exportPresets.filter(p => p.group === group).map(p => (
                        <DropdownMenuItem key={p.id} disabled={'pack' in p ? !(ed.canExport('av1') && ed.canExport('h264')) : !ed.canExport(p.codec)} onSelect={() => ('pack' in p ? ed.exportPack() : ed.exportVideo({codec: p.codec, grade: p.grade}))}>
                          <span className="font-medium">{p.label}</span><span className="text-xs text-muted-foreground">{p.hint}</span>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={ed.poster}><span className="font-medium">Fotograma · PNG</span><span className="text-xs text-muted-foreground">Guarda el cuadro que ves ahora.</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <Progress value={ed.exporting ? (ed.percent ?? undefined) : 0} className={cn('h-0.5 rounded-none', !ed.exporting && 'opacity-0')} aria-label="Progreso del render" />

        <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(250px,19vw)_minmax(0,1fr)_minmax(340px,24vw)] lg:pt-3">
          <aside className="order-2 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:order-1" aria-label="Movimientos">
            <fieldset disabled={ed.exporting} className="m-0 flex min-h-0 min-w-0 flex-1 flex-col border-0 p-0">
              <MotionPicker config={config} images={ed.images.current} version={ed.version} choose={choose} />
            </fieldset>
          </aside>

          <section className="order-1 flex min-h-0 min-w-0 flex-col gap-3 lg:order-2" aria-label="Vista previa del video">
            <div ref={fit.ref}
              className="relative grid h-[min(70vw,60dvh)] min-h-[220px] place-items-center lg:h-auto lg:flex-1"
              onDragOver={e => { if (!files(e) || ed.exporting) return; e.preventDefault(); setDrag(true) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false) }}
              onDrop={e => { if (!files(e)) return; e.preventDefault(); setDrag(false); ed.addFiles([...e.dataTransfer.files]) }}>
              <div className="relative overflow-hidden rounded-xl shadow-[0_24px_60px_-30px_color-mix(in_srgb,var(--foreground)_55%,transparent)]" style={{width: fit.w || undefined, height: fit.h || undefined}}>
                <canvas ref={ed.canvas} width={1280} height={720} aria-label="Composición animada de las imágenes elegidas" className="block size-full bg-stage" />
                {ed.ready && !ed.count && (
                  <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-stage px-8 text-center text-white">
                    <button type="button" onClick={() => setTab('images')} className="grid justify-items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <ImagePlus className="size-6 text-white/70" /><span className="text-base">Todavía no hay imágenes</span><span className="text-xs text-white/60">Arrastralas acá, pegalas con Ctrl+V o agregalas desde el panel</span>
                    </button>
                    <button type="button" onClick={ed.fillTemplates} className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">Probar con ejemplos</button>
                  </div>
                )}
                {drag && <div className="pointer-events-none absolute inset-0 grid place-content-center bg-black/70 text-sm text-white outline outline-[3px] -outline-offset-[3px] outline-primary">Soltá las imágenes para agregarlas</div>}
              </div>
            </div>
            <Transport ed={ed} />
            <p role="status" aria-live="polite" className={cn('min-h-5 truncate text-xs text-muted-foreground', ed.status.kind === 'error' && 'text-destructive', ed.status.kind === 'done' && 'text-foreground')} title={message}>{message}</p>
          </section>

          <aside className="order-3 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <TabsList aria-label="Ajustes">
                <TabsTrigger value="images"><ImagePlus className="hidden size-4 2xl:block" />Imágenes{ed.count > 0 && <span className="text-[11px] tabular-nums text-muted-foreground">{ed.count}</span>}</TabsTrigger>
                <TabsTrigger value="format"><SquareStack className="hidden size-4 2xl:block" />Formato</TabsTrigger>
                <TabsTrigger value="style"><Palette className="hidden size-4 2xl:block" />Estilo</TabsTrigger>
                <TabsTrigger value="output"><Layers className="hidden size-4 2xl:block" />Salida</TabsTrigger>
              </TabsList>
              <ScrollArea className="min-h-0 flex-1 lg:h-0">
                <fieldset disabled={ed.exporting} className="m-0 min-w-0 border-0 p-4">
                  <TabsContent value="images"><ImagesPanel ed={ed} onCrop={setCropping} /></TabsContent>

                  <TabsContent value="format" className="grid gap-6">
                    <Group title="Formato de salida" info="Es el tamaño del video final. 9:16 para reels y stories, 4:5 y 1:1 para feed, 16:9 para web y presentaciones.">
                      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Formato de salida">
                        {Object.entries(formats).map(([key, f]: [string, any]) => (
                          <button key={key} type="button" aria-pressed={config.format === key} onClick={() => choose('format', key)}
                            className="flex min-h-[84px] flex-col items-center justify-end gap-1 rounded-xl border border-border bg-background px-1 pb-2 pt-2.5 outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground aria-pressed:ring-1 aria-pressed:ring-foreground">
                            <i className={cn('mb-auto block rounded-[3px] border-[1.5px] border-muted-foreground', shapeBox[key])} aria-hidden="true" />
                            <span className="text-center text-[11px] leading-tight">{f.label}</span>
                            <small className="text-[11px] tabular-nums text-muted-foreground">{f.ratio}</small>
                          </button>
                        ))}
                      </div>
                    </Group>
                    <Group title="Ritmo">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Duración base" info="Cuánto dura una vuelta completa del movimiento. El video final es este tiempo dividido por la velocidad.">
                          <Select value={String(config.duration)} onValueChange={v => choose('duration', Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{[6, 8, 10, 12, 15, 20].map(s => <SelectItem key={s} value={String(s)}>{s} segundos</SelectItem>)}</SelectContent></Select>
                        </Field>
                        <Field label="Fluidez" info="30 fps alcanza para web y pesa menos. 60 fps se ve más suave en movimientos rápidos y el archivo es más grande.">
                          <Select value={String(config.fps)} onValueChange={v => choose('fps', Number(v))}><SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="30">30 fps</SelectItem><SelectItem value="60">60 fps</SelectItem></SelectContent></Select>
                        </Field>
                      </div>
                      <Field label="Velocidad" info="Acelera o frena todo el movimiento. A 2× el video dura la mitad." value={speedText}>
                        <Slider min={0.5} max={2} step={0.25} value={[config.speed]} onValueChange={([v]) => choose('speed', v)} aria-label="Velocidad" />
                        <div className="-mt-1 flex justify-between text-[11px] text-muted-foreground"><span>0,5× lento</span><span>2× rápido</span></div>
                      </Field>
                      {config.speed !== 1 && <p className="text-[11px] leading-relaxed text-muted-foreground">El video dura {number(ed.total)} segundos: {config.duration} de base a {speedText}.</p>}
                    </Group>
                  </TabsContent>

                  <TabsContent value="style" className="grid gap-6">
                    <Group title="Fondo"><BackgroundPanel config={config} choose={choose} /></Group>
                    <Group title="Acabado">
                      <Field label="Luz y sombras" info="Limpio es plano. Estudio agrega un brillo suave que se mueve sobre las pantallas.">
                        <ToggleGroup type="single" value={config.effect} onValueChange={v => v && choose('effect', v)} aria-label="Luz y sombras"><ToggleGroupItem value="clean">Limpio</ToggleGroupItem><ToggleGroupItem value="studio">Estudio</ToggleGroupItem></ToggleGroup>
                      </Field>
                      <Field label="Marco" info="Pone cada pantalla dentro de una ventana de navegador o de un teléfono. El teléfono queda mejor con pantallas verticales.">
                        <ToggleGroup type="single" value={config.frame || 'none'} onValueChange={v => v && choose('frame', v)} aria-label="Marco"><ToggleGroupItem value="none">Sin marco</ToggleGroupItem><ToggleGroupItem value="browser">Navegador</ToggleGroupItem><ToggleGroupItem value="phone">Teléfono</ToggleGroupItem></ToggleGroup>
                      </Field>
                      <Field label="Tamaño de las pantallas" info="Qué tan grandes se ven las pantallas dentro del cuadro. Más grande llena más el video." value={Math.round(config.scale / 90 * 100) + '%'}><Slider min={60} max={110} step={1} value={[config.scale]} onValueChange={([v]) => choose('scale', v)} aria-label="Tamaño de las pantallas" /></Field>
                      <Field label="Intensidad del movimiento" info="Cuánto se mueve todo. Bajo es más calmo, alto es más marcado." value={config.intensity + '%'}><Slider min={0} max={100} step={1} value={[config.intensity]} onValueChange={([v]) => choose('intensity', v)} aria-label="Intensidad del movimiento" /></Field>
                    </Group>
                  </TabsContent>

                  <TabsContent value="output" className="grid gap-6">
                    <Group title="Tipo de archivo">
                      <Field label="Códec" info="El tipo de archivo. MP4 H.264 anda en todos lados. AV1 y VP9 pesan menos en web. GIF solo si no podés usar video. ProRes es para editar.">
                        <Select value={config.codec} onValueChange={v => choose('codec', v)}><SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(codecs).filter(([k]) => ed.canExport(k)).map(([k, c]) => <SelectItem key={k} value={k} description={c.hint}>{c.label}</SelectItem>)}</SelectContent></Select>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">{codec.hint}</p>
                      </Field>
                      {config.codec !== 'gif' && config.codec !== 'prores' && (
                        <Field label="Calidad" info="Liviana pesa poco. Alta es casi idéntica al original. Máxima no pierde nada antes de comprimir y tarda más.">
                          <ToggleGroup type="single" value={config.grade} onValueChange={v => v && choose('grade', v)} aria-label="Calidad">
                            {Object.entries(grades).map(([k, g]) => <Tooltip key={k}><TooltipTrigger asChild><ToggleGroupItem value={k}>{g.label}</ToggleGroupItem></TooltipTrigger><TooltipContent>{g.hint}</TooltipContent></Tooltip>)}
                          </ToggleGroup>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">{grades[config.grade as keyof typeof grades].hint}</p>
                        </Field>
                      )}
                    </Group>
                  </TabsContent>
                </fieldset>
              </ScrollArea>
            </Tabs>
          </aside>
        </div>
      </div>
      <CropDialog index={cropping} ed={ed} onClose={() => setCropping(null)} />
    </TooltipProvider>
  )
}
