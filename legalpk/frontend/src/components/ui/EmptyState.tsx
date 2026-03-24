import { Briefcase, Users, Calendar, FileText, Search, Inbox } from 'lucide-react'

const ICONS = {
  briefcase: Briefcase,
  users: Users,
  calendar: Calendar,
  files: FileText,
  search: Search,
  default: Inbox,
} as const

interface EmptyStateProps {
  icon?: keyof typeof ICONS
  message: string
  action?: React.ReactNode
}

export default function EmptyState({ icon = 'default', message, action }: EmptyStateProps) {
  const Icon = ICONS[icon] ?? ICONS.default
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-navy-300" />
      </div>
      <p className="text-navy-400 font-sans text-sm max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
