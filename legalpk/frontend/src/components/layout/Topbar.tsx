import { useLocation } from 'react-router-dom'
import { LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const BREADCRUMBS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cases': 'Cases',
  '/clients': 'Clients',
  '/hearings': 'Hearings',
  '/documents': 'Documents',
  '/search': 'Case Search',
  '/research': 'Legal Research',
  '/settings': 'Settings',
}

export default function Topbar() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    return { label: BREADCRUMBS[path] || seg, path }
  })

  return (
    <header className="h-14 bg-white border-b border-navy-100 flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm font-sans">
        <span className="text-navy-400">LegalPakistan</span>
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-navy-300" />
            <span
              className={
                i === crumbs.length - 1 ? 'text-navy-800 font-medium' : 'text-navy-400'
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* User Menu */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-navy-800 font-sans">{user?.full_name}</p>
          <p className="text-xs text-navy-400 font-sans">{user?.bar_number || 'Advocate'}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-navy-800 flex items-center justify-center">
          <span className="text-white text-sm font-serif">
            {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
