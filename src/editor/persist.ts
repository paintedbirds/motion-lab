// The project (settings and images) is kept in IndexedDB, which holds far more than localStorage,
// so a reload or a closed tab does not lose the work. Nothing leaves the browser.
const DB = 'motion-lab', STORE = 'projects', KEY = 'current'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror = () => { db.close(); reject(req.error) }
  })
}

export type Saved = {app: 'motion-lab'; version: 1; project: string; config: Record<string, any>; ownAssets?: any[]}
export const readSaved = async (): Promise<Saved | null> => { try { return (await run('readonly', s => s.get(KEY))) ?? null } catch { return null } }
export const writeSaved = (data: Saved) => run('readwrite', s => s.put(data, KEY))
export const clearSaved = async () => { try { await run('readwrite', s => s.delete(KEY)) } catch { /* nothing to clear */ } }

// A project file is checked before it is used. Images must be image data or the bundled samples.
export function parseProject(text: string, known: {presets: object; formats: object}): Saved {
  let data: any
  try { data = JSON.parse(text) } catch { throw new Error('El archivo no es un proyecto de Motion Lab.') }
  if (data?.app !== 'motion-lab' || typeof data.config !== 'object' || !Array.isArray(data.config.assets)) throw new Error('El archivo no es un proyecto de Motion Lab.')
  const okAsset = (a: any) => a && typeof a.name === 'string' && typeof a.selected === 'boolean' && typeof a.src === 'string' && (/^data:image\/(png|jpeg|webp);base64,/.test(a.src) || /^\/assets\/[\w.-]+$/.test(a.src))
  if (!data.config.assets.every(okAsset) || data.config.assets.length > 20) throw new Error('El proyecto tiene imágenes que no se pueden usar.')
  // The background image is loaded by the browser as it is, so it gets the same check: a link to another site would be requested.
  if (data.config.bgImage !== undefined && !(typeof data.config.bgImage === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(data.config.bgImage))) throw new Error('El proyecto tiene una imagen de fondo que no se puede usar.')
  // Numbers outside what the editor offers are dropped, so the defaults apply instead of a frozen or huge preview.
  const inRange = (min: number, max: number) => (v: any) => typeof v === 'number' && v >= min && v <= max
  const checks: Record<string, (v: any) => boolean> = {fps: v => v === 30 || v === 60, duration: inRange(1, 20), speed: inRange(0.25, 4), scale: inRange(60, 110), intensity: inRange(0, 100), angle: inRange(0, 360), bgBlur: inRange(0, 40), bgDim: inRange(0, 80)}
  for (const [k, ok] of Object.entries(checks)) if (k in data.config && !ok(data.config[k])) delete data.config[k]
  if (!Object.hasOwn(known.presets, data.config.preset) || !Object.hasOwn(known.formats, data.config.format)) throw new Error('El proyecto usa un movimiento o formato que ya no existe.')
  return {app: 'motion-lab', version: 1, project: typeof data.project === 'string' ? data.project : 'own', config: data.config, ownAssets: Array.isArray(data.ownAssets) ? data.ownAssets.filter(okAsset).slice(0, 20) : undefined}
}
