import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Client, PaginatedResponse } from '../types'

interface ClientsFilter {
  page?: number
  page_size?: number
  search?: string
}

export function useGetClients(filters: ClientsFilter = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.page_size) params.set('page_size', String(filters.page_size))
  if (filters.search) params.set('search', filters.search)

  return useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', filters],
    queryFn: () => api.get(`/clients/?${params}`).then((r) => r.data),
  })
}

export function useGetClient(id: string) {
  return useQuery<Client>({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.post('/clients/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client added')
    },
    onError: () => toast.error('Failed to add client'),
  })
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Client>) => api.put(`/clients/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', id] })
      toast.success('Client updated')
    },
    onError: () => toast.error('Failed to update client'),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client removed')
    },
    onError: () => toast.error('Failed to remove client'),
  })
}
