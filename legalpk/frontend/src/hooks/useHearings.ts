import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Hearing } from '../types'

interface HearingsFilter {
  case_id?: string
  upcoming_only?: boolean
}

export function useGetHearings(filters: HearingsFilter = {}) {
  const params = new URLSearchParams()
  if (filters.case_id) params.set('case_id', filters.case_id)
  if (filters.upcoming_only) params.set('upcoming_only', 'true')

  return useQuery<{ items: Hearing[]; total: number }>({
    queryKey: ['hearings', filters],
    queryFn: () => api.get(`/hearings/?${params}`).then((r) => r.data),
  })
}

export function useCreateHearing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Hearing>) => api.post('/hearings/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hearings'] })
      qc.invalidateQueries({ queryKey: ['cases'] })
      toast.success('Hearing scheduled')
    },
    onError: () => toast.error('Failed to schedule hearing'),
  })
}

export function useUpdateHearing(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Hearing>) => api.put(`/hearings/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hearings'] })
      toast.success('Hearing updated')
    },
    onError: () => toast.error('Failed to update hearing'),
  })
}

export function useDeleteHearing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/hearings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hearings'] })
      toast.success('Hearing removed')
    },
    onError: () => toast.error('Failed to remove hearing'),
  })
}
