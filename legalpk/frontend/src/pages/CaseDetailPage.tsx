import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Calendar, FileText, Save, X } from 'lucide-react'
import { useGetCase, useUpdateCase, useDeleteCase } from '../hooks/useCases'
import { useGetHearings, useCreateHearing } from '../hooks/useHearings'
import { useGetDocuments } from '../hooks/useDocuments'
import { useForm } from 'react-hook-form'
import { formatPKDate, truncate } from '../lib/utils'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { HearingPurpose } from '../types'

const TABS = ['Info', 'Hearings', 'Documents'] as const
type Tab = typeof TABS[number]

const HEARING_PURPOSES: HearingPurpose[] = [
  'arguments', 'evidence', 'framing_charges', 'bail', 'judgment',
  'written_statement', 'mediation', 'other',
]

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Info')
  const [editing, setEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showHearingModal, setShowHearingModal] = useState(false)

  const { data: caseData, isLoading } = useGetCase(id!)
  const updateCase = useUpdateCase(id!)
  const deleteCase = useDeleteCase()
  const { data: hearingsData } = useGetHearings({ case_id: id })
  const { data: docsData } = useGetDocuments(id)
  const createHearing = useCreateHearing()

  const { register: regEdit, handleSubmit: handleEdit, reset: resetEdit } = useForm<any>()
  const { register: regHearing, handleSubmit: handleHearing, reset: resetHearing } = useForm<any>()

  if (isLoading) return <div className="p-8"><Spinner /></div>
  if (!caseData) return <div className="p-8 text-red-600">Case not found</div>

  const onEditSubmit = async (data: any) => {
    await updateCase.mutateAsync(data)
    setEditing(false)
  }

  const onDeleteConfirm = async () => {
    await deleteCase.mutateAsync(id!)
    navigate('/cases')
  }

  const onHearingSubmit = async (data: any) => {
    await createHearing.mutateAsync({ ...data, case_id: id })
    resetHearing()
    setShowHearingModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/cases" className="inline-flex items-center gap-1 text-sm text-navy-500 hover:text-gold mb-2 font-sans">
            <ArrowLeft className="h-4 w-4" /> Back to Cases
          </Link>
          <h1 className="font-serif text-3xl text-navy-800">{caseData.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge status={caseData.status} />
            <span className="text-sm text-navy-500 capitalize font-sans">{caseData.case_type}</span>
            {caseData.case_number && (
              <span className="text-sm text-navy-500 font-sans">#{caseData.case_number}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(true); resetEdit(caseData) }} className="btn-ghost flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Edit
          </button>
          <button onClick={() => setShowDelete(true)} className="btn-danger flex items-center gap-1 text-sm">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-navy-100">
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium font-sans border-b-2 transition-colors ${
                tab === t
                  ? 'border-gold text-gold'
                  : 'border-transparent text-navy-500 hover:text-navy-800'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tab === 'Info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h3 className="font-serif text-lg text-navy-800">Court Details</h3>
            <Field label="Court" value={caseData.court_name} />
            <Field label="District" value={caseData.court_district} />
            <Field label="Judge" value={caseData.judge_name} />
            <Field label="Filing Date" value={formatPKDate(caseData.filing_date)} />
            <Field label="Next Hearing" value={formatPKDate(caseData.next_hearing_date)} />
          </div>
          <div className="card space-y-4">
            <h3 className="font-serif text-lg text-navy-800">Opponent Details</h3>
            <Field label="Opponent" value={caseData.opponent_name} />
            <Field label="Opp. Advocate" value={caseData.opponent_advocate} />
            <Field label="FIR No." value={caseData.fir_number} />
            <Field label="Police Station" value={caseData.ps_name} />
          </div>
          <div className="card lg:col-span-2 space-y-4">
            <h3 className="font-serif text-lg text-navy-800">Case Facts & Legal Issues</h3>
            <div>
              <p className="text-xs uppercase tracking-wider text-navy-400 font-sans mb-1">Facts</p>
              <p className="text-navy-700 font-sans text-sm whitespace-pre-wrap">{caseData.facts || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-navy-400 font-sans mb-1">Legal Issues</p>
              <p className="text-navy-700 font-sans text-sm whitespace-pre-wrap">{caseData.legal_issues || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-navy-400 font-sans mb-1">Notes</p>
              <p className="text-navy-700 font-sans text-sm whitespace-pre-wrap">{caseData.notes || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'Hearings' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl text-navy-800">Hearings</h3>
            <button onClick={() => setShowHearingModal(true)} className="btn-primary flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" /> Schedule
            </button>
          </div>
          {!hearingsData?.items.length ? (
            <p className="text-navy-400 text-sm font-sans text-center py-6">No hearings scheduled</p>
          ) : (
            <div className="space-y-3">
              {hearingsData.items.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border border-navy-50 hover:bg-cream">
                  <div>
                    <p className="font-medium text-navy-800 font-sans">{formatPKDate(h.hearing_date)}</p>
                    <p className="text-sm text-navy-500 font-sans capitalize">
                      {h.purpose.replace('_', ' ')} {h.courtroom ? `· Room ${h.courtroom}` : ''}
                    </p>
                    {h.outcome && <p className="text-xs text-green-700 font-sans mt-1">Outcome: {h.outcome}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-sans ${h.reminder_sent ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    {h.reminder_sent ? 'Reminder sent' : 'Pending reminder'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Documents' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-xl text-navy-800">Documents</h3>
            <Link to="/documents" className="btn-primary flex items-center gap-1 text-sm">
              <FileText className="h-4 w-4" /> Draft Document
            </Link>
          </div>
          {!docsData?.items.length ? (
            <p className="text-navy-400 text-sm font-sans text-center py-6">No documents generated yet</p>
          ) : (
            <div className="space-y-2">
              {docsData.items.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-navy-50">
                  <div>
                    <p className="font-medium text-navy-800 font-sans text-sm">{d.title}</p>
                    <p className="text-xs text-navy-400 font-sans capitalize">
                      {d.document_type.replace('_', ' ')} · {formatPKDate(d.generated_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Case">
        <form onSubmit={handleEdit(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Title</label>
            <input {...regEdit('title')} className="input-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Status</label>
              <select {...regEdit('status')} className="input-base">
                {['active','pending','disposed','adjourned','stayed','appealed'].map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Judge</label>
              <input {...regEdit('judge_name')} className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Facts</label>
            <textarea {...regEdit('facts')} rows={4} className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Legal Issues</label>
            <textarea {...regEdit('legal_issues')} rows={3} className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
            <textarea {...regEdit('notes')} rows={2} className="input-base resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={updateCase.isPending} className="btn-primary flex items-center gap-1">
              <Save className="h-4 w-4" /> {updateCase.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Hearing Modal */}
      <Modal isOpen={showHearingModal} onClose={() => setShowHearingModal(false)} title="Schedule Hearing">
        <form onSubmit={handleHearing(onHearingSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Date *</label>
            <input {...regHearing('hearing_date', { required: true })} type="date" className="input-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Time</label>
              <input {...regHearing('hearing_time')} type="time" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Courtroom</label>
              <input {...regHearing('courtroom')} className="input-base" placeholder="e.g. Court No. 3" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Purpose</label>
            <select {...regHearing('purpose')} className="input-base">
              {HEARING_PURPOSES.map((p) => <option key={p} value={p} className="capitalize">{p.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
            <textarea {...regHearing('notes')} rows={2} className="input-base resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowHearingModal(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={createHearing.isPending} className="btn-primary">
              {createHearing.isPending ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={onDeleteConfirm}
        title="Delete Case"
        message={`Are you sure you want to delete "${caseData.title}"? This action cannot be undone.`}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs uppercase tracking-wider text-navy-400 font-sans w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-navy-700 font-sans">{value || '—'}</span>
    </div>
  )
}
