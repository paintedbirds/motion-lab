// Playback time lives outside React so the 60 fps tick does not re-render the whole editor.
// Only the transport bar subscribes to it.
const listeners = new Set<() => void>()
export const clock = {
  time: 0,
  set(t: number) { clock.time = t; listeners.forEach(f => f()) },
  subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f) } },
  get: () => clock.time,
}
