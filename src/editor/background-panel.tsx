import {useRef, useState} from 'react'
import {ImagePlus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {LabelWithInfo} from '@/components/info-tip'
import {Slider} from '@/components/ui/slider'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {cn} from '@/lib/utils'
import {encode, loadBackground, limits} from './use-editor'

const solids = ['#0d0e10', '#292e30', '#f3f4f5', '#ffffff', '#ff6a2b', '#e92c0b', '#294a87', '#291548', '#57b883', '#c8f03c', '#f2c6d9', '#e9dcc6']
const gradients: [string, string][] = [
  ['#292e30', '#57b883'], ['#291548', '#7c8fd3'], ['#e92c0b', '#f54b16'], ['#294a87', '#c8ba20'],
  ['#0d0e10', '#3a3f48'], ['#ff6a2b', '#ffd2a8'], ['#1b2a49', '#9ad0f5'], ['#2b1d3a', '#f08fb0'],
  ['#f3f4f5', '#c9ced6'], ['#0f3d2e', '#c8f03c'], ['#3b0d0d', '#ff8a5c'], ['#101820', '#4f6d8f'],
]
const hex = /^#[\da-f]{6}$/i

function Swatch({label, css, active, onClick}: {label: string; css: string; active: boolean; onClick: () => void}) {
  return <button type="button" aria-label={label} title={label} aria-pressed={active} onClick={onClick} style={{background: css}}
    className="aspect-square rounded-lg border border-border outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 aria-pressed:ring-offset-card" />
}

function Color({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-input bg-card p-1.5 pr-2.5 text-xs text-muted-foreground">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} aria-label={label} className="size-7 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0" />
      <span className="grid leading-tight"><span>{label}</span><span className="font-mono text-[11px] uppercase text-foreground">{value}</span></span>
    </label>
  )
}

function Slide({label, value, unit, info, ...range}: {label: string; value: number; unit: string; info: string; min: number; max: number; onChange: (v: number) => void}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between"><LabelWithInfo label={label} info={info} /><output className="text-xs tabular-nums">{value}{unit}</output></div>
      <Slider min={range.min} max={range.max} step={1} value={[value]} onValueChange={([v]) => range.onChange(v)} aria-label={label} />
    </div>
  )
}

export function BackgroundPanel({config, choose}: {config: any; choose: (k: string, v: any) => void}) {
  const mode = config.bgMode || 'linear', motion = config.bgMotion || 'none'
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const set = (patch: Record<string, any>) => { for (const [k, v] of Object.entries(patch)) choose(k, v) }

  // The picture is decoded before it is used, so the preview and the export never meet an image that is not ready.
  const upload = async (file?: File) => {
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Elegí un archivo de imagen.'); return }
    if (file.size > limits.fileMB * 1024 * 1024) { setError(`La imagen pesa más de ${limits.fileMB} MB.`); return }
    try { const src = await encode(file); await loadBackground(src); set({bgImage: src, bgMode: 'image'}) }
    catch { setError('No se pudo abrir esa imagen.') }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <LabelWithInfo label="Tipo de fondo" info="Sólido es un solo color. Degradé mezcla dos colores. Radial parte del centro hacia afuera. Imagen usa una foto tuya." />
        <ToggleGroup type="single" value={mode} onValueChange={v => { if (!v) return; if (v === 'image' && !config.bgImage) input.current?.click(); else choose('bgMode', v) }} aria-label="Tipo de fondo">
          <ToggleGroupItem value="solid">Sólido</ToggleGroupItem>
          <ToggleGroupItem value="linear">Degradé</ToggleGroupItem>
          <ToggleGroupItem value="radial">Radial</ToggleGroupItem>
          <ToggleGroupItem value="image">Imagen</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={async e => { await upload(e.target.files?.[0]); e.target.value = '' }} />

      {mode === 'image' ? (
        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-2">
            {config.bgImage ? <img src={config.bgImage} alt="Imagen de fondo" className="h-14 w-20 rounded-lg object-cover" /> : <span className="grid h-14 w-20 place-items-center rounded-lg bg-muted text-muted-foreground"><ImagePlus className="size-5" /></span>}
            <div className="mr-auto grid gap-0.5 text-xs"><span className="font-medium">{config.bgImage ? 'Tu imagen de fondo' : 'Sin imagen todavía'}</span><span className="text-muted-foreground">PNG, JPG, WebP o AVIF</span></div>
            <Button variant="outline" size="sm" onClick={() => input.current?.click()}>{config.bgImage ? 'Cambiar' : 'Subir'}</Button>
            {config.bgImage && <Button variant="ghost" size="icon-sm" aria-label="Quitar imagen de fondo" onClick={() => set({bgImage: undefined, bgMode: 'linear'})}><X /></Button>}
          </div>
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <Slide label="Desenfoque" value={config.bgBlur ?? 0} unit=" px" min={0} max={40} onChange={v => choose('bgBlur', v)} info="Desenfoca la imagen para que las pantallas se lean mejor encima." />
          <Slide label="Oscurecer" value={config.bgDim ?? 0} unit="%" min={0} max={80} onChange={v => choose('bgDim', v)} info="Pone una capa oscura sobre la imagen para dar contraste a las pantallas." />
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <Label>{mode === 'solid' ? 'Colores lisos' : 'Degradés listos'}</Label>
            <div className="grid grid-cols-6 gap-2">
              {mode === 'solid'
                ? solids.map(c => <Swatch key={c} label={c} css={c} active={config.top.toLowerCase() === c} onClick={() => choose('top', c)} />)
                : gradients.map(([a, b]) => (
                  <Swatch key={a + b} label={`${a} a ${b}`} css={mode === 'radial' ? `radial-gradient(circle at 50% 38%, ${a}, ${b})` : `linear-gradient(${config.angle ?? 180}deg, ${a} 30%, ${b} 70%)`}
                    active={config.top.toLowerCase() === a && config.bottom.toLowerCase() === b} onClick={() => set({top: a, bottom: b})} />
                ))}
            </div>
          </div>
          <div className={cn('grid gap-2', mode === 'solid' ? 'grid-cols-1' : 'grid-cols-2')}>
            <Color label={mode === 'solid' ? 'Color' : mode === 'radial' ? 'Centro' : 'Arriba'} value={hex.test(config.top) ? config.top : '#000000'} onChange={v => choose('top', v)} />
            {mode !== 'solid' && <Color label={mode === 'radial' ? 'Borde' : 'Abajo'} value={hex.test(config.bottom) ? config.bottom : '#000000'} onChange={v => choose('bottom', v)} />}
          </div>
          {mode === 'linear' && <Slide label="Ángulo" value={config.angle ?? 180} unit="°" min={0} max={360} onChange={v => choose('angle', v)} info="Hacia dónde corre el degradé. 180° va de arriba hacia abajo." />}
        </>
      )}

      <div className="grid gap-2 rounded-xl border border-border bg-background p-3">
        <LabelWithInfo label="Animación del fondo (opcional)" info="Hace que el fondo se mueva y vuelva al punto de partida, así el video sigue repitiéndose sin corte. Suave balancea el degradé o acerca despacio la imagen. Aurora suma manchas de color que se mueven." />
        <ToggleGroup type="single" value={motion} onValueChange={v => v && choose('bgMotion', v)} aria-label="Animación del fondo">
          <ToggleGroupItem value="none">Ninguna</ToggleGroupItem>
          <ToggleGroupItem value="drift">Suave</ToggleGroupItem>
          {mode !== 'image' && <ToggleGroupItem value="aurora">Aurora</ToggleGroupItem>}
        </ToggleGroup>
        {motion === 'aurora' && mode !== 'image' && (
          <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-xs">
            <Checkbox checked={!!config.bgFromImages} onCheckedChange={v => choose('bgFromImages', v === true)} className="mt-0.5" />
            <span className="grid gap-0.5"><span className="font-medium">Usar los colores de tus imágenes</span><span className="text-muted-foreground">Las manchas toman el color de cada pantalla.</span></span>
          </label>
        )}
      </div>
    </div>
  )
}
