import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import {cn} from '@/lib/utils'

function ToggleGroup({className, ...props}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return <ToggleGroupPrimitive.Root className={cn('flex w-full gap-1 rounded-lg border border-border bg-background p-1', className)} {...props} />
}

const ToggleGroupItem = React.forwardRef<React.ElementRef<typeof ToggleGroupPrimitive.Item>, React.ComponentProps<typeof ToggleGroupPrimitive.Item>>(({className, ...props}, ref) => {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn('inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground tabular-nums outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm', className)}
      {...props}
    />
  )
})
ToggleGroupItem.displayName = 'ToggleGroupItem'

export {ToggleGroup, ToggleGroupItem}
