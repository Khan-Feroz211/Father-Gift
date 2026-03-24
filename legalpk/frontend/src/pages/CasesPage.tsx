import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { useGetCases, useCreateCase } from '../hooks/useCases'
import { useForm } from 'react-hook-form'
import { formatPKDate, truncate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import type { CaseType, CaseStatus } from '../types'

const CASE_TYPES: CaseType[] = [
  'criminal', 'civil', 'family', 'constitutional', 'commercial', 'writ', 'revenue', 'labour', 'other',
]

export default function CasesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useGetCases({
    page,
    page_size: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    case_type: typeFilter || undefined,
  })

  const createCase = useCreateCase()
  const { register, handleSubmit, reset } = useForm<any>()

  const onCreateSubmit = async (formData: any) => {
    await createCase.mutateAsync(formData)
    reset()
    setShowCreate(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-navy-800">Cases</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Case
        </button>
      </div>

      {/* Filters */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by title or case number…"
              className="input-base pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input-base w-auto"
          >
            <option value="">All Status</option>
            {(['active', 'pending', 'disposed', 'adjourned', 'stayed', 'appealed'] as CaseStatus[]).map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="input-base w-auto"
          >
            <option value="">All Types</option>
            {CASE_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8"><Spinner /></div>
        ) : !data?.items.length ? (
          <EmptyState icon="briefcase" message="No cases found. Create your first case." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy-800 text-white">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium font-sans">Title</th>
                    <th className="text-left px-4 py-3 font-medium font-sans">Case No.</th>
                    <th className="text-left px-4 py-3 font-medium font-sans">Type</th>
                    <th className="text-left px-4 py-3 font-medium font-sans">Status</th>
                    <th className="text-left px-4 py-3 font-medium font-sans">Next Hearing</th>
                    <th className="text-left px-4 py-3 font-medium font-sans">Court</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {data.items.map((c) => (
                    <tr key={c.id} className="hover:bg-cream transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/cases/${c.id}`} className="text-navy-800 hover:text-gold font-medium font-sans">
                          {truncate(c.title, 50)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-navy-500 font-sans">{c.case_number || '—'}</td>
                      <td className="px-4 py-3 text-navy-600 font-sans capitalize">{c.case_type}</td>
                      <td className="px-4 py-3"><Badge status={c.status} /></td>
                      <td className="px-4 py-3 text-navy-600 font-sans">{formatPKDate(c.next_hearing_date)}</td>
                      <td className="px-4 py-3 text-navy-500 font-sans">{truncate(c.court_name || '—', 30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-navy-50">
              <p className="text-sm text-navy-500 font-sans">
                {data.total} total cases
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-ghost px-3 py-1 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-navy-600 font-sans">
                  Page {page} of {data.total_pages}
                </span>
                <button
                  disabled={page >= data.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-ghost px-3 py-1 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Case">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Case Title *</label>
            <input {...register('title', { required: true })} className="input-base" placeholder="e.g. State vs. Ahmad Khan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Case Type</label>
              <select {...register('case_type')} className="input-base">
                {CASE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Case Number</label>
              <input {...register('case_number')} className="input-base" placeholder="FIR-2024-001" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Court</label>
            <input {...register('court_name')} className="input-base" placeholder="e.g. Sessions Court Lahore" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Facts (brief)</label>
            <textarea {...register('facts')} rows={3} className="input-base resize-none" placeholder="Brief facts of the case…" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={createCase.isPending} className="btn-primary">
              {createCase.isPending ? 'Creating…' : 'Create Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
