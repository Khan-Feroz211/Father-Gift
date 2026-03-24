import { useState } from 'react'
import { BookOpen, Loader2, Lightbulb } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import toast from 'react-hot-toast'

const QUICK_REFS = [
  { label: 'Bail under CrPC', query: 'Bail application requirements under CrPC 1898 sections 496-502 for non-bailable offences' },
  { label: 'Article 199 Writ', query: 'Grounds and procedure for Constitutional Petition under Article 199 of Constitution of Pakistan 1973' },
  { label: 'Temporary Injunction', query: 'Three-pronged test for temporary injunction under Order XXXIX CPC 1908 in Pakistan' },
  { label: 'CNIC Divorce', query: 'Divorce procedure under Muslim Family Laws Ordinance 1961 and Family Courts Act 1964' },
  { label: 'Criminal Revision', query: 'Grounds for criminal revision petition under sections 435-439 CrPC 1898' },
  { label: 'Qanun-e-Shahadat', query: 'Burden of proof and admissibility of evidence under Qanun-e-Shahadat Order 1984' },
]

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const research = useMutation({
    mutationFn: (data: { query: string; context?: string }) =>
      api.post('/research/research', data).then((r) => r.data),
    onSuccess: (data) => setResult(data.answer),
    onError: () => toast.error('Research failed. Check your API key.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      research.mutate({ query: query.trim(), context: context.trim() || undefined })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-navy-800">AI Legal Research</h1>
        <p className="text-navy-500 text-sm mt-1 font-sans">
          Pakistan-specific legal research: PPC, CrPC, CPC, Constitution 1973, Qanun-e-Shahadat
        </p>
      </div>

      {/* Quick References */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-gold" />
          <h2 className="font-sans font-medium text-navy-700 text-sm">Quick References</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_REFS.map((ref) => (
            <button
              key={ref.label}
              onClick={() => setQuery(ref.query)}
              className="text-xs px-3 py-1.5 rounded-full border border-gold-200 text-gold-700 hover:bg-gold-50 transition-colors font-sans"
            >
              {ref.label}
            </button>
          ))}
        </div>
      </div>

      {/* Research Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1 font-sans">
              Legal Research Query *
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              placeholder="e.g. What are the relevant sections of PPC for murder charges and defences available to the accused?"
              className="input-base resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1 font-sans">
              Case Context (optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
              placeholder="Brief facts relevant to your research query…"
              className="input-base resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={research.isPending || !query.trim()}
              className="btn-gold flex items-center gap-2"
            >
              {research.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Researching…</>
              ) : (
                <><BookOpen className="h-4 w-4" /> Research</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-gold" />
            <h2 className="font-serif text-xl text-navy-800">Research Result</h2>
          </div>
          <div className="prose prose-sm max-w-none">
            <div className="text-navy-700 font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-navy-50 flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result)
                toast.success('Copied to clipboard')
              }}
              className="btn-ghost text-sm"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {!result && !research.isPending && (
        <div className="card text-center py-12">
          <BookOpen className="h-12 w-12 text-navy-200 mx-auto mb-4" />
          <p className="text-navy-400 font-sans">
            Enter a legal query to get Pakistan-specific research with citations
          </p>
        </div>
      )}
    </div>
  )
}
