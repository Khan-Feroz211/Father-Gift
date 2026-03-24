import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import { useGetDocuments, useGenerateDocument, useDownloadDocument } from '../hooks/useDocuments'
import { useGetCases } from '../hooks/useCases'
import { useForm } from 'react-hook-form'
import { formatPKDate } from '../lib/utils'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import type { DocumentType } from '../types'

const DOC_TYPES: { type: DocumentType; label: string; desc: string; icon: string }[] = [
  { type: 'vakalatnama', label: 'Vakalatnama', desc: 'Power of attorney for court representation', icon: '📜' },
  { type: 'bail_application', label: 'Bail Application', desc: 'Under CrPC sections 496-502', icon: '🔓' },
  { type: 'written_statement', label: 'Written Statement', desc: 'Reply to plaint under Order VIII CPC', icon: '📝' },
  { type: 'constitutional_petition', label: 'Constitutional Petition', desc: 'Under Article 199 Constitution 1973', icon: '⚖️' },
  { type: 'civil_plaint', label: 'Civil Plaint', desc: 'Under Order VII CPC 1908', icon: '🏛️' },
  { type: 'injunction', label: 'Injunction', desc: 'Temporary injunction Order XXXIX CPC', icon: '🛑' },
  { type: 'appeal', label: 'Appeal', desc: 'Appeal against impugned judgment', icon: '📋' },
  { type: 'revision', label: 'Revision', desc: 'Revision petition to superior court', icon: '🔄' },
  { type: 'general_application', label: 'General Application', desc: 'Miscellaneous court application', icon: '📄' },
]

export default function DocumentsPage() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: docsData, isLoading: docsLoading } = useGetDocuments()
  const { data: casesData } = useGetCases({ page_size: 100 })
  const generateDoc = useGenerateDocument()
  const downloadDoc = useDownloadDocument()

  const { register, handleSubmit, reset } = useForm<any>()

  const onSubmit = async (data: any) => {
    await generateDoc.mutateAsync({
      ...data,
      document_type: selectedType!,
    })
    reset()
    setShowModal(false)
  }

  const openModal = (type: DocumentType) => {
    setSelectedType(type)
    setShowModal(true)
  }

  const selectedDocInfo = DOC_TYPES.find((d) => d.type === selectedType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy-800">AI Document Drafting</h1>
        <p className="text-navy-500 text-sm mt-1 font-sans">
          Generate court-ready documents powered by Claude AI with Pakistan-specific legal citations
        </p>
      </div>

      {/* Document Type Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOC_TYPES.map((doc) => (
          <button
            key={doc.type}
            onClick={() => openModal(doc.type)}
            className="card text-left hover:shadow-md hover:border-gold transition-all group border-2 border-transparent"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{doc.icon}</span>
              <div>
                <h3 className="font-serif text-base text-navy-800 group-hover:text-gold transition-colors">
                  {doc.label}
                </h3>
                <p className="text-xs text-navy-500 font-sans mt-1">{doc.desc}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gold font-sans font-medium">
              <FileText className="h-3 w-3" />
              Generate with AI
            </div>
          </button>
        ))}
      </div>

      {/* Generated Documents List */}
      <div className="card">
        <h2 className="font-serif text-xl text-navy-800 mb-4">Generated Documents</h2>
        {docsLoading ? (
          <Spinner />
        ) : !docsData?.items.length ? (
          <p className="text-navy-400 text-sm font-sans text-center py-6">
            No documents generated yet. Select a document type above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {docsData.items.map((doc) => {
              const typeInfo = DOC_TYPES.find((d) => d.type === doc.document_type)
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-navy-50 hover:bg-cream transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeInfo?.icon || '📄'}</span>
                    <div>
                      <p className="font-medium text-navy-800 font-sans text-sm">{doc.title}</p>
                      <p className="text-xs text-navy-400 font-sans">
                        {typeInfo?.label} · {formatPKDate(doc.generated_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDoc.mutate(doc.id)}
                    disabled={downloadDoc.isPending}
                    className="btn-gold flex items-center gap-1 text-xs px-3 py-1.5"
                  >
                    {downloadDoc.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                    Download
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Generate: ${selectedDocInfo?.label}`}
      >
        <p className="text-sm text-navy-500 font-sans mb-4">{selectedDocInfo?.desc}</p>
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
            <label className="block text-sm font-medium text-navy-700 mb-1">Document Title *</label>
            <input
              {...register('title', { required: true })}
              className="input-base"
              placeholder={`e.g. ${selectedDocInfo?.label} – State vs. Ahmad Khan`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Additional Instructions (optional)
            </label>
            <textarea
              {...register('additional_instructions')}
              rows={3}
              className="input-base resize-none"
              placeholder="Any specific details, prayers, or legal arguments to include…"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={generateDoc.isPending} className="btn-gold flex items-center gap-2">
              {generateDoc.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Document
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
