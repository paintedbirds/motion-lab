import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import {cn} from '@/lib/utils'

function Slider({className, ...props}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const count = (props.value ?? props.defaultValue ?? [0]).length
  return (
    <SliderPrimitive.Root className={cn('relative flex w-full touch-none select-none items-center py-2 data-[disabled]:opacity-50', className)} {...props}>
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-foreground" />
      </SliderPrimitive.Track>
      {Array.from({length: count}, (_, i) => (
        <SliderPrimitive.Thumb key={i} className="block size-4 rounded-full border-2 border-foreground bg-background shadow-sm outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" />
      ))}
    </SliderPrimitive.Root>
  )
}

export {Slider}
