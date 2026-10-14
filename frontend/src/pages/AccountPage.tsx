import { ChevronRight, LogOut, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { PageHeader } from '@/components/PageHeader'
import { useConfirm } from '@/components/useConfirm'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      <main className="flex flex-col gap-4 p-4">
        <Card className="flex-row items-center gap-4 px-4 py-5">
          <UserAvatar name={user.displayName} avatarUrl={user.avatarUrl} className="size-16 text-xl" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{user.displayName}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </Card>

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
