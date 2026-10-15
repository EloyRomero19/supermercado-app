import { ChevronRight, LogOut, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { useConfirm } from '@/components/useConfirm'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { InstallCard } from '@/pwa/InstallCard'
import { useTheme, type ThemePreference } from '@/theme/theme'

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Automático', Icon: Monitor },
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
]

export function AccountPage() {
  const { user, logout } = useAuth()
  const { confirm, confirmDialog } = useConfirm()
  if (!user) return null

  const signOut = async () => {
    if (await confirm({ title: '¿Cerrar sesión?', description: 'Tendrás que volver a entrar para ver tus listas.', confirmLabel: 'Cerrar sesión' })) {
      await logout()
    }
  }

  return (
    <>
      <PageHeader title="Cuenta" />
      <main className="flex flex-col gap-4 p-4">
        <Card className="flex-row items-center gap-4 px-4 py-5">
          <UserAvatar name={user.displayName} className="size-16 text-xl" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{user.displayName}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </Card>

        <ThemePicker />

        <InstallCard />

        <Card className="gap-0 px-2 py-2">
          <Link
            to="/privacidad"
            className="flex min-h-12 items-center gap-3 rounded-lg px-3 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            Privacidad
            <ChevronRight className="ml-auto size-5 text-muted-foreground" aria-hidden="true" />
          </Link>
        </Card>

        <Button variant="outline" size="lg" className="h-11 text-destructive hover:text-destructive" onClick={signOut}>
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </Button>
      </main>
      {confirmDialog}
    </>
  )
}

/** Claro, oscuro o automático. Radios nativos (ocultos) dentro de las tarjetas: teclado y lector de pantalla gratis. */
function ThemePicker() {
  const { preference, theme, setPreference } = useTheme()
  return (
    <Card className="gap-3 px-4 py-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-semibold">Apariencia</legend>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <label
              key={value}
              className={cn(
                'flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-sm font-medium transition-colors',
                'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50',
                preference === value ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <input type="radio" name="theme" value={value} checked={preference === value} onChange={() => setPreference(value)} className="sr-only" />
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        {preference === 'system'
          ? `Como tu dispositivo (ahora, ${theme === 'dark' ? 'oscuro' : 'claro'}).`
          : 'Se guarda en este dispositivo.'}
      </p>
    </Card>
  )
}
