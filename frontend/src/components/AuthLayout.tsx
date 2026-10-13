import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = { title: string; children: ReactNode; footer: ReactNode }

/** Diseño común de login y registro: cabecera de marca y la tarjeta del formulario encima. */
export function AuthLayout({ title, children, footer }: Props) {
  return (
    <div className="auth-page">
      <header className="auth-hero">
        <img src="/favicon.svg" className="auth-logo" alt="" width="72" height="72" />
        <h1>Lista de la compra</h1>
        <p>Haz la compra en equipo y en tiempo real</p>
        <div className="auth-emojis" aria-hidden="true">
          <span>🍅</span>
          <span>🥖</span>
          <span>🧀</span>
          <span>🍌</span>
          <span>🥛</span>
          <span>🥦</span>
        </div>
      </header>
      <main className="auth-main">
        <section className="card auth-card">
          <h2>{title}</h2>
          {children}
        </section>
        <p className="auth-footer">{footer}</p>
        <p className="footer-link">
          <Link to="/privacidad">Privacidad</Link>
        </p>
      </main>
    </div>
  )
}
