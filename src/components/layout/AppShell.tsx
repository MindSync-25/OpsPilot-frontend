import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { useThemeStore } from '@/app/themeStore'
import { getNavigationItems } from '@/lib/roles'
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Building2,
  FileText,
  Clock,
  Settings,
  LogOut,
  Menu,
  Search,
  User,
  ChevronDown,
  Moon,
  Sun,
  UsersRound,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

interface AppShellProps {
  children: React.ReactNode
}

const iconMap: Record<string, any> = {
  Dashboard: LayoutDashboard,
  Teams: UsersRound,
  Team: Users,
  Projects: FolderKanban,
  Tasks: CheckSquare,
  'Time Tracking': Clock,
  Invoices: FileText,
  Reports: BarChart3,
  Clients: Building2,
  Settings: Settings,
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed')
    return stored === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const navigation = useMemo(() => {
    if (!user?.role) return []
    return getNavigationItems(user.role).map(item => ({
      ...item,
      icon: iconMap[item.name] || LayoutDashboard
    }))
  }, [user?.role])

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:bg-card lg:border-r lg:border-border transition-all duration-300",
        sidebarCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-20 px-6 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-primary-foreground font-bold text-lg">IT</span>
              </div>
              {!sidebarCollapsed && (
                <span className="text-xl font-extrabold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
                  OpsFlow
                </span>
              )}
            </div>
          </div>

          {/* Collapse Toggle Button */}
          <div className="px-3 pt-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "w-full hover:bg-accent/30 transition-all duration-200",
                sidebarCollapsed ? "justify-center px-2" : "justify-start px-3"
              )}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="ml-2 text-sm">Collapse</span>
                </>
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={cn(
                    'group relative flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-accent/50 text-foreground'
                      : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground',
                    sidebarCollapsed ? 'justify-center' : ''
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <Icon className={cn("w-5 h-5", !sidebarCollapsed && "ml-1")} />
                  {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center w-full px-3 py-3 text-sm rounded-lg hover:bg-accent/30 transition-all duration-200",
                  sidebarCollapsed && "justify-center"
                )}>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <>
                      <div className="ml-3 text-left flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {user?.email || ''}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground/60" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-6 border-b border-border/60">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">IT</span>
              </div>
              <span className="text-xl font-extrabold">OpsFlow</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group relative flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-accent/50 text-foreground'
                      : 'text-muted-foreground hover:bg-accent/30 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <Icon className="w-5 h-5 ml-1" />
                  <span className="ml-3">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/40 shadow-sm">
          <div className="flex items-center h-16 px-4 sm:px-6 gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Search - Visually Dominant */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  placeholder="Search..."
                  className="pl-10 h-10 bg-background/60 border-border/60 focus:bg-background focus:border-primary/40 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Theme Indicator - Navigate to Settings */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/app/settings')}
                title="Theme settings"
                className="text-muted-foreground/60 hover:text-foreground hover:bg-accent/50"
              >
                {theme === 'dark-sage' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>

              {/* Notifications */}
              <NotificationBell />

              {/* User menu - desktop */}
              <div className="hidden lg:block ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 hover:bg-accent/50">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {user?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden xl:inline-block">
                        {user?.name || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
