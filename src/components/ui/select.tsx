import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import {Check, ChevronDown} from 'lucide-react'
import {cn} from '@/lib/utils'

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value
const SelectGroup = SelectPrimitive.Group

function SelectTrigger({className, children, ...props}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger className={cn('flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:truncate', className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 opacity-60" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({className, children, position = 'popper', ...props}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content position={position} className={cn('relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', position === 'popper' && 'w-[var(--radix-select-trigger-width)] translate-y-1', className)} {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({className, children, description, ...props}: React.ComponentProps<typeof SelectPrimitive.Item> & {description?: string}) {
  return (
    <SelectPrimitive.Item className={cn('relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-8 text-sm outline-none data-[highlighted]:bg-accent data-[disabled]:opacity-50', className)} {...props}>
      <span className="grid gap-0.5"><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>{description && <span className="text-xs text-muted-foreground">{description}</span>}</span>
      <span className="absolute right-2 flex size-4 items-center justify-center"><SelectPrimitive.ItemIndicator><Check className="size-4" /></SelectPrimitive.ItemIndicator></span>
    </SelectPrimitive.Item>
  )
}

function SelectLabel({className, ...props}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn('px-3 py-1.5 text-xs text-muted-foreground', className)} {...props} />
}

export {Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectLabel}
