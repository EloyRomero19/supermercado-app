import { Link, useLocation } from 'react-router'
import { lastListId } from '../lists/lastList'

/** Barra de navegación inferior, como en las apps del móvil: siempre a mano del pulgar. */
export function TabBar() {
  const { pathname } = useLocation()
  const lastList = lastListId()

  const tabs = [
    { to: '/', label: 'Listas', icon: <ListsIcon />, active: pathname === '/' },
    {
      to: lastList ? `/listas/${lastList}` : '/',
      label: 'Comprar',
      icon: <CartIcon />,
      active: pathname.startsWith('/listas/'),
    },
    { to: '/ajustes', label: 'Ajustes', icon: <SettingsIcon />, active: pathname === '/ajustes' },
  ]

  return (
    <nav className="tabbar" aria-label="Navegación principal">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          to={tab.to}
          className={tab.active ? 'tab tab-active' : 'tab'}
          aria-current={tab.active ? 'page' : undefined}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}

// Iconos de línea dibujados con SVG: se adaptan al color del texto (currentColor)
const svgProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

function ListsIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg {...svgProps}>
      <path d="M3 4h2l2.4 11h11l2.1-8H7" />
      <circle cx="10" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  )
}
