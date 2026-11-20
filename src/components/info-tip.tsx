import {Info} from 'lucide-react'
import {Label} from '@/components/ui/label'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'

// A label with a small (i) that explains the control on hover or focus.
export function InfoTip({text, label}: {text: string; label: string}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={`Qué hace: ${label}`} className="inline-grid size-4 place-items-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"><Info className="size-3.5" /></button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-[12px] leading-snug" side="top">{text}</TooltipContent>
    </Tooltip>
  )
}

export function LabelWithInfo({label, info, htmlFor}: {label: string; info?: string; htmlFor?: string}) {
  return <span className="flex items-center gap-1.5"><Label htmlFor={htmlFor}>{label}</Label>{info && <InfoTip text={info} label={label} />}</span>
}
