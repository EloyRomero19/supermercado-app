import { Link } from 'react-router'

// PENDIENTE: pon aquí el email al que la gente puede escribir para ejercer sus derechos
const CONTACT_EMAIL = 'contacto@tudominio.com'

/** Política de privacidad. Google la exige para publicar el login con Google. Revísala antes de publicar. */
export function PrivacyPage() {
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="link-button">
          ← Volver
        </Link>
        <h1 className="topbar-title">Privacidad</h1>
        <span />
      </header>
      <main className="content prose">
        <section className="card">
          <h2>Qué datos guardamos</h2>
          <ul>
            <li>Tu email y tu nombre, para identificarte y mostrarte a los miembros de tus listas.</li>
            <li>Si entras con Google: tu identificador de Google y tu foto de perfil. No accedemos a nada más de tu cuenta.</li>
            <li>Si entras con contraseña: la contraseña cifrada (nunca la guardamos tal cual).</li>
            <li>Tus listas, sus productos y quién los añadió o los cogió.</li>
          </ul>
        </section>
        <section className="card">
          <h2>Para qué los usamos</h2>
          <p>Solo para que la aplicación funcione. No los vendemos, no los cedemos a terceros y no hay publicidad.</p>
          <p>Los miembros de una lista ven tu nombre, tu foto y los productos que añades o marcas en esa lista.</p>
        </section>
        <section className="card">
          <h2>Cookies</h2>
          <p>
            Usamos una única cookie técnica para mantener tu sesión iniciada. No usamos cookies de análisis ni de
            publicidad.
          </p>
        </section>
        <section className="card">
          <h2>Tus derechos</h2>
          <p>
            Puedes pedir una copia de tus datos, corregirlos o borrar tu cuenta escribiendo a{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </main>
    </div>
  )
}
