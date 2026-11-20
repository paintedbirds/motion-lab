import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import {Check} from 'lucide-react'
import {cn} from '@/lib/utils'

function Checkbox({className, ...props}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root className={cn('peer size-4 shrink-0 rounded-[5px] border border-input bg-background outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background', className)} {...props}>
      <CheckboxPrimitive.Indicator className="flex items-center justify-center"><Check className="size-3" strokeWidth={3} /></CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export {Checkbox}
