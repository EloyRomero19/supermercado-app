import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Props = {
  name: string
  avatarUrl: string | null
  className?: string
  /** Fondo de la inicial (p. ej. bg-card si el avatar va sobre un fondo bg-secondary) */
  fallbackClassName?: string
}

/** Foto de Google o, si no hay, la inicial sobre el color de marca. */
export function UserAvatar({ name, avatarUrl, className, fallbackClassName }: Props) {
  return (
    <Avatar className={cn('size-9', className)}>
      {/* no-referrer: las fotos de Google a veces se niegan a cargar si se envía la página de origen */}
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback className={cn('bg-secondary font-semibold text-secondary-foreground', fallbackClassName)}>
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
