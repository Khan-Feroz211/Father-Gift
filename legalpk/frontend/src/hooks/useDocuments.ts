import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Document, DocumentType } from '../types'

interface GenerateDocRequest {
  case_id: string
  document_type: DocumentType
  title: string
  additional_instructions?: string
}

export function useGetDocuments(case_id?: string) {
  const params = case_id ? `?case_id=${case_id}` : ''
  return useQuery<{ items: Document[]; total: number }>({
    queryKey: ['documents', case_id],
    queryFn: () => api.get(`/documents/${params}`).then((r) => r.data),
  })
}

export function useGenerateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GenerateDocRequest) =>
      api.post('/documents/generate', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document generated successfully')
    },
    onError: () => toast.error('Failed to generate document'),
  })
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (id: string) => {
      const resp = await api.get(`/documents/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([resp.data]))
      const link = document.createElement('a')
      link.href = url
      const disposition = resp.headers['content-disposition'] || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      link.download = match?.[1] ?? 'document.docx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
    onError: () => toast.error('Failed to download document'),
  })
}
