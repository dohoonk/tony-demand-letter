import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/button'
import { FileText, LayoutTemplate, Settings, LogOut, User } from 'lucide-react'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <div
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-md">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Steno</span>
          </div>

          <nav className="flex items-center gap-1">
            <Button
              variant={isActive('/documents') ? 'secondary' : 'ghost'}
              onClick={() => navigate('/documents')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Documents
            </Button>
            <Button
              variant={isActive('/templates') ? 'secondary' : 'ghost'}
              onClick={() => navigate('/templates')}
              className="gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </Button>
            <Button
              variant={isActive('/settings') ? 'secondary' : 'ghost'}
              onClick={() => navigate('/settings/firm')}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-background">
                {user?.role}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  )
}

