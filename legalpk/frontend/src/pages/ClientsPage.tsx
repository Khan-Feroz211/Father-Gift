import { useState } from 'react'
import { Plus, Search, Building2, User } from 'lucide-react'
import { useGetClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients'
import { useForm } from 'react-hook-form'
import { truncate } from '../lib/utils'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

export default function ClientsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editClient, setEditClient] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const qc = useQueryClient()
  const { data, isLoading } = useGetClients({ page, page_size: 20, search: search || undefined })
  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()

  const { register: regCreate, handleSubmit: handleCreate, reset: resetCreate } = useForm<any>()
  const { register: regEdit, handleSubmit: handleEditForm, reset: resetEdit } = useForm<any>()

  const onCreateSubmit = async (data: any) => {
    await createClient.mutateAsync(data)
    resetCreate()
    setShowCreate(false)
  }

  const onEditSubmit = async (data: any) => {
    try {
      await api.put(`/clients/${editClient.id}`, data)
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client updated')
    } catch {
      toast.error('Failed to update client')
    }
    resetEdit()
    setEditClient(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-navy-800">Clients</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="card py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, CNIC, or phone…"
            className="input-base pl-9"
          />
        </div>
      </div>

      {/* Client Grid */}
      {isLoading ? (
        <Spinner />
      ) : !data?.items.length ? (
        <EmptyState icon="users" message="No clients yet. Add your first client." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((c) => (
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-navy-100 flex items-center justify-center">
                    {c.is_organization ? (
                      <Building2 className="h-5 w-5 text-navy-600" />
                    ) : (
                      <User className="h-5 w-5 text-navy-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-navy-800 font-sans">{c.full_name}</h3>
                    {c.is_organization && (
                      <span className="text-xs text-navy-400 font-sans">Organisation</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm text-navy-600 font-sans">
                {c.cnic && <p>CNIC: {c.cnic}</p>}
                {c.phone && <p>📞 {c.phone}</p>}
                {c.email && <p>✉️ {truncate(c.email, 30)}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setEditClient(c); resetEdit(c) }}
                  className="btn-ghost text-xs px-3 py-1.5 flex-1"
                >

                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(c.id)}
                  className="text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg transition-colors flex-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost text-sm px-3 py-1 disabled:opacity-40">Previous</button>
          <span className="text-sm text-navy-600 font-sans px-3 py-1">Page {page} of {data.total_pages}</span>
          <button disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost text-sm px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Client">
        <form onSubmit={handleCreate(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Full Name *</label>
            <input {...regCreate('full_name', { required: true })} className="input-base" placeholder="Muhammad Ali" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">CNIC (13 digits)</label>
              <input {...regCreate('cnic')} className="input-base" placeholder="3520212345678" maxLength={13} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Phone</label>
              <input {...regCreate('phone')} className="input-base" placeholder="+92 300 1234567" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
            <input {...regCreate('email')} type="email" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Address</label>
            <textarea {...regCreate('address')} rows={2} className="input-base resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input {...regCreate('is_organization')} type="checkbox" className="h-4 w-4 accent-gold" id="is_org" />
            <label htmlFor="is_org" className="text-sm text-navy-700 font-sans">Organisation/Company</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={createClient.isPending} className="btn-primary">
              {createClient.isPending ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { await deleteClient.mutateAsync(deleteId!); setDeleteId(null) }}
        title="Remove Client"
        message="Are you sure you want to remove this client?"
      />

      {/* Edit Modal */}
      <Modal isOpen={!!editClient} onClose={() => setEditClient(null)} title="Edit Client">
        <form onSubmit={handleEditForm(onEditSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Full Name *</label>
            <input {...regEdit('full_name', { required: true })} className="input-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">CNIC</label>
              <input {...regEdit('cnic')} className="input-base" maxLength={13} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Phone</label>
              <input {...regEdit('phone')} className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Address</label>
            <textarea {...regEdit('address')} rows={2} className="input-base resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
            <textarea {...regEdit('notes')} rows={2} className="input-base resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditClient(null)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
