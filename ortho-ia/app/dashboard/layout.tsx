'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  FilePlus,
  History,
  User,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import FeedbackButton from '@/components/FeedbackButton'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [monthlyCount, setMonthlyCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      const [{ data: sub }, { data: count }] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase.rpc('get_monthly_crbo_count', { p_user_id: user.id }),
      ])
      setSubscription(sub)
      setMonthlyCount(typeof count === 'number' ? count : 0)
      setLoading(false)
    }
    checkAuth()
  }, [router, pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Nouveau CRBO', href: '/dashboard/nouveau-crbo', icon: FilePlus, primary: true },
    { name: 'Mes patients', href: '/dashboard/patients', icon: Users },
    { name: 'Historique', href: '/dashboard/historique', icon: History },
    { name: 'Mon profil', href: '/dashboard/profil', icon: User },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const activeItem = navigation.find(n => n.href === pathname)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark text-gray-900 dark:text-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-surface-dark-subtle border-r border-gray-200 dark:border-surface-dark-muted
        transform transition-transform duration-200 ease-smooth
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-surface-dark-muted">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow transition-shadow">
                <span className="text-white font-bold text-base">O</span>
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
                Ortho<span className="text-primary-600 dark:text-primary-400">.ia</span>
              </span>
            </Link>
            <button
              className="lg:hidden btn-ghost p-1.5"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation épurée */}
          <nav className="flex-1 px-3 py-5 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 ease-smooth
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark-muted hover:text-gray-900 dark:hover:text-gray-100'}
                  `}
                >
                  <item.icon
                    size={18}
                    className={isActive ? 'text-primary-600 dark:text-primary-400' : ''}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.primary && !isActive && (
                    <span className="text-[10px] uppercase tracking-wider bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded">
                      ✨
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quota — compteur mensuel recalculé depuis crbos.created_at (reset 1er du mois) */}
          {subscription && (() => {
            const isUnlimited = subscription.crbo_limit === -1 || subscription.plan !== 'free'
            const limit = isUnlimited ? null : (subscription.crbo_limit ?? 10)
            const percent = limit ? Math.min(100, Math.round((monthlyCount / limit) * 100)) : 0
            const nearLimit = limit !== null && monthlyCount >= limit - 2 && monthlyCount < limit
            const reached = limit !== null && monthlyCount >= limit
            return (
              <div className="px-4 pb-4">
                <div className="bg-gray-50 dark:bg-surface-dark-muted rounded-lg p-3 border border-gray-100 dark:border-surface-dark-muted">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">CRBOs ce mois</span>
                    <span className={`font-semibold ${reached ? 'text-red-600 dark:text-red-400' : nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-gray-100'}`}>
                      {monthlyCount}/{isUnlimited ? '∞' : limit}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-surface-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${reached ? 'bg-red-500' : nearLimit ? 'bg-amber-500' : 'bg-primary-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                  {isUnlimited && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-primary-700 dark:text-primary-300 font-medium">
                      <Sparkles size={10} />
                      <span className="uppercase tracking-wider">Pro · illimité</span>
                    </div>
                  )}
                  {!isUnlimited && (
                    <Link
                      href="/dashboard/upgrade"
                      className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md transition"
                    >
                      <Sparkles size={14} />
                      {reached ? 'Passer Pro — illimité' : 'Passer Pro'}
                    </Link>
                  )}
                </div>
              </div>
            )
          })()}

          {/* User */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-surface-dark-muted">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                  {user?.user_metadata?.prenom?.[0] || user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.user_metadata?.prenom} {user?.user_metadata?.nom}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-surface-dark-muted transition"
                title="Se déconnecter"
                aria-label="Se déconnecter"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark-subtle/80 backdrop-blur-sm border-b border-gray-200 dark:border-surface-dark-muted h-16 flex items-center px-4 lg:px-8">
          <button
            className="lg:hidden btn-ghost p-1.5 -ml-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-2 lg:ml-0">
            <Link href="/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200 transition">
              Dashboard
            </Link>
            {pathname !== '/dashboard' && (
              <>
                <ChevronRight size={14} className="mx-1.5 text-gray-400 dark:text-gray-600" />
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {activeItem?.name || 'Page'}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
        <FeedbackButton />
      </div>
    </div>
  )
}
