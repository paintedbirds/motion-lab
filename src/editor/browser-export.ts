import {BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, QUALITY_MEDIUM, QUALITY_VERY_HIGH, WebMOutputFormat, canEncodeVideo} from 'mediabunny'
import {GIFEncoder, applyPalette, quantize} from 'gifenc'
// @ts-ignore the engine is plain JavaScript
import {dimensions, frameCount} from '@engine/config.js'
// @ts-ignore
import {draw} from '@engine/motion.js'

// Video made entirely in the browser: the engine draws each frame on a canvas and the browser's own video
// encoder (WebCodecs) compresses it, so no image leaves the device. mediabunny writes the MP4 or WebM file.
const containers = {
  h264: {codec: 'avc', webm: false}, h265: {codec: 'hevc', webm: false}, vp9: {codec: 'vp9', webm: true}, av1: {codec: 'av1', webm: true},
} as const
const quality = {web: QUALITY_MEDIUM, high: QUALITY_HIGH, master: QUALITY_VERY_HIGH}

// Which of our file types this browser can make on its own. GIF needs no encoder from the browser.
export async function browserCodecs(): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {gif: true}
  for (const [key, c] of Object.entries(containers)) {
    try { out[key] = typeof VideoEncoder !== 'undefined' && await canEncodeVideo(c.codec, {width: 1280, height: 720}) } catch { out[key] = false }
  }
  return out
}

type Job = {config: any; images: any[]; onProgress: (done: number, total: number) => void; signal: AbortSignal}
const aborted = () => new DOMException('Cancelled', 'AbortError')
const idle = () => new Promise<void>(r => setTimeout(r, 0))

export async function exportInBrowser({config, images, onProgress, signal}: Job): Promise<Blob> {
  return config.codec === 'gif' ? gif({config, images, onProgress, signal}) : video({config, images, onProgress, signal})
}

async function video({config, images, onProgress, signal}: Job): Promise<Blob> {
  const kind = containers[config.codec as keyof typeof containers]
  const [w, h] = dimensions(config), total = frameCount(config), fps = config.fps
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const output = new Output({format: kind.webm ? new WebMOutputFormat() : new Mp4OutputFormat(), target: new BufferTarget()})
  const source = new CanvasSource(canvas, {codec: kind.codec, quality: quality[config.grade as keyof typeof quality] ?? QUALITY_HIGH, keyFrameInterval: 2})
  output.addVideoTrack(source, {frameRate: fps})
  await output.start()
  try {
    for (let i = 0; i < total; i++) {
      if (signal.aborted) throw aborted()
      draw(canvas, config, images, i / fps)
      await source.add(i / fps, 1 / fps)
      onProgress(i + 1, total)
      if (i % 3 === 0) await idle()
    }
    await output.finalize()
  } catch (e) { await output.cancel().catch(() => {}); throw e }
  return new Blob([output.target.buffer!], {type: kind.webm ? 'video/webm' : 'video/mp4'})
}

// GIF has 256 colours and gets heavy fast, so it is made smaller and at no more than 20 frames per second.
async function gif({config, images, onProgress, signal}: Job): Promise<Blob> {
  const [w, h] = dimensions(config), seconds = frameCount(config) / config.fps, fps = Math.min(config.fps, 20), total = Math.max(1, Math.round(seconds * fps))
  const full = document.createElement('canvas'), k = Math.min(1, 640 / Math.max(w, h)), gw = Math.max(2, Math.round(w * k)), gh = Math.max(2, Math.round(h * k))
  const small = document.createElement('canvas'); small.width = gw; small.height = gh
  const g = small.getContext('2d', {willReadFrequently: true})!, enc = GIFEncoder()
  for (let i = 0; i < total; i++) {
    if (signal.aborted) throw aborted()
    draw(full, config, images, i / fps)
    g.drawImage(full, 0, 0, gw, gh)
    const {data} = g.getImageData(0, 0, gw, gh), palette = quantize(data, 256), index = applyPalette(data, palette)
    enc.writeFrame(index, gw, gh, {palette, delay: Math.round(100 / fps) * 10, repeat: 0})
    onProgress(i + 1, total)
    await idle()
  }
  enc.finish()
  return new Blob([enc.bytes()], {type: 'image/gif'})
}
