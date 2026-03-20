import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { SearchResult } from '../types'

interface SearchRequest {
  query: string
  top_k?: number
}

interface SearchResponse {
  query: string
  results: SearchResult[]
  total: number
}

export function useSemanticSearch() {
  return useMutation<SearchResponse, Error, SearchRequest>({
    mutationFn: (data) => api.post('/search/semantic', data).then((r) => r.data),
    onError: () => toast.error('Search failed'),
  })
}
