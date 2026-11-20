import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {X} from 'lucide-react'
import {cn} from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTitle = ({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Title>) => <DialogPrimitive.Title className={cn('truncate text-base font-medium tracking-tight', className)} {...props} />
const DialogDescription = ({className, ...props}: React.ComponentProps<typeof DialogPrimitive.Description>) => <DialogPrimitive.Description className={cn('text-[13px] leading-relaxed text-muted-foreground', className)} {...props} />

function DialogContent({className, children, ...props}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content className={cn('fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-24px)] w-[min(780px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-xl border border-border bg-background p-5 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)} {...props}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Cerrar"><X className="size-4" /></DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export {Dialog, DialogContent, DialogTitle, DialogDescription}
