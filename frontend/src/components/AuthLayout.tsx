import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import { BrandMark } from './BrandMark'
import { GoogleButton } from './GoogleButton'

type Props = { title: string; subtitle: string; children: ReactNode; footer: ReactNode }

/** Diseño común de login y registro: marca, botón de Google y el formulario en una tarjeta. */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-linear-to-b from-secondary to-background px-4 pt-safe pb-safe">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-16 rounded-2xl shadow-md" />
          <div>
            <p className="text-sm font-semibold text-primary">Lista de la compra</p>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <Card className="gap-5 px-6 py-6 shadow-lg">
          <GoogleButton />
          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />o con tu email<span className="h-px flex-1 bg-border" />
          </div>
          {children}
        </Card>

        <p className="text-center text-sm text-muted-foreground">{footer}</p>
        <p className="text-center text-xs">
          <Link to="/privacidad" className="text-muted-foreground underline-offset-4 hover:underline">
            Privacidad
          </Link>
        </p>
      </main>
    </div>
  )
}
