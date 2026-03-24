import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  FileText,
  Search,
  BookOpen,
  Settings,
  Scale,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  children?: { label: string; to: string; icon: React.ElementType }[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases', to: '/cases', icon: Briefcase },
  { label: 'Hearings', to: '/hearings', icon: Calendar },
  { label: 'Clients', to: '/clients', icon: Users },
  {
    label: 'AI Tools',
    to: '#',
    icon: Scale,
    children: [
      { label: 'Draft Documents', to: '/documents', icon: FileText },
      { label: 'Case Search', to: '/search', icon: Search },
      { label: 'Legal Research', to: '/research', icon: BookOpen },
    ],
  },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  const [aiOpen, setAiOpen] = useState(true)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors ${
      isActive
        ? 'bg-gold text-white font-medium'
        : 'text-navy-200 hover:bg-navy-700 hover:text-white'
    }`

  return (
    <aside className="w-64 bg-navy-800 flex flex-col shrink-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
        <Scale className="h-7 w-7 text-gold shrink-0" />
        <div>
          <h1 className="font-serif text-white text-lg leading-tight">LegalPakistan</h1>
          <p className="text-navy-400 text-xs font-sans">Practice Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => {
          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setAiOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-sans text-navy-200 hover:bg-navy-700 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </div>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {aiOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-navy-700 pl-3">
                    {item.children.map((child) => (
                      <NavLink key={child.to} to={child.to} className={linkClass}>
                        <child.icon className="h-4 w-4 shrink-0" />
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom brand */}
      <div className="px-5 py-4 border-t border-navy-700">
        <p className="text-xs text-navy-500 font-sans">⚖️ LegalPakistan v1.0</p>
      </div>
    </aside>
  )
}
