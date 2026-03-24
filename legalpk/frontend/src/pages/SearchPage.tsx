import { useState } from 'react'
import { Search, Loader2, ExternalLink } from 'lucide-react'
import { useSemanticSearch } from '../hooks/useSearch'
import { Link } from 'react-router-dom'
import type { SearchResult } from '../types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(10)
  const search = useSemanticSearch()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      search.mutate({ query: query.trim(), top_k: topK })
    }
  }

  const getSimilarityColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-100 text-green-800'
    if (pct >= 60) return 'bg-blue-100 text-blue-800'
    if (pct >= 40) return 'bg-amber-100 text-amber-800'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy-800">Semantic Case Search</h1>
        <p className="text-navy-500 text-sm mt-1 font-sans">
          Search across all case facts and legal issues using AI-powered semantic similarity (FAISS)
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1 font-sans">
              Describe the case facts or legal issue
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              placeholder="e.g. Bail application for accused in drug trafficking case under CNSA, prior convictions, flight risk assessment…"
              className="input-base resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm text-navy-600 font-sans">Results:</label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="input-base w-20"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={search.isPending || !query.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {search.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Searching…</>
              ) : (
                <><Search className="h-4 w-4" /> Search</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {search.data && (
        <div className="space-y-3">
          <p className="text-sm text-navy-500 font-sans">
            Found <strong>{search.data.total}</strong> similar cases for: "{search.data.query}"
          </p>
          {search.data.results.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-navy-400 font-sans">No similar cases found. Try different keywords.</p>
            </div>
          ) : (
            search.data.results.map((result: SearchResult) => (
              <div key={result.case_id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full font-sans ${getSimilarityColor(result.similarity_percent)}`}
                      >
                        {result.similarity_percent}% similar
                      </span>
                      <span className="text-xs text-navy-400 font-sans capitalize">
                        {result.case_type} · {result.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-navy-800">{result.title}</h3>
                    {result.snippet && (
                      <p className="text-sm text-navy-600 font-sans mt-2 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/cases/${result.case_id}`}
                    className="shrink-0 flex items-center gap-1 text-sm text-gold hover:underline font-sans"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!search.data && !search.isPending && (
        <div className="card text-center py-12">
          <Search className="h-12 w-12 text-navy-200 mx-auto mb-4" />
          <p className="text-navy-400 font-sans">
            Enter a legal query above to find similar cases using semantic search
          </p>
        </div>
      )}
    </div>
  )
}
