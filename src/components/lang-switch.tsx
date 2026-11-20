import {useSyncExternalStore} from 'react'
import {getLang, setLang, subscribeLang, type Lang} from '@/i18n'
import {cn} from '@/lib/utils'

export function LangSwitch({className}: {className?: string}) {
  const lang = useSyncExternalStore(subscribeLang, getLang)
  return (
    <div className={cn('flex rounded-md border border-border p-0.5 text-xs', className)} role="group" aria-label="Idioma">
      {(['es', 'en'] as Lang[]).map(l => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className="rounded-[5px] px-2 py-1 font-medium uppercase text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background">{l}</button>
      ))}
    </div>
  )
}
