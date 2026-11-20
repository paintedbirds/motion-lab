import {cn} from '@/lib/utils'

// "Par": the name with its two o drawn as a dot and a ring. No separate symbol.
export function Logo({className}: {className?: string}) {
  return (
    <span className={cn('lockup inline-flex items-center font-medium leading-none tracking-[-0.03em]', className)} role="img" aria-label="Motion Lab">
      <span aria-hidden="true">M<i className="o" />ti<i className="o ring" />n Lab</span>
    </span>
  )
}
