import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import {cn} from '@/lib/utils'

// Without a value the bar slides back and forth, for the moments when the server has not reported yet.
function Progress({className, value, ...props}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-secondary', className)} value={value} {...props}>
      <ProgressPrimitive.Indicator
        className={cn('h-full rounded-full bg-primary transition-[width] duration-300', value == null && 'w-1/3 animate-pulse')}
        style={value == null ? undefined : {width: `${value}%`}}
      />
    </ProgressPrimitive.Root>
  )
}

export {Progress}
