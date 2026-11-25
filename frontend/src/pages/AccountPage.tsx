import { ChevronRight, LogOut, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { useConfirm } from '@/components/useConfirm'
import { UserAvatar } from '@/components/UserAvatar'
import { InstallCard } from '@/pwa/InstallCard'

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
      <main className="flex w-full max-w-3xl flex-col gap-7 px-4 pt-5 lg:px-8">
        <div className="flex items-center gap-3">
          <UserAvatar name={user.displayName} className="size-14 text-xl" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{user.displayName}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <InstallCard />

        <div className="divide-y border-y">
          <Link
            to="/privacidad"
            className="flex min-h-14 items-center gap-3 px-1 outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
          >
            <ShieldCheck className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            Privacidad
            <ChevronRight className="ml-auto size-5 text-muted-foreground" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-14 w-full items-center gap-3 px-1 text-left outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
          >
            <LogOut className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>

        <Link to="/cuenta/borrar" className="self-start text-sm text-destructive underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
          Borrar mi cuenta
        </Link>
      </main>
      {confirmDialog}
    </>
  )
}
