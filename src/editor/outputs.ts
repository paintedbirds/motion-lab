// The file types the editor knows. The browser makes MP4, WebM and GIF itself; ProRes needs an optional
// render server that is not part of this repository, so it stays hidden when no server answers.
export const codecs = {
  h264: {label: 'MP4 · H.264', hint: 'Se reproduce en todos lados. La opción segura para web y redes.', ext: 'mp4'},
  av1: {label: 'WebM · AV1', hint: 'El más liviano con la misma calidad. Navegadores actuales.', ext: 'webm'},
  vp9: {label: 'WebM · VP9', hint: 'Liviano y con soporte amplio en navegadores.', ext: 'webm'},
  h265: {label: 'MP4 · H.265', hint: 'Más liviano que H.264. Safari y apps; Chrome y Firefox según el equipo.', ext: 'mp4'},
  gif: {label: 'GIF', hint: 'Solo para donde no hay video. Pesa mucho y tiene 256 colores.', ext: 'gif'},
  prores: {label: 'MOV · ProRes 4444', hint: 'Master sin pérdida visible para editar o recomprimir. Pesa mucho.', ext: 'mov'},
} as const
export type Codec = keyof typeof codecs

export const grades = {
  web: {label: 'Liviana', hint: 'Archivo chico para publicar.'},
  high: {label: 'Alta', hint: 'Casi idéntico al original.'},
  master: {label: 'Máxima', hint: 'Sin pérdida en el paso de fotogramas. Más lento.'},
} as const
// Ready-made export choices. `web` entries are the ones meant to be published on a site.
export const exportPresets = [
  {id: 'web-h264', group: 'Para publicar en web', label: 'MP4 · H.264 · Alta', hint: 'Funciona en todos lados. La opción segura.', codec: 'h264', grade: 'high'},
  {id: 'web-av1', group: 'Para publicar en web', label: 'WebM · AV1 · Liviana', hint: 'El archivo más chico con buena calidad.', codec: 'av1', grade: 'web'},
  {id: 'web-vp9', group: 'Para publicar en web', label: 'WebM · VP9 · Alta', hint: 'Liviano y compatible con casi todos los navegadores.', codec: 'vp9', grade: 'high'},
  {id: 'pack', group: 'Para publicar en web', label: 'Paquete web', hint: 'AV1 + H.264 + póster PNG, listo para un <video> con varias fuentes.', pack: true},
  {id: 'h265', group: 'Más calidad', label: 'MP4 · H.265 · Alta', hint: 'Más liviano que H.264, para Safari y apps.', codec: 'h265', grade: 'high'},
  {id: 'h264-max', group: 'Más calidad', label: 'MP4 · H.264 · Máxima', hint: 'Fotogramas sin pérdida. Más lento y más pesado.', codec: 'h264', grade: 'master'},
  {id: 'prores', group: 'Más calidad', label: 'MOV · ProRes 4444', hint: 'Master para editar. Pesa mucho.', codec: 'prores', grade: 'master'},
  {id: 'gif', group: 'Otros', label: 'GIF', hint: 'Solo donde no hay video. 256 colores.', codec: 'gif', grade: 'web'},
] as const
export const webPack = [{codec: 'av1', grade: 'web'}, {codec: 'h264', grade: 'high'}] as const

export type Grade = keyof typeof grades
