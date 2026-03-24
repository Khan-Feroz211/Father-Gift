import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Case, PaginatedResponse } from '../types'

interface CasesFilter {
  page?: number
  page_size?: number
  status?: string
  case_type?: string
  search?: string
}

export function useGetCases(filters: CasesFilter = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.page_size) params.set('page_size', String(filters.page_size))
  if (filters.status) params.set('status', filters.status)
  if (filters.case_type) params.set('case_type', filters.case_type)
  if (filters.search) params.set('search', filters.search)

  return useQuery<PaginatedResponse<Case>>({
    queryKey: ['cases', filters],
    queryFn: () => api.get(`/cases/?${params}`).then((r) => r.data),
  })
}

export function useGetCase(id: string) {
  return useQuery<Case>({
    queryKey: ['case', id],
    queryFn: () => api.get(`/cases/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Case>) => api.post('/cases/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Case created successfully')
    },
    onError: () => toast.error('Failed to create case'),
  })
}

export function useUpdateCase(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Case>) => api.put(`/cases/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] })
      qc.invalidateQueries({ queryKey: ['case', id] })
      toast.success('Case updated')
    },
    onError: () => toast.error('Failed to update case'),
  })
}

export function useDeleteCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cases/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Case deleted')
    },
    onError: () => toast.error('Failed to delete case'),
  })
}
