import {useCallback, useEffect, useRef, useState} from 'react'
// @ts-ignore the engine is plain JavaScript
import {defaults, formats, presets, limits, dimensions, duration} from '@engine/config.js'
// @ts-ignore
import {loadImages, loadBackground, draw, advice, CROP} from '@engine/motion.js'
import {clock} from './clock'
import {codecs, webPack} from './outputs'
import {RECOMMENDED, templateImage} from './template'
import {firstSample, sampleConfig, samples} from './samples'
import {browserCodecs, exportInBrowser} from './browser-export'
import {clearSaved, parseProject, readSaved, writeSaved} from './persist'

export {loadBackground, formats, presets, limits, dimensions, duration, advice, CROP, draw}
type Cfg = Record<string, any>

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const names = (l: string[]) => (l.length > 3 ? `${l.slice(0, 3).join(', ')} y ${l.length - 3} más` : l.join(', '))
export const number = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')
const base = () => ({...structuredClone(defaults), ...sampleConfig(firstSample), codec: 'h264', grade: 'high'}) as Cfg

function download(blob: Blob, name: string) {
  const a = document.createElement('a'), url = URL.createObjectURL(blob)
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Files that already fit are kept as they are. Larger ones are resized, and photos stay JPEG so they do not grow.
const native = ['image/png', 'image/jpeg', 'image/webp']
export async function encode(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file), long = Math.max(bitmap.width, bitmap.height)
  if (long <= limits.edge && native.includes(file.type)) {
    bitmap.close()
    return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = () => reject(r.error); r.readAsDataURL(file) })
  }
  const k = Math.min(1, limits.edge / long), tmp = document.createElement('canvas')
  tmp.width = Math.max(1, Math.round(bitmap.width * k)); tmp.height = Math.max(1, Math.round(bitmap.height * k))
  tmp.getContext('2d')!.drawImage(bitmap, 0, 0, tmp.width, tmp.height); bitmap.close()
  return tmp.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92)
}

export function useEditor(url?: {overrides: Cfg; sample?: string}) {
  const [config, setConfig] = useState<Cfg>(base)
  const [project, setProject] = useState(firstSample)
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [exporting, setExporting] = useState(false)
  const [status, setStatus] = useState<{text: string; kind: string}>({text: '', kind: ''})
  const [note, setNote] = useState<{text: string; kind: string}>({text: '', kind: ''})
  const [percent, setPercent] = useState<number | null>(null)
  const [version, setVersion] = useState(0)
  const [ready, setReady] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const restored = useRef(false)
  const urlInit = useRef(url)
  // The MP4 render needs the render server. On the published site it is not there yet, so export is switched off
  // and the editor says so, instead of failing after the person waits.
  const [renderAvailable, setRenderAvailable] = useState(true)
  const [browserOk, setBrowserOk] = useState<Record<string, boolean>>({})
  useEffect(() => { browserCodecs().then(setBrowserOk) }, [])
  // A file type can be exported when the browser can encode it or the render server is there to do it.
  const canExport = (codec: string) => !!browserOk[codec] || renderAvailable
  useEffect(() => { fetch('/progress').then(r => setRenderAvailable(r.ok && (r.headers.get('content-type') || '').includes('json'))).catch(() => setRenderAvailable(false)) }, [])

  const canvas = useRef<HTMLCanvasElement>(null)
  const images = useRef<any[]>([])
  const cfg = useRef(config); cfg.current = config
  const flags = useRef({playing, exporting}); flags.current = {playing, exporting}
  const cell = useRef(0)
  const dirty = useRef(true)
  const drafts = useRef(new Map<string, Cfg>())
  const loadVersion = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const projectRef = useRef(project); projectRef.current = project

  const paint = useCallback(() => {
    const c = canvas.current
    if (!c || !images.current) return
    cell.current = draw(c, cfg.current, images.current, clock.time, {preview: true}) || 0
    dirty.current = false
  }, [])

  // Repaint whenever the composition changes.
  useEffect(() => { dirty.current = true }, [config, version])

  useEffect(() => {
    let raf = 0, last = performance.now(), lastPaint = 0, lastTime = -1
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1); last = now
      const {playing, exporting} = flags.current
      if (playing && !exporting && !document.hidden) clock.set((clock.time + dt) % duration(cfg.current))
      if ((dirty.current || clock.time !== lastTime) && now - lastPaint >= 1000 / cfg.current.fps) { paint(); lastTime = clock.time; lastPaint = now }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [paint])

  const load = useCallback(async (next: Cfg) => {
    const v = ++loadVersion.current
    const merged = {...base(), ...next}
    const decoded = await loadImages(merged.assets)
    if (merged.bgImage) await loadBackground(merged.bgImage)
    if (v !== loadVersion.current) return false
    cfg.current = merged; setConfig(merged); images.current = decoded; clock.set(0); setVersion(n => n + 1)
    return true
  }, [])

  // Start from the last saved project when there is one, and from the first sample otherwise.
  useEffect(() => {
    (async () => {
      // Settings that came in the link win over what was saved. The saved photos stay.
      const withUrl = (c: Cfg) => ({...c, ...(urlInit.current?.sample ? sampleConfig(urlInit.current.sample) : {}), ...urlInit.current?.overrides})
      const saved = await readSaved()
      // Projects saved while the client samples still existed are dropped: those images are gone.
      if (saved && (saved.project === 'own' || Object.hasOwn(samples, saved.project))) {
        try {
          if (saved.ownAssets) drafts.current.set('own', {assets: saved.ownAssets})
          if (await load(withUrl(saved.config))) { setProject(urlInit.current?.sample || saved.project); setStatus({text: 'Recuperamos tu último proyecto.', kind: ''}) }
          return
        } catch { /* a broken save falls back to the sample */ }
      }
      await load(withUrl(cfg.current)); if (urlInit.current?.sample) setProject(urlInit.current.sample)
    })().then(() => { restored.current = true; setReady(true) }).catch(e => setStatus({text: e.message, kind: 'error'}))
  }, [load])

  // Save a moment after the last change.
  useEffect(() => {
    if (!restored.current) return
    setSaveState('saving')
    const t = setTimeout(() => {
      const own = projectRef.current === 'own' ? cfg.current.assets : drafts.current.get('own')?.assets
      writeSaved({app: 'motion-lab', version: 1, project: projectRef.current, config: cfg.current, ownAssets: own}).then(() => setSaveState('saved')).catch(() => setSaveState('error'))
    }, 700)
    return () => clearTimeout(t)
  }, [config, project, version])

  const total = duration(config)
  const count = config.assets.filter((a: any) => a.selected).length
  const megabytes = config.assets.reduce((s: number, a: any) => s + a.src.length, 0) / 1024 / 1024
  const heavy = megabytes > limits.requestMB * 0.97

  // Settings that change how a still looks ask the picker for new stills; the picker watches `config` and `version`.
  const choose = useCallback((key: string, value: any) => {
    const c = cfg.current, progress = clock.time / duration(c), next = {...c, [key]: value}
    cfg.current = next; setConfig(next); clock.set(progress * duration(next))
  }, [])

  const edit = useCallback((fn: (assets: any[], imgs: any[]) => void) => {
    const assets = [...cfg.current.assets], imgs = [...images.current]
    fn(assets, imgs)
    images.current = imgs
    const next = {...cfg.current, assets}; cfg.current = next; setConfig(next); setVersion(n => n + 1)
  }, [])

  const toggle = (i: number, selected: boolean) => edit((a, m) => { a[i] = {...a[i], selected}; m[i] = {...m[i], selected} })
  const move = (from: number, to: number) => { if (to < 0 || to >= cfg.current.assets.length || from === to) return; edit((a, m) => { a.splice(to, 0, ...a.splice(from, 1)); m.splice(to, 0, ...m.splice(from, 1)) }) }
  const remove = (i: number) => { setNote({text: '', kind: ''}); edit((a, m) => { a.splice(i, 1); m.splice(i, 1) }) }
  const clear = () => { setNote({text: '', kind: ''}); edit((a, m) => { a.length = 0; m.length = 0 }) }
  const setCrop = (i: number, crop: any) => edit((a, m) => {
    const {crop: _a, ...restA} = a[i], {crop: _m, ...restM} = m[i]
    a[i] = crop ? {...restA, crop} : restA; m[i] = crop ? {...restM, crop} : restM
  })

  const changeProject = async (next: string) => {
    drafts.current.set(projectRef.current, structuredClone(cfg.current)); setNote({text: '', kind: ''})
    const draft = drafts.current.get(next) || (next === 'own' ? {...cfg.current, assets: []} : {...cfg.current, ...sampleConfig(next)})
    try { if (await load(draft)) setProject(next) } catch (e: any) { setStatus({text: e.message, kind: 'error'}) }
  }

  // Adds what can be used and says plainly what was left out, instead of rejecting the whole batch.
  const addFiles = async (files: File[]) => {
    if (flags.current.exporting || !files.length) return
    const own = projectRef.current === 'own'
    const next: Cfg = own ? {...cfg.current, assets: [...cfg.current.assets]} : {...cfg.current, assets: [...(drafts.current.get('own')?.assets || [])]}
    const wrong: string[] = [], heavyFiles: string[] = [], broken: string[] = []; let added = 0, over = 0
    setNote({text: 'Cargando imágenes…', kind: 'info'})
    for (const file of files) {
      if (!file.type.startsWith('image/')) { wrong.push(file.name); continue }
      if (file.size > limits.fileMB * 1024 * 1024) { heavyFiles.push(file.name); continue }
      if (next.assets.length >= limits.images) { over++; continue }
      try { next.assets.push({name: file.name, src: await encode(file), selected: true}); added++ } catch { broken.push(file.name) }
    }
    const problems: string[] = []
    if (wrong.length) problems.push(`${names(wrong)} ${plural(wrong.length, 'no es', 'no son')} ${plural(wrong.length, 'una imagen', 'imágenes')}.`)
    if (heavyFiles.length) problems.push(`${names(heavyFiles)} ${plural(heavyFiles.length, 'pesa', 'pesan')} más de ${limits.fileMB} MB.`)
    if (broken.length) problems.push(`${names(broken)} no se ${plural(broken.length, 'pudo', 'pudieron')} abrir.`)
    if (over) problems.push(`El máximo es ${limits.images} imágenes: ${over} ${plural(over, 'quedó afuera', 'quedaron afuera')}.`)
    try {
      if (added) {
        if (!own) drafts.current.set(projectRef.current, structuredClone(cfg.current))
        if (await load(next)) setProject('own')
      }
      setNote({text: problems.length ? [added ? `${plural(added, 'Se agregó 1 imagen', 'Se agregaron ' + added + ' imágenes')}.` : 'No se agregó ninguna imagen.', ...problems].join(' ') : '', kind: 'error'})
    } catch (e: any) { setNote({text: e.message, kind: 'error'}) }
  }

  // Fills the empty slots with branded placeholders so the motion can be judged with a full set.
  const fillTemplates = async () => {
    if (flags.current.exporting) return
    const own = projectRef.current === 'own', current = cfg.current.assets
    const missing = Math.max(0, RECOMMENDED - current.length)
    if (!missing) return
    const start = current.filter((a: any) => a.placeholder).length
    const extra = Array.from({length: missing}, (_, i) => ({name: 'Ejemplo ' + (start + i + 1), src: templateImage(start + i + 1), selected: true, placeholder: true}))
    const next: Cfg = {...cfg.current, assets: [...current, ...extra]}
    if (!own) drafts.current.set(projectRef.current, structuredClone(cfg.current))
    try { if (await load(next)) setProject('own') } catch (e: any) { setNote({text: e.message, kind: 'error'}) }
  }

  const projectPayload = () => ({app: 'motion-lab', version: 1, project: projectRef.current, config: cfg.current, ownAssets: projectRef.current === 'own' ? cfg.current.assets : drafts.current.get('own')?.assets})
  const saveFile = () => { download(new Blob([JSON.stringify(projectPayload())], {type: 'application/json'}), 'motion-lab-proyecto.json'); setStatus({text: 'Proyecto guardado en un archivo. Lo abrís cuando quieras desde Proyecto.', kind: 'done'}) }
  const openFile = async (file: File) => {
    try {
      if (file.size > 200 * 1024 * 1024) throw new Error('El archivo es demasiado grande para ser un proyecto de Motion Lab.')
      const saved = parseProject(await file.text(), {presets, formats})
      drafts.current.clear(); if (saved.ownAssets) drafts.current.set('own', {assets: saved.ownAssets})
      if (await load(saved.config)) { setProject(saved.project); setStatus({text: 'Proyecto abierto.', kind: 'done'}) }
    } catch (e: any) { setStatus({text: e.message, kind: 'error'}) }
  }
  const reset = async () => { await clearSaved(); drafts.current.clear(); setProject(firstSample); await load(base()); setStatus({text: 'Empezaste de cero.', kind: ''}) }

  const poster = () => { draw(canvas.current, cfg.current, images.current, clock.time); canvas.current!.toBlob(b => { download(b!, `motion-lab-${cfg.current.preset}-${cfg.current.format}.png`); dirty.current = true }) }

  const cancel = () => controller.current?.abort()
  // `override` exports with another codec or grade without changing the editor's own selection.
  // The browser encodes by itself when it can; the render server is only used for what it cannot make (ProRes).
  // Returns true when the file was delivered.
  const exportVideo = async (override: Partial<Cfg> = {}): Promise<boolean> => {
    const c = {...cfg.current, ...override}, ext = codecs[c.codec as keyof typeof codecs].ext, local = !!browserOk[c.codec]
    setExporting(true); setPlaying(false); flags.current = {playing: false, exporting: true}
    controller.current = new AbortController(); setPercent(null); setStatus({text: 'Preparando el render…', kind: ''})
    const started = performance.now(); let since: {at: number; frame: number} | null = null, ok = false
    // Progress text shared by both paths. The estimate counts from the first frames seen, so start-up time does not skew it.
    const report = (frame: number, total: number) => {
      setPercent(Math.round(frame / total * 100))
      since ||= {at: performance.now(), frame}
      const done = frame - since.frame, left = done > 10 ? Math.ceil((performance.now() - since.at) / done * (total - frame) / 1000) : 0
      setStatus({text: `Fotograma ${frame} de ${total}${left ? ` · ${left < 90 ? `faltan unos ${left} segundos` : `faltan unos ${Math.ceil(left / 60)} minutos`}` : ''}`, kind: ''})
    }
    let poll: ReturnType<typeof setInterval> | undefined
    try {
      let blob: Blob
      if (local) {
        blob = await exportInBrowser({config: c, images: images.current, signal: controller.current.signal, onProgress: report})
      } else {
        poll = setInterval(async () => {
          try {
            const r = await fetch('/progress'); if (!r.ok) return
            const p = await r.json(); if (!p.total) return
            if (p.frame >= p.total) { setPercent(100); setStatus({text: 'Comprimiendo el archivo…', kind: ''}); return }
            report(p.frame, p.total)
          } catch { /* The render response handles connection failures. */ }
        }, 800)
        const res = await fetch('/render', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(c), signal: controller.current.signal})
        if (!res.ok) throw new Error(await res.text())
        blob = await res.blob()
      }
      download(blob, `motion-lab-${c.preset}-${c.format}-${c.speed}x.${ext}`)
      setStatus({text: `Archivo descargado: ${(blob.size / 1024 / 1024).toFixed(1).replace('.', ',')} MB. Tardó ${number((performance.now() - started) / 1000)} segundos.`, kind: 'done'})
      ok = true
    } catch (e: any) {
      if (e.name === 'AbortError') setStatus({text: 'Render cancelado. Podés ajustar la composición y volver a generar.', kind: ''})
      else setStatus({text: !local && e instanceof TypeError ? 'No se pudo exportar: el servidor de render no responde.' : 'No se pudo exportar: ' + (e?.message || e), kind: 'error'})
    } finally { if (poll) clearInterval(poll); controller.current = null; setExporting(false); setPercent(null); flags.current = {...flags.current, exporting: false} }
    return ok
  }

  // Everything a site needs: two video sources and a poster image. Stops if one of them fails or is cancelled.
  const exportPack = async () => {
    for (const item of webPack) { if (!(await exportVideo(item))) return }
    poster()
  }

  const hint = advice(config, count)
  return {config, project, playing, setPlaying, exporting, status, note, setNote, percent, version, ready, canvas, images, cell, total, count, megabytes, heavy, hint,
    renderAvailable, canExport, saveState, saveFile, openFile, reset, exportPack, choose, fillTemplates, toggle, move, remove, clear, setCrop, changeProject, addFiles, poster, exportVideo, cancel, setStatus}
}
