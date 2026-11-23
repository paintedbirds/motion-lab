import {useEffect, useRef} from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom'
// @ts-ignore the engine is plain JavaScript
import {defaults, formats, frames, presets, ratios} from '@engine/config.js'
import {getLang, subscribeLang, t} from '@/i18n'
import {codecs, grades} from './outputs'
import {firstSample, sampleConfig, samples} from './samples'

type Cfg = Record<string, any>
export type UrlInit = {overrides: Cfg; sample?: string; badPreset: boolean}

// Allowed values and ranges for every setting that can travel in a link.
const durations = [6, 8, 10, 12, 15, 20], speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], fpsList = [30, 60]
const bgModes = ['solid', 'linear', 'radial'], bgMotions = ['none', 'drift', 'aurora'], effects = ['studio', 'clean']
const has = (o: object, k: string) => Object.hasOwn(o, k)
const num = (v: string) => (v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : NaN)
const range = (min: number, max: number) => (v: string) => { const n = num(v); return n >= min && n <= max ? n : undefined }
const oneOf = (list: any[]) => (v: string) => { const n = num(v); return list.includes(v) ? v : list.includes(n) ? n : undefined }
const hex = (v: string) => (/^[\da-f]{6}$/i.test(v) ? '#' + v.toLowerCase() : undefined)

// query key -> [config key, parser]. A parser returns undefined for anything that is not allowed.
const fields: Record<string, [string, (v: string) => any]> = {
  format: ['format', v => (has(formats, v) ? v : undefined)],
  ratio: ['ratio', v => (has(ratios, v) ? v : undefined)],
  speed: ['speed', oneOf(speeds)],
  duration: ['duration', oneOf(durations)],
  fps: ['fps', oneOf(fpsList)],
  scale: ['scale', range(60, 110)],
  intensity: ['intensity', range(0, 100)],
  effect: ['effect', v => (effects.includes(v) ? v : undefined)],
  frame: ['frame', v => (frames.includes(v) ? v : undefined)],
  top: ['top', hex],
  bottom: ['bottom', hex],
  bgMode: ['bgMode', v => (bgModes.includes(v) ? v : undefined)],
  angle: ['angle', range(0, 360)],
  bgMotion: ['bgMotion', v => (bgMotions.includes(v) ? v : undefined)],
  bgAurora: ['bgFromImages', v => (v === '1' ? true : undefined)],
  blur: ['bgBlur', range(0, 40)],
  dim: ['bgDim', range(0, 80)],
  codec: ['codec', v => (has(codecs, v) ? v : undefined)],
  grade: ['grade', v => (has(grades, v) ? v : undefined)],
}

export function parseUrl(preset: string | undefined, search: string): UrlInit {
  const q = new URLSearchParams(search), overrides: Cfg = {}
  for (const [key, [cfgKey, parse]] of Object.entries(fields)) {
    const raw = q.get(key), value = raw == null ? undefined : parse(raw)
    if (value !== undefined) overrides[cfgKey] = value
  }
  const badPreset = !!preset && !has(presets, preset)
  if (preset && !badPreset) overrides.preset = preset
  const s = q.get('sample')
  return {overrides, sample: s && has(samples, s) ? s : undefined, badPreset}
}

// What a setting is worth when the link does not say anything about it.
function reference(project: string): Cfg {
  const {assets: _a, ...sample} = sampleConfig(has(samples, project) ? project : firstSample)
  return {...defaults, ...sample, codec: 'h264', grade: 'high', bgMode: 'linear', angle: 180, bgMotion: 'none', bgFromImages: false, bgBlur: 0, bgDim: 0}
}

// Only settings that differ from the default go in. Photos and background images never do.
export function buildUrl(config: Cfg, project: string): string {
  const ref = reference(project), q = new URLSearchParams()
  for (const [key, [cfgKey]] of Object.entries(fields)) {
    let v = config[cfgKey]
    if (v === undefined || v === ref[cfgKey]) continue
    if (cfgKey === 'bgMode' && v === 'image') continue
    if (cfgKey === 'top' || cfgKey === 'bottom') { if (typeof v !== 'string' || !/^#[\da-f]{6}$/i.test(v)) continue; v = v.slice(1).toLowerCase(); if ('#' + v === String(ref[cfgKey]).toLowerCase()) continue }
    q.set(key, v === true ? '1' : String(v))
  }
  if (has(samples, project) && project !== firstSample) q.set('sample', project)
  const s = q.toString()
  return `/editor/${config.preset}${s ? '?' + s : ''}`
}

// Read the link once, before the editor starts.
export function useUrlState(): UrlInit {
  const {preset} = useParams(), {search} = useLocation()
  const init = useRef<UrlInit>(null as any)
  init.current ||= parseUrl(preset, search)
  return init.current
}

// Keeps the address, the page title and the copy-link action in step with the editor.
export function useUrlSync(ed: {ready: boolean; config: Cfg; project: string; setStatus: (s: {text: string; kind: string}) => void}, init: UrlInit) {
  const navigate = useNavigate()
  const {config, project, ready, setStatus} = ed
  useEffect(() => { if (init.badPreset) navigate('/editor' + window.location.search, {replace: true}) }, [])
  // One address update a moment after the last change, so dragging a slider does not flood the history API.
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      const next = buildUrl(config, project)
      if (next !== window.location.pathname + window.location.search) navigate(next, {replace: true})
    }, 250)
    return () => clearTimeout(timer)
  }, [config, project, ready])
  // The title follows the motion and the language.
  const lang = useRef(getLang())
  useEffect(() => {
    const set = () => { lang.current = getLang(); document.title = `${t(presets[config.preset]?.name ?? 'Editor')} | Motion Lab` }
    set()
    return subscribeLang(() => setTimeout(set))
  }, [config.preset])
  return async () => {
    try { await navigator.clipboard.writeText(window.location.origin + buildUrl(config, project)); setStatus({text: 'Enlace copiado.', kind: 'done'}) }
    catch { setStatus({text: 'No se pudo copiar el enlace.', kind: 'error'}) }
  }
}
