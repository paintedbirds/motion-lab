import {useEffect, useRef, useState} from 'react'

// Largest box of a given ratio that fits inside the element, so the preview never sits in a bigger grey frame.
export function useFit(ratio: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({w: 0, h: 0})
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const cw = el.clientWidth, ch = el.clientHeight
      const w = Math.floor(Math.min(cw, ch * ratio)), h = Math.floor(w / ratio)
      setSize(s => (s.w === w && s.h === h ? s : {w, h}))
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(el)
    return () => ro.disconnect()
  }, [ratio])
  return {ref, ...size}
}
