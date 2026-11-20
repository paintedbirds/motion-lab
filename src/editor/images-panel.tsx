import {useRef, useState} from 'react'
import {ArrowDown, ArrowUp, Crop, ImagePlus, X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Checkbox} from '@/components/ui/checkbox'
import {Label} from '@/components/ui/label'
import {LabelWithInfo} from '@/components/info-tip'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group'
import {cn} from '@/lib/utils'
import {limits} from './use-editor'
import {samples} from './samples'
import {RECOMMENDED} from './template'

const ratios = ['auto', '1:1', '4:3', '3:4', '4:5', '16:9', '9:16']

export function ImagesPanel({ed, onCrop}: {ed: any; onCrop: (i: number) => void}) {
  const {config, project, note, exporting} = ed
  const input = useRef<HTMLInputElement>(null)
  const [dragged, setDragged] = useState<number | null>(null)
  const [over, setOver] = useState<{i: number; after: boolean} | null>(null)
  const lead = config.assets.findIndex((a: any) => a.selected)
  let position = 0
  const full = config.assets.length >= limits.images

  return (
    <div className="grid gap-4">
      <button type="button" disabled={exporting} onClick={() => input.current?.click()}
        className="grid justify-items-center gap-1 rounded-xl border border-dashed border-input bg-card px-4 py-5 text-center outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        <ImagePlus className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">Agregar imágenes</span>
        <small className="text-xs text-muted-foreground">{full ? `Llegaste al máximo de ${limits.images}` : `PNG, JPG, WebP, AVIF o GIF · hasta ${limits.images} · arrastrá o pegá con Ctrl+V`}</small>
      </button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={async e => { await ed.addFiles([...(e.target.files || [])]); e.target.value = '' }} />
      {note.text && <p role="alert" className={cn('text-xs leading-relaxed', note.kind === 'error' ? 'text-destructive' : 'text-muted-foreground')}>{note.text}</p>}

      {(config.assets.length > 0 || true) && (
        <ul className="m-0 grid list-none gap-1 p-0">
          {config.assets.map((a: any, i: number) => (
            <li key={a.name + i} draggable
              onDragStart={e => { setDragged(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', a.name) }}
              onDragEnd={() => { setDragged(null); setOver(null) }}
              onDragOver={e => { if (dragged === null) return; e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setOver({i, after: e.clientY > r.top + r.height / 2}) }}
              onDragLeave={() => setOver(null)}
              onDrop={e => { if (dragged === null) return; e.preventDefault(); const after = over?.after, from = dragged, to = i + (after ? 1 : 0); setDragged(null); setOver(null); ed.move(from, to > from ? to - 1 : to) }}
              className={cn('flex cursor-grab items-center gap-2 rounded-lg border border-transparent p-1.5 hover:bg-accent', dragged === i && 'opacity-40', over?.i === i && dragged !== i && (over.after ? 'border-b-foreground' : 'border-t-foreground'), !a.selected && 'opacity-60')}>
              <span className="w-4 text-right text-[11px] tabular-nums text-muted-foreground">{a.selected ? ++position : '·'}</span>
              <Checkbox checked={a.selected} onCheckedChange={v => ed.toggle(i, v === true)} aria-label={'Incluir ' + a.name} />
              <button type="button" onClick={() => onCrop(i)} aria-label={'Encuadrar ' + a.name} title="Encuadrar" className="relative shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <img src={a.src} alt="" draggable={false} className="h-9 w-12 rounded-md bg-muted object-contain" />
                <Crop className={cn('absolute -bottom-1 -right-1 size-4 rounded-full border border-border bg-background p-[3px] text-muted-foreground', a.crop && 'border-foreground bg-foreground text-background')} />
              </button>
              <span className="min-w-0 flex-1 truncate text-xs" title={a.name}>{a.name}</span>
              {i === lead && config.assets.length > 1 && <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Principal</span>}
              <Button variant="ghost" size="icon-sm" disabled={i === 0} aria-label={`Mover ${a.name} arriba`} onClick={() => ed.move(i, i - 1)}><ArrowUp /></Button>
              <Button variant="ghost" size="icon-sm" disabled={i === config.assets.length - 1} aria-label={`Mover ${a.name} abajo`} onClick={() => ed.move(i, i + 1)}><ArrowDown /></Button>
              <Button variant="ghost" size="icon-sm" aria-label={'Quitar ' + a.name} onClick={() => ed.remove(i)}><X /></Button>
            </li>
          ))}
          {Array.from({length: Math.max(0, RECOMMENDED - config.assets.length)}, (_, k) => (
            <li key={'empty' + k}>
              <button type="button" disabled={exporting} onClick={() => input.current?.click()} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-input p-1.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                <span className="w-4 text-right text-[11px] tabular-nums text-muted-foreground">{config.assets.length + k + 1}</span>
                <span className="size-4" />
                <span className="grid h-9 w-12 place-items-center rounded-md bg-muted text-muted-foreground"><ImagePlus className="size-4" /></span>
                <span className="text-xs text-muted-foreground">Imagen {config.assets.length + k + 1} · vacía</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {(config.assets.length > 1 || config.assets.length < RECOMMENDED) && (
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">Arrastrá una fila o usá las flechas para ordenar. La primera abre el video.</p>
          <div className="flex shrink-0 flex-col items-end gap-1">{config.assets.length < RECOMMENDED && <Button variant="link" size="sm" className="h-auto p-0 text-[11px]" onClick={ed.fillTemplates}>Usar ejemplos</Button>}<Button variant="link" size="sm" className="h-auto p-0 text-[11px]" onClick={ed.clear}>Quitar todas</Button></div>
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex justify-between"><LabelWithInfo label="Forma de las tarjetas" info="Auto respeta la forma de cada imagen. Elegir una forma la fija igual para todas, útil si mezclás capturas de celular y de escritorio." /><span className="text-[11px] text-muted-foreground">{config.ratio === 'auto' ? 'según las imágenes' : 'igual en todo el video'}</span></div>
        <ToggleGroup type="single" value={config.ratio} onValueChange={v => v && ed.choose('ratio', v)} aria-label="Forma de las tarjetas">
          {ratios.map(r => <ToggleGroupItem key={r} value={r} className="px-0 text-[11px]">{r === 'auto' ? 'Auto' : r}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label>Imágenes en uso</Label>
        <Select value={project} onValueChange={ed.changeProject}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="own">Mis imágenes</SelectItem>
            {Object.entries(samples).map(([k, p]) => <SelectItem key={k} value={k}>Ejemplo · {p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
