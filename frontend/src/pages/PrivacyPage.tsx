import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// PENDIENTE: pon aquí el email al que la gente puede escribir para ejercer sus derechos
const CONTACT_EMAIL = 'contacto@tudominio.com'

/** Política de privacidad. Revísala antes de publicar. */
export function PrivacyPage() {
  const navigate = useNavigate()
  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl">
      <PageHeader
        title="Privacidad"
        leading={
          <Button variant="ghost" size="icon" className="size-11" aria-label="Volver" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" />
          </Button>
        }
      />
      <main className="flex flex-col gap-3 p-4 pb-safe">
        <Section title="Qué datos guardamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Tu email y tu nombre, para identificarte y mostrarte a los miembros de tus listas.</li>
            <li>Tu contraseña cifrada (nunca la guardamos tal cual).</li>
            <li>Tus listas, sus productos y quién los añadió o los cogió.</li>
          </ul>
        </Section>
        <Section title="Para qué los usamos">
          <p>Solo para que la aplicación funcione. No los vendemos, no los cedemos a terceros y no hay publicidad.</p>
          <p>Los miembros de una lista ven tu nombre y los productos que añades o marcas en esa lista.</p>
        </Section>
        <Section title="Cookies">
          <p>Usamos una única cookie técnica para mantener tu sesión iniciada. No usamos cookies de análisis ni de publicidad.</p>
        </Section>
        <Section title="Correos">
          <p>Solo te escribimos si lo pides: el enlace para cambiar tu contraseña cuando la has olvidado. Nada de publicidad.</p>
        </Section>
        <Section title="Tus derechos">
          <p>
            Puedes pedir una copia de tus datos, corregirlos o borrar tu cuenta escribiendo a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="gap-2 px-5 py-5 text-sm leading-relaxed">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </Card>
  )
}
