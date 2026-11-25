import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BrandMark } from './BrandMark'
import { ListDemo } from './ListDemo'

type Props = { title: string; subtitle: string; children: ReactNode; footer: ReactNode }

/**
 * Pantallas sin sesión (login y registro). Quien llega nuevo tiene que entender qué es esto antes
 * de dar su email: arriba (a la izquierda en escritorio) qué hace la app, con una pizarra de
 * ejemplo en la que se tachan los tomates; después, el formulario.
 */
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex min-h-dvh flex-col pb-safe lg:grid lg:grid-cols-2">
      <section className="px-5 pt-safe pb-8 lg:flex lg:flex-col lg:border-r-2 lg:px-12 lg:pb-12 xl:px-20" aria-labelledby="app-pitch">
        <div className="chalk-title flex h-14 items-center gap-3 text-2xl lg:h-20">
          <BrandMark className="size-9" />
          ¿Qué falta?
        </div>
        <div className="mx-auto w-full max-w-md lg:my-auto">
          <h1 id="app-pitch" className="chalk-title mt-4 text-[2.75rem] leading-[1.02] text-balance lg:text-[3.5rem]">
            Lo que falta en casa, a un toque.
          </h1>
          <p className="mt-4 max-w-[34ch] text-pretty lg:text-lg">
            Apúntalo en casa y táchalo en el súper. Los de casa lo ven al momento.
          </p>
          <ListDemo className="mt-7" />
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 pt-4 pb-8 lg:justify-center lg:pt-12">
        <div>
          <h2 className="chalk-title text-3xl">{title}</h2>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>

        {children}

        <p className="text-muted-foreground">{footer}</p>
        <p className="mt-auto pt-6 text-sm lg:mt-0">
          <Link to="/privacidad" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Privacidad
          </Link>
        </p>
      </main>
    </div>
  )
}
