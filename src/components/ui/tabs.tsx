import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import {cn} from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({className, ...props}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('flex w-full gap-0.5 border-b border-border p-1.5', className)} {...props} />
}

function TabsTrigger({className, ...props}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn('inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-secondary data-[state=active]:text-foreground', className)}
      {...props}
    />
  )
}

function TabsContent({className, ...props}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('min-h-0 flex-1 outline-none data-[state=inactive]:hidden', className)} {...props} />
}

export {Tabs, TabsList, TabsTrigger, TabsContent}
