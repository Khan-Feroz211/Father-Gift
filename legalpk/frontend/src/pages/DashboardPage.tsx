import { Link } from 'react-router-dom'
import { Scale, Briefcase, Users, Calendar, FileText, TrendingUp, Clock } from 'lucide-react'
import { useGetCases } from '../hooks/useCases'
import { useGetHearings } from '../hooks/useHearings'
import { formatPKDate, truncate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: casesData, isLoading: casesLoading } = useGetCases({ page_size: 5 })
  const { data: hearingsData, isLoading: hearingsLoading } = useGetHearings({ upcoming_only: true })
  const { data: activeCases } = useGetCases({ status: 'active', page_size: 1 })
  const { data: pendingCases } = useGetCases({ status: 'pending', page_size: 1 })

  const stats = [
    {
      label: 'Total Cases',
      value: casesData?.total ?? '—',
      icon: Briefcase,
      color: 'text-navy-700',
      bg: 'bg-navy-50',
      href: '/cases',
    },
    {
      label: 'Active Cases',
      value: activeCases?.total ?? '—',
      icon: TrendingUp,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      href: '/cases?status=active',
    },
    {
      label: 'Pending Cases',
      value: pendingCases?.total ?? '—',
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      href: '/cases?status=pending',
    },
    {
      label: 'Upcoming Hearings',
      value: hearingsData?.total ?? '—',
      icon: Calendar,
      color: 'text-gold-700',
      bg: 'bg-gold-50',
      href: '/hearings',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl text-navy-800">
          Welcome back, {user?.full_name?.split(' ')[0] ?? 'Advocate'}
        </h1>
        <p className="text-navy-500 text-sm mt-1 font-sans">
          {user?.court_name ? `${user.court_name} · ` : ''}
          {new Date().toLocaleDateString('en-PK', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Karachi',
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.href}
            className="card hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-navy-500 font-sans">{s.label}</p>
                <p className="text-3xl font-serif font-semibold text-navy-800 mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Hearings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-navy-800">Upcoming Hearings</h2>
            <Link to="/hearings" className="text-sm text-gold hover:underline font-sans">
              View all
            </Link>
          </div>
          {hearingsLoading ? (
            <Spinner />
          ) : hearingsData?.items.length === 0 ? (
            <p className="text-navy-400 text-sm font-sans text-center py-6">
              No upcoming hearings scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {hearingsData?.items.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2 border-b border-navy-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gold-50 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-800 font-sans">
                        {truncate(h.case_id, 30)}
                      </p>
                      <p className="text-xs text-navy-400 font-sans capitalize">
                        {h.purpose.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gold font-sans whitespace-nowrap">
                    {formatPKDate(h.hearing_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Cases */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-navy-800">Recent Cases</h2>
            <Link to="/cases" className="text-sm text-gold hover:underline font-sans">
              View all
            </Link>
          </div>
          {casesLoading ? (
            <Spinner />
          ) : casesData?.items.length === 0 ? (
            <p className="text-navy-400 text-sm font-sans text-center py-6">
              No cases yet —{' '}
              <Link to="/cases" className="text-gold hover:underline">
                create one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {casesData?.items.map((c) => (
                <Link
                  key={c.id}
                  to={`/cases/${c.id}`}
                  className="flex items-center justify-between py-2 border-b border-navy-50 last:border-0 hover:bg-cream rounded px-2 -mx-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-800 font-sans">
                      {truncate(c.title, 40)}
                    </p>
                    <p className="text-xs text-navy-400 font-sans capitalize">
                      {c.case_type} · {c.court_name || 'No court set'}
                    </p>
                  </div>
                  <Badge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
