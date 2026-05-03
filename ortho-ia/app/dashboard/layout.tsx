'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
import { createClient } from '@/lib/supabase'
import ThemeToggle from '@/components/ThemeToggle'
import FeedbackButton from '@/components/FeedbackButton'
import { Sidebar, AppHeader, type SidebarItem } from '@/components/layout'

interface DashboardLayoutProps {
  children: ReactNode
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

  const navItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard',                 icon: <LayoutDashboard size={18} /> },
    { id: 'new',       label: 'Nouveau CRBO',    href: '/dashboard/nouveau-crbo',    icon: <FilePlus size={18} />,        primary: true },
    { id: 'patients',  label: 'Mes patients',    href: '/dashboard/patients',        icon: <Users size={18} /> },
    { id: 'history',   label: 'Historique',      href: '/dashboard/historique',      icon: <History size={18} /> },
    { id: 'profile',   label: 'Mon profil',      href: '/dashboard/profil',          icon: <User size={18} /> },
  ]

  const activeItem = navItems.find(n => n.href === pathname)
  const pageLabel = activeItem?.label ?? 'Page'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'grid', placeItems: 'center' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--ds-primary)' }} />
      </div>
    )
  }

  // ============ Bloc footer de la sidebar (quota + profil + logout) ============
  const sidebarFooter = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Quota mensuel — uniquement si plan limité */}
      {subscription && (() => {
        const isUnlimited = subscription.crbo_limit === -1 || (subscription.plan && subscription.plan !== 'free')
        const limit = isUnlimited ? null : (subscription.crbo_limit ?? 10)
        const percent = limit ? Math.min(100, Math.round((monthlyCount / limit) * 100)) : 0
        const nearLimit = limit !== null && monthlyCount >= limit - 2 && monthlyCount < limit
        const reached = limit !== null && monthlyCount >= limit
        return (
          <div style={{
            background: 'var(--bg-surface-2)',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--fg-3)' }}>CRBOs ce mois</span>
              <span style={{
                fontWeight: 600,
                color: reached ? 'var(--ds-danger)' : nearLimit ? 'var(--ds-warning)' : 'var(--fg-1)',
              }}>
                {monthlyCount}/{isUnlimited ? '∞' : limit}
              </span>
            </div>
            {!isUnlimited && (
              <div style={{
                marginTop: 6, height: 4, width: '100%',
                background: 'var(--border-ds)', borderRadius: 999, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${percent}%`,
                  background: reached ? 'var(--ds-danger)' : nearLimit ? 'var(--ds-warning)' : 'var(--ds-primary)',
                  transition: 'width 280ms',
                }} />
              </div>
            )}
            {isUnlimited && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ds-primary)', fontWeight: 600 }}>
                <Sparkles size={11} />
                <span style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pro · illimité</span>
              </div>
            )}
            {!isUnlimited && (
              <Link
                href="/dashboard/upgrade"
                style={{
                  marginTop: 10,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', padding: '7px 10px',
                  background: 'var(--ds-primary)', color: 'var(--fg-on-brand)',
                  fontSize: 12, fontWeight: 600,
                  borderRadius: 8, textDecoration: 'none',
                }}
              >
                <Sparkles size={12} />
                {reached ? 'Passer Pro — illimité' : 'Passer Pro'}
              </Link>
            )}
          </div>
        )
      })()}

      {/* Profil + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
        <span style={{
          width: 32, height: 32, borderRadius: 999,
          background: 'var(--ds-accent-soft)', color: 'var(--ds-accent-hover)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
        }}>
          {user?.user_metadata?.prenom?.[0]?.toUpperCase()
            || user?.email?.[0]?.toUpperCase() || '?'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.user_metadata?.prenom} {user?.user_metadata?.nom}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          style={{
            padding: 6, borderRadius: 8, border: 0,
            background: 'transparent', color: 'var(--fg-3)',
            cursor: 'pointer', display: 'grid', placeItems: 'center',
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )

  // ============ Bloc header de la sidebar (logo + bouton mobile close) ============
  const sidebarHeader = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 18px' }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <SymbolLogo />
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500,
          letterSpacing: '-0.02em', color: 'var(--fg-1)',
        }}>
          Ortho<span style={{ color: 'var(--ds-primary)' }}>.</span><span style={{ color: 'var(--ds-accent)' }}>ia</span>
        </span>
      </Link>
      <button
        className="lg:hidden"
        onClick={() => setSidebarOpen(false)}
        aria-label="Fermer le menu"
        style={{
          background: 'transparent', border: 0, padding: 6, color: 'var(--fg-2)',
          cursor: 'pointer',
        }}
      >
        <X size={18} />
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--fg-1)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar — fixed sur desktop, drawer sur mobile */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, zIndex: 50, height: '100vh', width: 240,
          transition: 'transform 200ms cubic-bezier(0.32,0.72,0,1)',
        }}
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <Sidebar
          activeHref={pathname}
          items={navItems.map(it => ({
            ...it,
            onClick: () => setSidebarOpen(false),
          }))}
          header={sidebarHeader}
          footer={sidebarFooter}
          width={240}
          style={{ height: '100%' }}
        />
      </div>

      {/* Contenu principal — décalé de la largeur sidebar sur desktop */}
      <div className="lg:pl-[240px]">
        {/* Mini header avec breadcrumb + theme toggle */}
        <AppHeader
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--fg-3)' }}>
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Ouvrir le menu"
                style={{
                  background: 'transparent', border: 0, padding: 4, color: 'var(--fg-2)',
                  cursor: 'pointer',
                }}
              >
                <Menu size={20} />
              </button>
              <Link href="/dashboard" style={{ color: 'var(--fg-3)', textDecoration: 'none' }}>Dashboard</Link>
              {pathname !== '/dashboard' && (
                <>
                  <ChevronRight size={14} style={{ color: 'var(--fg-3)' }} />
                  <span style={{ color: 'var(--fg-1)', fontWeight: 600 }}>{pageLabel}</span>
                </>
              )}
            </span>
          }
          right={<ThemeToggle />}
        />

        <main style={{ padding: '24px 32px 64px' }}>
          {children}
        </main>
        <FeedbackButton />
      </div>

    </div>
  )
}

function SymbolLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="var(--ds-primary)" />
      <path d="M10 16c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="var(--fg-on-brand)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="22" cy="22" r="3" fill="var(--ds-accent)" />
    </svg>
  )
}
