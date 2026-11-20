import {chaptersEn, en, patterns, presetsEn} from './locales/en'

// Spanish is what the code renders. In English a translator rewrites text and a few attributes in the page as it
// appears, and puts the Spanish back when the language is switched. Every string lives in locales/en.ts.
export type Lang = 'es' | 'en'
const KEY = 'motion-lab-lang'
const dict: Record<string, string> = {...presetsEn, ...en, 'Idioma': 'Language'}
const ATTRS = ['aria-label', 'title', 'alt', 'placeholder']
const CHAPTERS = '[aria-label="Ir a un momento del video"],[aria-label="Jump to a moment in the video"]'

let lang: Lang = 'es'
const listeners = new Set<() => void>()
const rules = patterns(s => tr(s, false))

export function detectLang(): Lang {
  try { const saved = localStorage.getItem(KEY); if (saved === 'es' || saved === 'en') return saved } catch { /* private mode */ }
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const c = (l || '').toLowerCase()
    if (c.startsWith('es')) return 'es'
    if (c.startsWith('en')) return 'en'
  }
  return 'en'
}

function tr(core: string, chapter: boolean): string {
  if (chapter && chaptersEn[core]) return chaptersEn[core]
  if (dict[core]) return dict[core]
  for (const [re, fn] of rules) { const m = core.match(re); if (m) return fn(...m) }
  // A note can join several sentences; translate each one.
  const parts = core.split(/(?<=\.) (?=[A-ZÁÉÍÓÚ¿¡0-9])/)
  if (parts.length > 1) { const out = parts.map(p => tr(p, false)); if (out.some((p, i) => p !== parts[i])) return out.join(' ') }
  return core
}
export function translate(text: string, chapter = false): string {
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!, core = m[2]
  if (!core) return text
  const out = tr(core, chapter)
  return out === core ? text : m[1] + out.replace(/(\d),(\d)/g, '$1.$2') + m[3]
}
// For code that builds a string outside the page (a download name, a confirm dialog).
export const t = (s: string) => (lang === 'en' ? translate(s) : s)

const texts = new WeakMap<Node, {es: string; en: string}>(), tracked = new Set<Node>()
const attrs = new WeakMap<Element, Record<string, {es: string; en: string}>>(), trackedEls = new Set<Element>()

function text(node: Node) {
  const rec = texts.get(node)
  if (rec && (node as Text).data === rec.en) return
  const es = (node as Text).data, out = translate(es, !!node.parentElement?.closest(CHAPTERS))
  if (out !== es) { texts.set(node, {es, en: out}); tracked.add(node); (node as Text).data = out }
}
function element(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a); if (v == null) continue
    const rec = attrs.get(el)?.[a]
    if (rec && v === rec.en) continue
    const out = translate(v)
    if (out !== v) { attrs.set(el, {...attrs.get(el), [a]: {es: v, en: out}}); trackedEls.add(el); el.setAttribute(a, out) }
  }
}
function walk(root: Node) {
  if (root.nodeType === 3) { text(root); return }
  if (root.nodeType !== 1) return
  const el = root as Element
  if (['SCRIPT', 'STYLE', 'CANVAS'].includes(el.tagName)) return
  element(el); el.querySelectorAll('[aria-label],[title],[alt],[placeholder]').forEach(element)
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {acceptNode: n => (['SCRIPT', 'STYLE'].includes(n.parentElement?.tagName || '') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)})
  while (w.nextNode()) text(w.currentNode)
}

function restore() {
  for (const n of tracked) { const r = texts.get(n); if (r && (n as Text).data === r.en) (n as Text).data = r.es }
  for (const el of trackedEls) for (const [a, r] of Object.entries(attrs.get(el) || {})) if (el.getAttribute(a) === r.en) el.setAttribute(a, r.es)
  tracked.clear(); trackedEls.clear()
}
function metas() {
  const d = document.querySelector('meta[name="description"]')
  if (d) { if (!d.hasAttribute('data-es')) d.setAttribute('data-es', d.getAttribute('content') || ''); d.setAttribute('content', lang === 'en' ? translate(d.getAttribute('data-es')!) : d.getAttribute('data-es')!) }
}

export function setLang(next: Lang) {
  if (next === lang) return
  try { localStorage.setItem(KEY, next) } catch { /* private mode */ }
  lang = next; document.documentElement.lang = next
  if (next === 'en') walk(document.body); else restore()
  metas(); listeners.forEach(f => f())
}
export const getLang = () => lang
export const subscribeLang = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }

export function initI18n() {
  lang = detectLang(); document.documentElement.lang = lang; metas()
  new MutationObserver(muts => {
    if (lang !== 'en') return
    for (const m of muts) {
      if (m.type === 'characterData') text(m.target)
      else if (m.type === 'attributes') element(m.target as Element)
      else m.addedNodes.forEach(walk)
    }
  }).observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS})
  if (lang === 'en') walk(document.body)
}
