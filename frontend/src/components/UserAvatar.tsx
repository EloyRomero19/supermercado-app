import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Props = {
  name: string
  className?: string
  /** Fondo de la inicial (p. ej. bg-card si el avatar va sobre un fondo bg-secondary) */
  fallbackClassName?: string
}

/** La inicial del nombre sobre el color de marca. */
export function UserAvatar({ name, className, fallbackClassName }: Props) {
  return (
    <Avatar className={cn('size-9', className)}>
      <AvatarFallback className={cn('bg-secondary font-semibold text-secondary-foreground', fallbackClassName)}>
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
