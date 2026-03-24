import type { CaseStatus } from '../../types'

const STATUS_CLASSES: Record<CaseStatus, string> = {
  active: 'badge-active',
  pending: 'badge-pending',
  disposed: 'badge-disposed',
  adjourned: 'badge-adjourned',
  stayed: 'badge-stayed',
  appealed: 'badge-appealed',
}

interface BadgeProps {
  status: CaseStatus
}

export default function Badge({ status }: BadgeProps) {
  return (
    <span className={STATUS_CLASSES[status] || 'badge-adjourned'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
