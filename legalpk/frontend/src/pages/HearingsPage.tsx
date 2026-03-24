import { useState } from 'react'
import { Calendar, Plus } from 'lucide-react'
import { useGetHearings, useCreateHearing, useDeleteHearing } from '../hooks/useHearings'
import { useGetCases } from '../hooks/useCases'
import { useForm } from 'react-hook-form'
import { formatPKDate } from '../lib/utils'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { HearingPurpose } from '../types'

const PURPOSES: HearingPurpose[] = [
  'arguments', 'evidence', 'framing_charges', 'bail', 'judgment',
  'written_statement', 'mediation', 'other',
]

export default function HearingsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [upcomingOnly, setUpcomingOnly] = useState(true)

  const { data, isLoading } = useGetHearings({ upcoming_only: upcomingOnly })
  const { data: casesData } = useGetCases({ page_size: 100 })
  const createHearing = useCreateHearing()
  const deleteHearing = useDeleteHearing()

  const { register, handleSubmit, reset } = useForm<any>()

  const onSubmit = async (data: any) => {
    await createHearing.mutateAsync(data)
    reset()
    setShowCreate(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-navy-800">Hearings</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-navy-600 font-sans cursor-pointer">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => setUpcomingOnly(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Upcoming only
          </label>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Schedule Hearing
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState icon="calendar" message="No hearings found." />
      ) : (
        <div className="space-y-3">
          {data.items.map((h) => {
            const caseTitle = casesData?.items.find((c) => c.id === h.case_id)?.title || h.case_id
            return (
              <div
                key={h.id}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gold-50 flex flex-col items-center justify-center border border-gold-100">
                    <span className="text-xs text-gold-600 font-sans uppercase">
                      {new Date(h.hearing_date).toLocaleDateString('en', { month: 'short' })}
                    </span>
                    <span className="text-xl font-serif font-bold text-gold">
                      {new Date(h.hearing_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-navy-800 font-sans">{caseTitle}</p>
                    <p className="text-sm text-navy-500 font-sans capitalize">
                      {h.purpose.replace('_', ' ')}
                      {h.hearing_time ? ` · ${h.hearing_time}` : ''}
                      {h.courtroom ? ` · Room ${h.courtroom}` : ''}
                    </p>
                    {h.outcome && (
                      <p className="text-xs text-green-700 font-sans mt-0.5">✓ {h.outcome}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {h.reminder_sent && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-sans">
                      Reminder sent
                    </span>
                  )}
                  <button
                    onClick={() => setDeleteId(h.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs font-sans transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Schedule Hearing">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Case *</label>
            <select {...register('case_id', { required: true })} className="input-base">
              <option value="">Select case…</option>
              {casesData?.items.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Date *</label>
            <input {...register('hearing_date', { required: true })} type="date" className="input-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Time</label>
              <input {...register('hearing_time')} type="time" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Courtroom</label>
              <input {...register('courtroom')} className="input-base" placeholder="Court No. 3" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Purpose</label>
            <select {...register('purpose')} className="input-base">
              {PURPOSES.map((p) => (
                <option key={p} value={p} className="capitalize">{p.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
            <textarea {...register('notes')} rows={2} className="input-base resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={createHearing.isPending} className="btn-primary">
              {createHearing.isPending ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { await deleteHearing.mutateAsync(deleteId!); setDeleteId(null) }}
        title="Remove Hearing"
        message="Remove this hearing record?"
      />
    </div>
  )
}
