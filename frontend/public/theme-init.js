// Aplica el tema (claro u oscuro) ANTES de pintar la página, para que no haya un destello claro
// al abrirla en modo oscuro. Va en un archivo aparte y no en un <script> en línea porque la CSP
// de producción prohíbe los scripts en línea. El resto (cambiar de tema, seguir al sistema) está
// en src/theme/theme.ts, que usa la misma clave "theme".
;(function () {
  var pref = 'system'
  try {
    pref = localStorage.getItem('theme') || 'system'
  } catch {
    // sin almacenamiento: como el sistema
  }
  var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
