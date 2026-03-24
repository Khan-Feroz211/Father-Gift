export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7'
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className={`${sz} border-2 border-navy-200 border-t-gold rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}
