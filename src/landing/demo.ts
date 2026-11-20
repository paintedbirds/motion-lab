// The landing runs the real engine: the same code that makes the exported video draws these canvases.
// It loads on demand, once, so the first paint of the page does not wait for it.
let ready: Promise<any> | null = null
export const demoConfig = (extra: Record<string, any> = {}) => ({duration: 12, speed: 1, fps: 30, quality: 'full', ratio: 'auto', scale: 90, intensity: 70, effect: 'clean', top: '#e8e6e1', bottom: '#cfcdc6', bgMode: 'linear', ...extra})

export function loadDemo() {
  ready ||= (async () => {
    const [motion, config, samples] = await Promise.all([import('@engine/motion.js'), import('@engine/config.js'), import('@/editor/samples')])
    const images = await motion.loadImages(samples.sampleConfig('colors').assets)
    return {draw: motion.draw, duration: config.duration, presets: config.presets, formats: config.formats, images}
  })()
  return ready
}
