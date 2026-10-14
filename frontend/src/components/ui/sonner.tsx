import { CircleAlert, CircleCheck, Info, LoaderCircle } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/theme/theme'

/**
 * Avisos tipo "toast" (sonner) con los colores de la app. Arriba en el centro: abajo está la
 * barra de navegación. Sigue el tema elegido en Cuenta (o el del sistema), como el resto.
 */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      mobileOffset={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      icons={{
        success: <CircleCheck className="size-4 text-success" />,
        error: <CircleAlert className="size-4 text-destructive" />,
        info: <Info className="size-4 text-primary" />,
        loading: <LoaderCircle className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as CSSProperties
      }
      toastOptions={{ classNames: { toast: 'font-sans shadow-lg', actionButton: '!bg-primary !text-primary-foreground !font-semibold' } }}
      {...props}
    />
  )
}
