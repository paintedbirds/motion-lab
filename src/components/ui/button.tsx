import * as React from 'react'
import {Slot} from '@radix-ui/react-slot'
import {cva, type VariantProps} from 'class-variance-authority'
import {cn} from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[transform,background-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        outline: 'border border-border bg-transparent hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'rounded-sm text-muted-foreground underline underline-offset-4 hover:text-foreground',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3.5 text-[13px]',
        lg: 'h-12 px-6 text-base',
        icon: 'size-9',
        'icon-sm': 'size-7',
      },
    },
    defaultVariants: {variant: 'default', size: 'default'},
  },
)

type Props = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & {asChild?: boolean}

const Button = React.forwardRef<HTMLButtonElement, Props>(({className, variant, size, asChild = false, ...props}, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp ref={ref} className={cn(buttonVariants({variant, size}), className)} {...props} />
})
Button.displayName = 'Button'

export {Button, buttonVariants}
