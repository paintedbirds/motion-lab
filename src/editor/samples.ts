import {abstractImage} from './template'

// Examples that come with the editor. They are abstract images drawn by Motion Lab, so they suit any card shape.
type Sample = {label: string; top: string; bottom: string; preset: string; format: string; variants: number[]}
export const samples: Record<string, Sample> = {
  colors: {label: 'Colores abstractos', top: '#f3f4f5', bottom: '#d9dce1', preset: 'showcase', format: 'wide', variants: [0, 1, 3, 6, 7]},
  shapes: {label: 'Formas gráficas', top: '#0d0e10', bottom: '#3a3f48', preset: 'spread', format: 'wide', variants: [2, 4, 5, 8, 10]},
}
export const firstSample = 'colors'
export const sampleConfig = (key: string) => {
  const s = samples[key]
  return {top: s.top, bottom: s.bottom, preset: s.preset, format: s.format, assets: s.variants.map((v, i) => ({name: 'Ejemplo ' + (i + 1), src: abstractImage(v), selected: true, placeholder: true}))}
}
